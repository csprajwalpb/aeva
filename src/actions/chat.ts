'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkOrCreateUser } from './user';
import { Conversation, Message } from '@/types/chat';

// Helper to authenticate user and return Prisma User record
async function getAuthenticatedUser() {
  const authSession = await auth();
  if (!authSession.userId) {
    throw new Error('Unauthorized');
  }

  const syncResult = await checkOrCreateUser();
  if (!syncResult.success || !syncResult.user) {
    throw new Error(syncResult.error || 'Failed to sync user');
  }

  return syncResult.user;
}

// 1. Fetch Conversations with optional search filter
export async function fetchConversations(searchQuery?: string) {
  try {
    const user = await getAuthenticatedUser();

    const dbConversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        title: searchQuery
          ? { contains: searchQuery, mode: 'insensitive' }
          : undefined,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // Map DB models to frontend types
    const mapped: Conversation[] = dbConversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      createdTime: conv.createdAt.getTime(),
      messages: conv.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt.getTime(),
      })),
    }));

    return { success: true, conversations: mapped };
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return { success: false, error: error.message || 'Failed to fetch conversations', conversations: [] };
  }
}

// 2. Create Conversation
export async function createConversation(title: string) {
  try {
    const user = await getAuthenticatedUser();

    const newConv = await prisma.conversation.create({
      data: {
        title,
        userId: user.id,
      },
    });

    const mapped: Conversation = {
      id: newConv.id,
      title: newConv.title,
      createdTime: newConv.createdAt.getTime(),
      messages: [],
    };

    return { success: true, conversation: mapped };
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message || 'Failed to create conversation', conversation: null };
  }
}

// 3. Rename Conversation
export async function renameConversation(id: string, title: string) {
  try {
    const user = await getAuthenticatedUser();

    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: 'Conversation not found or unauthorized' };
    }

    await prisma.conversation.update({
      where: { id },
      data: { title },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error renaming conversation:', error);
    return { success: false, error: error.message || 'Failed to rename conversation' };
  }
}

// 4. Delete Conversation
export async function deleteConversation(id: string) {
  try {
    const user = await getAuthenticatedUser();

    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: 'Conversation not found or unauthorized' };
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: error.message || 'Failed to delete conversation' };
  }
}

// 5. Save Message to conversation and trigger updatedAt bump
export async function createMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  try {
    const user = await getAuthenticatedUser();

    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: 'Conversation not found or unauthorized', message: null };
    }

    // Create message and touch conversation's updatedAt
    const [msg] = await prisma.$transaction([
      prisma.message.create({
        data: {
          role,
          content,
          conversationId,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const mapped: Message = {
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt.getTime(),
    };

    return { success: true, message: mapped };
  } catch (error: any) {
    console.error('Error creating message:', error);
    return { success: false, error: error.message || 'Failed to save message', message: null };
  }
}

// 6. Import conversations from localStorage format
export async function importConversations(localChats: any[]) {
  try {
    const user = await getAuthenticatedUser();

    if (!Array.isArray(localChats) || localChats.length === 0) {
      return { success: false, error: 'Invalid or empty conversations list' };
    }

    // Create database records inside transaction for atomicity
    await prisma.$transaction(async (tx: any) => {
      for (const chat of localChats) {
        // Create conversation
        const dbConv = await tx.conversation.create({
          data: {
            title: chat.title || 'Imported Chat',
            userId: user.id,
            createdAt: chat.createdTime ? new Date(chat.createdTime) : new Date(),
            updatedAt: chat.createdTime ? new Date(chat.createdTime) : new Date(),
          },
        });

        // Insert messages
        if (Array.isArray(chat.messages) && chat.messages.length > 0) {
          const messagesData = chat.messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content || '',
            conversationId: dbConv.id,
            createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));

          await tx.message.createMany({
            data: messagesData,
          });

          // Set conversation's updatedAt to the last message's timestamp if available
          const lastMsg = chat.messages[chat.messages.length - 1];
          if (lastMsg && lastMsg.timestamp) {
            await tx.conversation.update({
              where: { id: dbConv.id },
              data: { updatedAt: new Date(lastMsg.timestamp) },
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error migrating conversations:', error);
    return { success: false, error: error.message || 'Failed to import local conversations' };
  }
}

// 7. Delete the last message in a conversation (Helper for regeneration)
export async function deleteLastMessage(conversationId: string) {
  try {
    const user = await getAuthenticatedUser();
    
    // Find the latest message belonging to this conversation & user
    const lastMsg = await prisma.message.findFirst({
      where: {
        conversationId,
        conversation: {
          userId: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastMsg) {
      await prisma.message.delete({
        where: { id: lastMsg.id },
      });
      return { success: true };
    }
    
    return { success: false, error: 'No message found to delete' };
  } catch (error: any) {
    console.error('Error deleting last message:', error);
    return { success: false, error: error.message || 'Failed to delete last message' };
  }
}

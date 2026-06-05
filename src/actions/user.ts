'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function checkOrCreateUser() {
  try {
    const authSession = await auth();
    const clerkId = authSession.userId;
    if (!clerkId) {
      return { success: false, error: 'Unauthorized', user: null };
    }

    // Attempt to locate user in DB
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    // If not in DB, sync from Clerk details
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return { success: false, error: 'Could not fetch Clerk user profile details', user: null };
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        return { success: false, error: 'User does not have an active email address', user: null };
      }

      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Explorer';
      const imageUrl = clerkUser.imageUrl || '';

      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          imageUrl,
        },
      });
    }

    return { success: true, user };
  } catch (error: any) {
    console.error('Error synchronizing Clerk user with Prisma DB:', error);
    return { success: false, error: error.message || 'Database sync error', user: null };
  }
}

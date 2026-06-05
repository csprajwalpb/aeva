import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import ToastProvider from '@/providers/ToastProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aeva v0.2 | AI Assistant with Cloud Persistence',
  description: 'Aeva is a next-generation conversational AI assistant featuring Clerk accounts authentication, Neon PostgreSQL cloud storage, streaming Gemini AI connectivity, message regeneration, and a gorgeous Deep Obsidian dark UI design system.',
  keywords: ['Aeva', 'AI Assistant', 'Gemini AI', 'Next.js AI', 'Clerk Auth', 'Neon Postgres', 'Futuristic UI'],
  authors: [{ name: 'Aeva Development Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#0c0c0e',
          colorInputBackground: '#060608',
          colorInputText: '#f4f4f7',
          colorText: '#f4f4f7',
          colorTextSecondary: '#a1a1aa',
          colorTextOnPrimaryBackground: '#ffffff',
          borderRadius: '0.75rem',
        },
      }}
    >
      <html lang="en" className="h-full scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#060608] text-zinc-100 antialiased selection:bg-primary/30 selection:text-white`}
        >
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}

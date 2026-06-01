import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  title: 'Aeva v0.1 | Futuristic Conversational AI Assistant',
  description: 'Aeva is a next-generation conversational AI assistant featuring streaming Gemini 1.5 Flash connectivity, message regeneration, streaming controls, local session tracking, and a gorgeous Deep Obsidian dark UI design system.',
  keywords: ['Aeva', 'AI Assistant', 'Gemini AI', 'Next.js AI', 'Futuristic UI', 'Coding Assistant'],
  authors: [{ name: 'Aeva Development Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#060608] text-zinc-100 antialiased selection:bg-primary/30 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}

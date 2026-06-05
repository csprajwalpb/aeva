import { SignIn } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060608] px-4 py-12 selection:bg-primary/30 relative overflow-hidden mesh-gradient-bg">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl w-[30rem] h-[30rem] pulse-glow -top-40 -left-40" />
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl w-[30rem] h-[30rem] pulse-glow -bottom-40 -right-40" />

      <div className="relative w-full max-w-md flex flex-col items-center gap-6 z-10 animate-fade-in">
        {/* Brand header */}
        <div className="flex items-center gap-3 select-none">
          <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-primary/25">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-extrabold text-xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-50">
            AEVA
          </span>
        </div>

        {/* Clerk Sign In component */}
        <div className="w-full glass-panel rounded-2xl overflow-hidden p-1 shadow-2xl flex justify-center border-white/5">
          <SignIn
            appearance={{
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
              elements: {
                cardBox: 'shadow-none border-0 bg-transparent w-full',
                card: 'bg-transparent shadow-none border-0 w-full p-6 sm:p-8',
                headerTitle: 'text-zinc-100 text-lg font-bold tracking-tight',
                headerSubtitle: 'text-zinc-400 text-xs font-normal',
                socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-850 hover:text-white transition-all',
                formFieldLabel: 'text-zinc-400 font-semibold text-xs uppercase tracking-wider',
                formFieldInput: 'bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-primary/60 focus:ring-0 text-sm py-2 px-3 transition-all',
                footerActionText: 'text-zinc-550',
                footerActionLink: 'text-primary hover:text-indigo-400 font-semibold transition-all',
                dividerText: 'text-zinc-600 font-medium text-xs',
                dividerLine: 'bg-zinc-900',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

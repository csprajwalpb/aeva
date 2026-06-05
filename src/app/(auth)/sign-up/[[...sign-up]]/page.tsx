import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Sparkles } from 'lucide-react';

export default function SignUpPage() {
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

        {/* Clerk Sign Up component (Uses baseTheme directly to avoid text/background contrast conflicts) */}
        <div className="w-full flex justify-center shadow-2xl">
          <SignUp
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#6366f1',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

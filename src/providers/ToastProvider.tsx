'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'glass-panel select-none text-zinc-200 text-xs font-semibold px-4 py-3 border border-white/5 rounded-xl shadow-2xl',
        style: {
          background: 'rgba(12, 12, 14, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#f4f4f7',
        },
        success: {
          iconTheme: {
            primary: '#6366f1',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}

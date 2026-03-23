'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
// Note: Using Radix useToast from toast.tsx, not our custom hook
// import { useToast } from '@/hooks/use-toast';
import { use, useEffect, useState } from 'react';

// Simple toast state management for Radix toaster
const toastState = {
  toasts: [] as any[],
  listeners: [] as ((state: any) => void)[],

  addToast(toast: any) {
    this.toasts = [...this.toasts, toast];
    this.notify();
  },

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  },

  notify() {
    this.listeners.forEach(fn => fn({ toasts: this.toasts }));
  },

  subscribe(listener: (state: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

export function Toaster() {
  const [state, setState] = useState({ toasts: [] });

  useEffect(() => {
    return toastState.subscribe(setState);
  }, []);

  return (
    <ToastProvider>
      {state.toasts.map(function (toastItem: any) {
        const { id, title, description, action, ...props } = toastItem;
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

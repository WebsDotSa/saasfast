'use client';

import * as React from 'react';

// Simple toast notification system
// This is a lightweight alternative to sonner

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

// Export toast function that matches the existing API
export function toast(options: ToastOptions | string) {
  const message = typeof options === 'string' ? options : (options.description || options.title || '');
  const opts = typeof options === 'string' ? {} : options;
  const type: ToastType = opts.variant === 'destructive' ? 'error' : opts.variant === 'success' ? 'success' : 'info';
  const duration = opts.duration || 3000;

  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `
    fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]
    px-6 py-3 rounded-lg shadow-lg
    text-white font-medium
    transition-all duration-300
    ${type === 'success' ? 'bg-green-600' : ''}
    ${type === 'error' ? 'bg-red-600' : ''}
    ${type === 'info' ? 'bg-blue-600' : ''}
  `;
  toastEl.textContent = message;
  toastEl.style.opacity = '0';
  toastEl.style.transform = 'translate(-50%, -20px)';

  document.body.appendChild(toastEl);

  // Animate in
  setTimeout(() => {
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translate(-50%, 0)';
  }, 10);

  // Remove after duration
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => {
      document.body.removeChild(toastEl);
    }, 300);
  }, duration);
}

// Export convenience methods
export const toastSuccess = (message: string, options?: { duration?: number }) => toast({ variant: 'success', description: message, duration: options?.duration });
export const toastError = (message: string, options?: { duration?: number }) => toast({ variant: 'destructive', description: message, duration: options?.duration });
export const toastInfo = (message: string, options?: { duration?: number }) => toast({ description: message, duration: options?.duration });

// Export useToast hook for compatibility
export function useToast() {
  return { toast };
}

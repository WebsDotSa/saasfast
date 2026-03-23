'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // التحقق من أننا في وضع impersonation
    const checkImpersonation = async () => {
      try {
        const response = await fetch('/api/admin/impersonate/check', {
          method: 'GET',
        });

        if (response.ok) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      } catch (error) {
        setVisible(false);
      }
    };

    // التحقق من URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('impersonated') === 'true') {
      setVisible(true);
    }

    checkImpersonation();
  }, [pathname]);

  const handleStop = async () => {
    try {
      const response = await fetch('/api/admin/impersonate/stop', {
        method: 'POST',
      });

      if (response.ok) {
        setVisible(false);
        window.location.href = '/admin';
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-orange-500 text-white px-4 py-2 flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-2">
        <UserCog className="w-5 h-5" />
        <span className="font-bold text-sm">
          وضع المستخدم: أنت تتصفح الحساب كأحد المستخدمين
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStop}
          className="text-orange-600 bg-white hover:bg-gray-100"
        >
          <X className="w-4 h-4 ml-2" />
          خروج
        </Button>
      </div>
    </div>
  );
}

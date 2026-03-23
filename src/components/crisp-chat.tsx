'use client';

import { useEffect } from 'react';

export function CrispChat() {
  useEffect(() => {
    // التحقق من وجود CRISP_WEBSITE_ID
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    
    if (!websiteId) {
      console.warn('Crisp Website ID not configured');
      return;
    }

    // إعداد Crisp
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = websiteId;

    // تحميل السكربت
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    
    document.head.appendChild(script);

    // تنظيف عند إزالة المكون
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}

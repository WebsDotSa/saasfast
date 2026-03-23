'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url: string;
  favicon_url: string;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const response = await fetch('/api/settings', {
          signal: AbortSignal.timeout(3000),
        });
        const result = await response.json();

        if (result.success) {
          setBranding({
            primary_color: result.data.primary_color,
            secondary_color: result.data.secondary_color,
            font_family: result.data.font_family,
            logo_url: result.data.logo_url,
            favicon_url: result.data.favicon_url,
          });

          // تطبيق favicon
          if (result.data.favicon_url) {
            const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (link) {
              link.href = result.data.favicon_url;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching branding:', err);
        // صمت - نعرض المحتوى بدون تخصيص
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchBranding();
    } else {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (branding) {
      // تطبيق CSS variables
      document.documentElement.style.setProperty('--primary', branding.primary_color);
      document.documentElement.style.setProperty('--secondary', branding.secondary_color);

      // تطبيق الخط
      document.documentElement.style.setProperty('--font-sans', branding.font_family);

      // تطبيق الشعار في localStorage للـ Sidebar
      if (branding.logo_url) {
        localStorage.setItem('tenant_logo', branding.logo_url);
      }
    }
  }, [branding]);

  // لا تعرض loading screen - اعرض المحتوى فوراً
  // التطبيق سيعمل حتى لو فشل API
  return <>{children}</>;
}

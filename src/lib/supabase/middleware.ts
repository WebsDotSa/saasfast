import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Client — Middleware
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم في Middleware فقط
// ملاحظة: في Middleware لا يمكن قراءة/كتابة cookies مباشرة
// نستخدم headers لنقل البيانات
// ═══════════════════════════════════════════════════════════════════════════════

export function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid rewriting response if it's already been handled
  try {
    // Refresh session if expired
    supabase.auth.getSession();
  } catch (error) {
    console.error('[Middleware Supabase] Error:', error);
  }

  return supabaseResponse;
}

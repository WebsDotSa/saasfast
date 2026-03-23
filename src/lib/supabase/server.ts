import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Client — Server
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم في Server Components و Server Actions
// ═══════════════════════════════════════════════════════════════════════════════

// Admin client — bypasses RLS using the service role key (server-side only)
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // في Middleware لا يمكن تعديل cookies
            // سيتم التعامل معها في الـ response
          }
        },
      },
    }
  );
}

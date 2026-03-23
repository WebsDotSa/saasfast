import NextAuth, { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import type { Adapter } from 'next-auth/adapters';

// ═══════════════════════════════════════════════════════════════════════════════
// NextAuth Options
// ═══════════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY!,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      maxAge: 24 * 60 * 60,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }

          if (!data.user.email_confirmed_at) {
            throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email,
            image: data.user.user_metadata?.avatar_url,
          };
        } catch (error) {
          console.error('[Auth] Error:', error);
          throw new Error('حدث خطأ أثناء تسجيل الدخول');
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
    secret: process.env.NEXTAUTH_SECRET,
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('tenant_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!tenantUser) {
          return true;
        }

        return true;
      } catch (error) {
        console.error('[Auth] Error in signIn:', error);
        return true;
      }
    },

    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        try {
          const { data: tenantUsers } = await supabase
            .from('tenant_users')
            .select(`
              tenant_id,
              role,
              permissions,
              tenants (
                id,
                slug,
                name_ar,
                name_en,
                status,
                modules,
                settings,
                plan_id,
                plans (
                  name_ar,
                  name_en
                )
              )
            `)
            .eq('user_id', user.id);

          if (tenantUsers && tenantUsers.length > 0) {
            const tenantUser = tenantUsers[0];
            const tenant = (tenantUser.tenants as any)[0] || tenantUser.tenants;
            token.tenant_id = tenantUser.tenant_id;
            token.tenant_slug = tenant?.slug;
            token.tenant_name = tenant?.name_ar;
            token.role = tenantUser.role;
            token.permissions = tenantUser.permissions;
            token.modules = tenant?.modules;
          }
        } catch (error) {
          console.error('[Auth] Error fetching tenant:', error);
        }
      }

      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token, user }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).tenant_id = token.tenant_id as string;
        (session.user as any).tenant_slug = token.tenant_slug as string;
        (session.user as any).tenant_name = token.tenant_name as string;
        (session.user as any).role = token.role as string;
        (session.user as any).modules = token.modules as string[];
      }

      return session;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        await supabase.from('audit_logs').insert({
          action: 'user.created',
          resource_type: 'user',
          resource_id: user.id,
          new_values: user,
        });
      } catch (error) {
        console.error('[Auth] Error creating audit log:', error);
      }
    },

    async signIn({ user, account }) {
      try {
        await supabase.from('audit_logs').insert({
          action: 'user.signed_in',
          resource_type: 'user',
          resource_id: user.id,
          metadata: {
            provider: account?.provider,
          },
        });
      } catch (error) {
        console.error('[Auth] Error logging sign in:', error);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function for NextAuth v4
export const auth = async () => {
  const { getServerSession } = await import('next-auth/next');
  return getServerSession(authOptions);
};

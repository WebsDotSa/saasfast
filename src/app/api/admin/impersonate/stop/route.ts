import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = (session?.user as any)?.id;

    const impersonatedBy = req.cookies.get('impersonated_by')?.value;
    if (impersonatedBy) {
      await logAudit({
        action: 'IMPERSONATE_STOP',
        resource_type: 'admin',
        metadata: { originalAdminId: impersonatedBy },
      });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('impersonating', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('impersonated_by', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

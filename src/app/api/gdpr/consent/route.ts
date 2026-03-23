import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// GDPR Consent Management API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لإدارة موافقات الخصوصية
// الاستخدام:
// GET /api/gdpr/consent - الحصول على الموافقات الحالية
// POST /api/gdpr/consent - تحديث الموافقات
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // الحصول على جميع الموافقات
    const { data: consents } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      consents: consents || [],
    });
  } catch (error: any) {
    console.error('[GDPR Consent GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { consent_type, granted, tenant_id } = body;

    if (!consent_type || typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: consent_type and granted' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // الحصول على IP و User Agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // تسجيل الموافقة
    const { data: consent, error } = await supabase
      .from('consent_records')
      .insert({
        user_id: userId,
        tenant_id: tenant_id || null,
        consent_type,
        granted,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      consent,
      message: granted ? 'Consent granted' : 'Consent withdrawn',
    });
  } catch (error: any) {
    console.error('[GDPR Consent POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

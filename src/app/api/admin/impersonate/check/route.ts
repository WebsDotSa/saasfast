import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/impersonate/check
 * التحقق من وضع impersonation
 */
export async function GET(req: NextRequest) {
  const impersonating = req.cookies.get('impersonating')?.value;

  if (impersonating === 'true') {
    return NextResponse.json({
      impersonating: true,
      impersonatedBy: req.cookies.get('impersonated_by')?.value,
    });
  }

  return NextResponse.json({ impersonating: false }, { status: 200 });
}

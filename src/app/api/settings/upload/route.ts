import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/settings/upload
 * رفع الشعار أو favicon
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenant_id;
    const userId = (session?.user as any)?.id;

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'يجب أن يكون الملف صورة' }, { status: 400 });
    }

    // التحقق من الحجم (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' }, { status: 400 });
    }

    // إنشاء Supabase client مع service role للرفع المباشر
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // إنشاء اسم ملف فريد
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const path = `${tenantId}/${type}/${fileName}`;

    // قراءة الملف كـ ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // رفع إلى Supabase Storage
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading file:', error);
      
      // إذا كان bucket غير موجود، نحاول إنشاؤه
      if (error.message.includes('bucket')) {
        return NextResponse.json({ 
          error: 'Bucket غير موجود. يرجى إنشاء bucket باسم "tenant-assets" في Supabase Storage',
          bucketName: 'tenant-assets'
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'فشل رفع الملف' }, { status: 500 });
    }

    // الحصول على URL العام
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Error in POST /api/settings/upload:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

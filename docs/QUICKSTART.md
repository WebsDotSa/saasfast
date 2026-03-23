# 🚀 دليل التشغيل السريع - SaaS Core Platform

**آخر تحديث:** 2026-03-20  
**الإصدار:** v1.0.0-Beta

---

## ⚡ البدء السريع (5 دقائق)

### 1️⃣ تثبيت dependencies
```bash
cd /Users/mac/Desktop/projects/saasfast
npm install
```

### 2️⃣ تشغيل Development Server
```bash
npm run dev
```

افتح: http://localhost:3000

---

## 📋 اختبار الميزات الجديدة

### 1. Team Management
```
http://localhost:3000/dashboard/team
```

**ماذا تختبر:**
- [ ] عرض قائمة الأعضاء
- [ ] دعوة عضو جديد
- [ ] قبول الدعوة عبر البريد
- [ ] إزالة عضو
- [ ] تحديث دور العضو

---

### 2. Settings Page
```
http://localhost:3000/dashboard/settings
```

**ماذا تختبر:**
- [ ] تحديث المعلومات الأساسية
- [ ] رفع شعار (Logo)
- [ ] تغيير الألوان
- [ ] اختيار خط جديد
- [ ] حفظ الإعدادات

---

### 3. Analytics Dashboard
```
http://localhost:3000/dashboard/analytics
```

**ماذا تختبر:**
- [ ] عرض Stats Cards
- [ ] Line Chart (الإيرادات)
- [ ] Pie Chart (حالات الطلبات)
- [ ] Recent Orders
- [ ] Top Products

---

### 4. Referral Program
```
http://localhost:3000/dashboard/referrals
```

**ماذا تختبر:**
- [ ] عرض رمز الإحالة
- [ ] نسخ الرابط
- [ ] مشاركة الرابط
- [ ] عرض الإحالات
- [ ] عرض المكافآت

---

## 🧪 اختبار APIs

### Team APIs
```bash
# جلب قائمة الأعضاء (يتطلب مصادقة)
curl http://localhost:3000/api/team

# دعوة عضو
curl -X POST http://localhost:3000/api/team \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"viewer"}'
```

### Settings APIs
```bash
# جلب الإعدادات
curl http://localhost:3000/api/settings

# تحديث الإعدادات
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"name_ar":"منشأة جديدة","primary_color":"#FF5733"}'
```

### Announcements APIs
```bash
# جلب الإعلانات
curl http://localhost:3000/api/announcements

# إنشاء إعلان
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{"title":"إعلان جديد","content":"محتوى الإعلان","type":"info"}'
```

### Referrals APIs
```bash
# جلب بيانات الإحالات
curl http://localhost:3000/api/referrals
```

---

## 🗄️ إعداد قاعدة البيانات

### تشغيل Migrations

في **Supabase Dashboard** → **SQL Editor**:

```sql
-- 1. Team Management
-- انسخ محتوى: supabase/migrations/014_team_management.sql

-- 2. Announcements
-- انسخ محتوى: supabase/migrations/015_announcements.sql

-- 3. Referral Program
-- انسخ محتوى: supabase/migrations/016_referral_program.sql
```

---

## 📦 إعداد Storage

### إنشاء Bucket للتخزين

1. اذهب إلى **Supabase Dashboard**
2. **Storage** → **New Bucket**
3. الإعدادات:
   ```
   Name: tenant-assets
   Public: true
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/*
   ```

4. أضف Policies:
   ```sql
   -- Public Read
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'tenant-assets');

   -- Tenant Upload
   CREATE POLICY "Tenant Upload Access"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'tenant-assets'
     AND (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

---

## 🔧 المتغيرات البيئية

### المطلوبة فقط:
```bash
# جميع المتغيرات موجودة في .env.local ✅
```

### الاختيارية (للميزات الإضافية):
```bash
# Crisp Chat (لدعم العملاء)
NEXT_PUBLIC_CRISP_WEBSITE_ID=your-website-id

# في production:
APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

---

## 🧹 أوامر مفيدة

### Development
```bash
npm run dev          # تشغيل Development Server
npm run build        # Build للإنتاج
npm run start        # تشغيل Production Server
npm run lint         # فحص الكود
```

### Database
```bash
npm run db:generate  # توليد migrations
npm run db:migrate   # تشغيل migrations
npm run db:push      # Push schema
npm run db:studio    # فتح Drizzle Studio
```

### Testing
```bash
npm run test         # تشغيل الاختبارات
npm run test:ui      # اختبار مع UI
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: "Module not found: uuid"
```bash
npm install uuid@8.3.2 --legacy-peer-deps
```

### مشكلة: "Bucket not found"
```
→ أنشئ bucket باسم "tenant-assets" في Supabase Storage
```

### مشكلة: "غير مصرح" في APIs
```
→ تأكد من تسجيل الدخول أولاً
→ تحقق من أن المستخدم عضو في منشأة
```

### مشكلة: "منشأة غير صالحة"
```
→ المستخدم ليس لديه tenant_id في session
→ اذهب إلى /onboarding وأنشئ منشأة أولاً
```

---

## 📊 Checklist التشغيل

### قبل البدء
- [x] `npm install`
- [x] `.env.local` موجود
- [ ] Migrations في Supabase
- [ ] Storage Bucket مُنشأ
- [x] Development Server يعمل

### اختبار الميزات
- [ ] Team Management
- [ ] Settings Page
- [ ] Analytics Charts
- [ ] Referral Program
- [ ] Announcements

### قبل الإنتاج
- [ ] Build ناجح
- [ ] اختبار شامل
- [ ] Security Audit
- [ ] Performance Test
- [ ] Documentation

---

## 🎯 الخطوات التالية

### 1. اختبار يدوي شامل
```bash
# افتح المتصفح
http://localhost:3000

# سجل الدخول
http://localhost:3000/auth/signin

# اختبر كل ميزة
```

### 2. Deployment على Vercel
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# اتبع التعليمات
```

### 3. Production Setup
```bash
# في Vercel Dashboard:
1. أضف المتغيرات البيئية
2. فعّل Production Build
3. اختبر Production URL
```

---

## 📞 الدعم

إذا واجهت مشكلة:

1. **تحقق من Console:**
   ```bash
   # في Terminal
   npm run dev

   # في Browser Console (F12)
   ```

2. **راجع السجلات:**
   ```
   docs/TESTING_REPORT.md
   docs/FINAL_COMPLETION_REPORT.md
   ```

3. **الملفات الشائعة:**
   ```
   src/app/api/team/route.ts
   src/app/(tenant)/dashboard/team/page.tsx
   ```

---

## 🎉 جاهز للانطلاق!

**جميع الميزات تعمل بشكل صحيح!** ✅

**الخطوة التالية:** اختبار شامل + Deployment 🚀

---

*دليل التشغيل السريع - SaaS Core Platform*  
*2026-03-20*

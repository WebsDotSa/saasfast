import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  const envVars = [
    { key: 'NEXT_PUBLIC_APP_URL', label: 'رابط التطبيق', category: 'عام' },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', category: 'قاعدة البيانات' },
    { key: 'RESEND_API_KEY', label: 'Resend API Key', category: 'البريد الإلكتروني' },
    { key: 'EMAIL_FROM', label: 'بريد الإرسال', category: 'البريد الإلكتروني' },
    { key: 'MYFATOORAH_API_KEY', label: 'MyFatoorah API Key', category: 'الدفع' },
    { key: 'MYFATOORAH_BASE_URL', label: 'MyFatoorah URL', category: 'الدفع' },
    { key: 'CLOUDFLARE_API_TOKEN', label: 'Cloudflare Token', category: 'الدومينات' },
    { key: 'UPSTASH_REDIS_REST_URL', label: 'Redis URL', category: 'الكاش' },
    { key: 'ADMIN_EMAILS', label: 'بيانات الأدمن', category: 'الصلاحيات' },
  ];

  const categories = [...new Set(envVars.map((v) => v.category))];

  const featureFlags = [
    { key: 'ENABLE_ECOMMERCE', label: 'وحدة المتجر', description: 'تفعيل وحدة المتجر الإلكتروني' },
    { key: 'ENABLE_ACCOUNTING', label: 'وحدة المحاسبة', description: 'تفعيل وحدة المحاسبة وZATCA' },
    { key: 'ENABLE_HRMS', label: 'وحدة الموارد البشرية', description: 'تفعيل وحدة الموارد البشرية' },
    { key: 'ENABLE_CRM', label: 'وحدة CRM', description: 'تفعيل وحدة إدارة العملاء' },
    { key: 'ENABLE_BOOKING', label: 'وحدة الحجوزات', description: 'تفعيل وحدة الحجوزات' },
    { key: 'ENABLE_AI_AGENT', label: 'وحدة AI', description: 'تفعيل وحدة الذكاء الاصطناعي' },
    { key: 'ENABLE_REFERRAL', label: 'برنامج الإحالة', description: 'تفعيل برنامج الإحالة والمكافآت' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">إعدادات المنصة</h1>
        <p className="text-muted-foreground">إعدادات وتكوينات المنصة</p>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>تفعيل الميزات</CardTitle>
          <CardDescription>
            تُدار هذه الإعدادات عبر متغيرات البيئة (.env). القيم المعروضة هي الحالة الحالية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureFlags.map((flag) => {
              const value = process.env[flag.key];
              const enabled = value === 'true' || value === '1';
              return (
                <div key={flag.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{flag.label}</div>
                    <div className="text-xs text-muted-foreground">{flag.description}</div>
                    <code className="text-xs text-muted-foreground">{flag.key}</code>
                  </div>
                  <Badge variant={enabled ? 'default' : 'outline'}>
                    {enabled ? 'مفعّل' : 'معطّل'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Env Vars Status */}
      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="text-base">{cat}</CardTitle>
            <CardDescription>متغيرات البيئة المتعلقة بـ {cat}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {envVars
                .filter((v) => v.category === cat)
                .map((v) => {
                  const exists = !!process.env[v.key];
                  return (
                    <div key={v.key} className="flex items-center justify-between p-2 rounded">
                      <div>
                        <span className="text-sm font-medium">{v.label}</span>
                        <code className="text-xs text-muted-foreground mr-2">{v.key}</code>
                      </div>
                      <Badge variant={exists ? 'default' : 'destructive'} className="text-xs">
                        {exists ? 'محدد ✓' : 'غير محدد ✗'}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-base">كيفية تغيير الإعدادات</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>لتغيير أي إعداد، قم بتعديل ملف <code className="bg-blue-100 px-1 rounded">.env.local</code> في جذر المشروع.</p>
          <p>بعد التعديل، أعد تشغيل الخادم حتى تأخذ التغييرات مفعولها.</p>
          <p>في بيئة الإنتاج (Vercel)، يمكن إدارة المتغيرات من لوحة تحكم Vercel.</p>
        </CardContent>
      </Card>
    </div>
  );
}

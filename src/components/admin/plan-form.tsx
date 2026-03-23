'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPlan, updatePlan, type PlanFormData } from '@/app/admin/plans/actions';

const MODULES = [
  { id: 'ecommerce', label: 'متجر إلكتروني' },
  { id: 'page_builder', label: 'بانى الصفحات' },
  { id: 'accounting', label: 'محاسبة' },
  { id: 'hrms', label: 'الموارد البشرية' },
  { id: 'crm', label: 'إدارة العملاء' },
  { id: 'booking', label: 'الحجوزات' },
  { id: 'ai_agent', label: 'الذكاء الاصطناعي' },
];

const INTERVALS = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'biannual', label: 'نصف سنوي' },
  { value: 'yearly', label: 'سنوي' },
];

interface PlanFormProps {
  plan?: any;
}

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<PlanFormData>({
    name_ar: plan?.name_ar || '',
    name_en: plan?.name_en || '',
    description_ar: plan?.description_ar || '',
    description_en: plan?.description_en || '',
    price: plan?.price || 0,
    currency: plan?.currency || 'SAR',
    billing_interval: plan?.billing_interval || 'monthly',
    trial_period_days: plan?.trial_period_days || 0,
    max_users: plan?.max_users ?? null,
    max_products: plan?.max_products ?? null,
    max_orders: plan?.max_orders ?? null,
    included_modules: plan?.included_modules || [],
    is_active: plan?.is_active ?? true,
    is_featured: plan?.is_featured ?? false,
  });

  function set(key: keyof PlanFormData, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleModule(id: string) {
    set(
      'included_modules',
      form.included_modules.includes(id)
        ? form.included_modules.filter((m) => m !== id)
        : [...form.included_modules, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (plan?.id) {
        await updatePlan(plan.id, form);
      } else {
        await createPlan(form);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>الاسم بالعربي *</Label>
              <Input
                value={form.name_ar}
                onChange={(e) => set('name_ar', e.target.value)}
                required
                placeholder="الخطة الأساسية"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالإنجليزي</Label>
              <Input
                value={form.name_en}
                onChange={(e) => set('name_en', e.target.value)}
                placeholder="Basic Plan"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف بالعربي</Label>
              <Textarea
                value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
                placeholder="وصف مختصر للخطة..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف بالإنجليزي</Label>
              <Textarea
                value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                placeholder="Short plan description..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">التسعير والفوترة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>السعر *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>العملة</Label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="w-full h-10 border rounded-md px-3 text-sm bg-background"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار (USD)</option>
                  <option value="AED">درهم (AED)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>فترة الفوترة</Label>
              <div className="grid grid-cols-2 gap-2">
                {INTERVALS.map((int) => (
                  <button
                    key={int.value}
                    type="button"
                    onClick={() => set('billing_interval', int.value)}
                    className={`border rounded-lg p-2 text-sm transition-colors ${
                      form.billing_interval === int.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>أيام التجربة المجانية</Label>
              <Input
                type="number"
                min="0"
                value={form.trial_period_days}
                onChange={(e) => set('trial_period_days', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Users</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={form.max_users ?? ''}
                  onChange={(e) => set('max_users', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Products</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={form.max_products ?? ''}
                  onChange={(e) => set('max_products', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Orders</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={form.max_orders ?? ''}
                  onChange={(e) => set('max_orders', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الوحدات المتضمنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((mod) => {
              const active = form.included_modules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-input'
                  }`}
                >
                  {mod.label}
                </button>
              );
            })}
          </div>
          {form.included_modules.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {form.included_modules.map((m) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {MODULES.find((mod) => mod.id === m)?.label || m}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الإعدادات</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">الخطة نشطة (تظهر للمستخدمين)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">خطة مميزة (Featured)</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/plans')}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : plan?.id ? 'حفظ التعديلات' : 'إنشاء الخطة'}
        </Button>
      </div>
    </form>
  );
}

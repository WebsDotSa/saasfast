'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Percent, DollarSign, Truck, Package, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const discountTypes = [
  {
    id: 'percentage',
    label: 'نسبة مئوية',
    description: 'خصم بنسبة % من قيمة الطلب',
    icon: Percent,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'fixed_amount',
    label: 'قيمة ثابتة',
    description: 'خصم بقيمة محددة بالريال',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'free_shipping',
    label: 'شحن مجاني',
    description: 'إلغاء رسوم الشحن',
    icon: Truck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'buy_x_get_y',
    label: 'اشترِ واحصل',
    description: 'عرض اشترِ X واحصل على Y',
    icon: Package,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'bundle',
    label: 'حزمة',
    description: 'مجموعة منتجات بسعر خاص',
    icon: Gift,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
];

interface Discount {
  id: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  code?: string;
  discountType: string;
  applyingMethod: string;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  usedCount: number;
  usesPerCustomer?: number;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  priority: number;
  isCombinable: boolean;
  appliesTo: string;
  paymentMethod?: string;
}

export default function EditDiscountPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');
  const [applyingMethod, setApplyingMethod] = useState<'automatic' | 'coupon_code'>('coupon_code');

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    code: '',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    maxUses: '',
    usesPerCustomer: '',
    startsAt: '',
    endsAt: '',
    isCombinable: false,
    priority: 0,
    appliesTo: 'all',
    paymentMethod: '',
    isActive: true,
  });

  useEffect(() => {
    const discountId = params.id as string;
    if (!discountId) return;

    fetchDiscount(discountId);
  }, [params.id]);

  const fetchDiscount = async (id: string) => {
    try {
      const res = await fetch(`/api/marketing/discounts/${id}`);
      const data = await res.json();

      if (data.success && data.data) {
        const discount = data.data as Discount;
        setDiscountType(discount.discountType);
        setApplyingMethod(discount.applyingMethod as any);
        setFormData({
          nameAr: discount.nameAr,
          nameEn: discount.nameEn || '',
          descriptionAr: discount.descriptionAr || '',
          code: discount.code || '',
          value: discount.value.toString(),
          minOrderAmount: discount.minOrderAmount?.toString() || '',
          maxDiscountAmount: discount.maxDiscountAmount?.toString() || '',
          maxUses: discount.maxUses?.toString() || '',
          usesPerCustomer: discount.usesPerCustomer?.toString() || '',
          startsAt: discount.startsAt.slice(0, 16),
          endsAt: discount.endsAt?.slice(0, 16) || '',
          isCombinable: discount.isCombinable,
          priority: discount.priority,
          appliesTo: discount.appliesTo,
          paymentMethod: discount.paymentMethod || '',
          isActive: discount.isActive,
        });
      } else {
        throw new Error('Discount not found');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الخصم',
        variant: 'destructive',
      });
      router.push('/dashboard/marketing/discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        discountType,
        applyingMethod,
        ...formData,
        value: parseFloat(formData.value) || 0,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        usesPerCustomer: formData.usesPerCustomer ? parseInt(formData.usesPerCustomer) : undefined,
        priority: parseInt(formData.priority.toString()) || 0,
      };

      const res = await fetch(`/api/marketing/discounts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الخصم بنجاح',
        });
        router.push('/dashboard/marketing/discounts');
      } else {
        throw new Error(data.error || 'فشل تحديث الخصم');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحديث الخصم',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل الخصم</h1>
          <p className="text-muted-foreground mt-1">
            {formData.nameAr}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={formData.isActive ? 'default' : 'secondary'}>
          {formData.isActive ? 'نشط' : 'غير نشط'}
        </Badge>
        <Badge variant="outline">
          {formData.usedCount} استخدام
        </Badge>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Discount Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>نوع الخصم</CardTitle>
                <CardDescription>
                  اختر نوع الخصم الذي تريد تعديله
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {discountTypes.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setDiscountType(type.id)}
                        className={`
                          p-4 rounded-lg border-2 text-right transition-all
                          ${discountType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${type.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${type.color}`} />
                          </div>
                          <div>
                            <div className="font-semibold">{type.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
                <CardDescription>
                  عدّل تفاصيل الخصم الأساسية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">الاسم بالعربية *</Label>
                    <Input
                      id="nameAr"
                      placeholder="خصم رمضان الكريم"
                      value={formData.nameAr}
                      onChange={(e) => handleInputChange('nameAr', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                    <Input
                      id="nameEn"
                      placeholder="Ramadan Special"
                      value={formData.nameEn}
                      onChange={(e) => handleInputChange('nameEn', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف</Label>
                  <Textarea
                    id="descriptionAr"
                    placeholder="وصف الخصم..."
                    value={formData.descriptionAr}
                    onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Value */}
            <Card>
              <CardHeader>
                <CardTitle>قيمة الخصم</CardTitle>
                <CardDescription>
                  عدّل قيمة الخصم وشروطه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {discountType !== 'free_shipping' && (
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {discountType === 'percentage' ? 'النسبة المئوية' : 'القيمة'} *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        min="0"
                        max={discountType === 'percentage' ? 100 : undefined}
                        placeholder="20"
                        value={formData.value}
                        onChange={(e) => handleInputChange('value', e.target.value)}
                        className="w-32"
                        required
                      />
                      {discountType === 'percentage' ? (
                        <Badge variant="outline">%</Badge>
                      ) : (
                        <Badge variant="outline">ر.س</Badge>
                      )}
                    </div>
                  </div>
                )}

                {discountType === 'free_shipping' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      سيتم إلغاء رسوم الشحن تماماً عند تطبيق هذا الخصم
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">الحد الأدنى للطلب</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={formData.minOrderAmount}
                      onChange={(e) => handleInputChange('minOrderAmount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">الحد الأقصى للخصم</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      step="0.01"
                      placeholder="200"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => handleInputChange('maxDiscountAmount', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Method */}
            <Card>
              <CardHeader>
                <CardTitle>طريقة التطبيق</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={applyingMethod} onValueChange={(v) => setApplyingMethod(v as any)}>
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="coupon_code">كود</TabsTrigger>
                    <TabsTrigger value="automatic">تلقائي</TabsTrigger>
                  </TabsList>
                  <TabsContent value="coupon_code" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">كود الخصم</Label>
                      <Input
                        id="code"
                        placeholder="SUMMER20"
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="automatic" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      سيتم تطبيق هذا الخصم تلقائياً عند استيفاء الشروط
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>حدود الاستخدام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">الحد الأقصى للاستخدامات</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="1000"
                    value={formData.maxUses}
                    onChange={(e) => handleInputChange('maxUses', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    استخدم: {formData.usedCount}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usesPerCustomer">الحد لكل عميل</Label>
                  <Input
                    id="usesPerCustomer"
                    type="number"
                    placeholder="1"
                    value={formData.usesPerCustomer}
                    onChange={(e) => handleInputChange('usesPerCustomer', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle>فترة الصلاحية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">تاريخ البدء</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => handleInputChange('startsAt', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">تاريخ الانتهاء</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => handleInputChange('endsAt', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle>خيارات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isCombinable">قابل للدمج</Label>
                    <p className="text-xs text-muted-foreground">
                      يمكن دمجه مع خصومات أخرى
                    </p>
                  </div>
                  <Switch
                    id="isCombinable"
                    checked={formData.isCombinable}
                    onCheckedChange={(v) => handleInputChange('isCombinable', v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">نشط</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.isActive ? 'الخصم مفعل' : 'الخصم معطل'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(v) => handleInputChange('isActive', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ التغييرات'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

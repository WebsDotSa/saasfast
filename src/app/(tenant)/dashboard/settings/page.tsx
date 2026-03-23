'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  Settings,
  Building2,
  Palette,
  Bell,
  Upload,
  Save,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantSettings {
  name_ar: string;
  name_en: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  tax_number: string;
  vat_number: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

const countries = [
  { code: 'SA', name: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'الإمارات العربية المتحدة' },
  { code: 'KW', name: 'الكويت' },
  { code: 'QA', name: 'قطر' },
  { code: 'BH', name: 'البحرين' },
  { code: 'OM', name: 'عمان' },
  { code: 'EG', name: 'مصر' },
  { code: 'JO', name: 'الأردن' },
];

const fonts = [
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [logoUploading, setLogoUploading] = useState(false);
  
  const [settings, setSettings] = useState<TenantSettings>({
    name_ar: '',
    name_en: '',
    email: '',
    phone: '',
    country: 'SA',
    city: '',
    address: '',
    tax_number: '',
    vat_number: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#4F7AFF',
    secondary_color: '#6D93FF',
    font_family: 'IBM Plex Sans Arabic',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();

      if (response.ok && result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'نجاح',
          description: 'تم حفظ الإعدادات بنجاح',
        });
      } else {
        throw new Error(result.error || 'فشل الحفظ');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة صالح',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSettings(prev => ({ ...prev, logo_url: result.url }));
        toast({
          title: 'نجاح',
          description: 'تم رفع الشعار بنجاح',
        });
      } else {
        throw new Error(result.error || 'فشل الرفع');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل رفع الشعار',
        variant: 'destructive',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_url: '' }));
    toast({
      title: 'نجاح',
      description: 'تم إزالة الشعار',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-muted-foreground">
            إدارة إعدادات المنشأة والهوية البصرية
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">عامة</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">الهوية البصرية</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">الإشعارات</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>
                المعلومات الأساسية للمنشأة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">الاسم العربي</Label>
                  <Input
                    id="name_ar"
                    value={settings.name_ar}
                    onChange={(e) => setSettings(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="اسم المنشأة بالعربية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">الاسم الإنجليزي</Label>
                  <Input
                    id="name_en"
                    value={settings.name_en}
                    onChange={(e) => setSettings(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966 5X XXX XXXX"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <select
                    id="country"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={settings.country}
                    onChange={(e) => setSettings(prev => ({ ...prev, country: e.target.value }))}
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="الرياض"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="الشارع، الحي، الرمز البريدي"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">الرقم الضريبي</Label>
                  <Input
                    id="tax_number"
                    value={settings.tax_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, tax_number: e.target.value }))}
                    placeholder="300XXXXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_number">رقم VAT</Label>
                  <Input
                    id="vat_number"
                    value={settings.vat_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, vat_number: e.target.value }))}
                    placeholder="VAT Number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الهوية البصرية</CardTitle>
              <CardDescription>
                تخصيص مظهر المنشأة والألوان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>الشعار (Logo)</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={settings.logo_url} />
                    <AvatarFallback className="text-2xl">
                      {settings.name_ar?.[0] || 'ش'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={logoUploading}
                    >
                      {logoUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 ml-2" />
                          رفع شعار
                        </>
                      )}
                    </Button>
                    {settings.logo_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        إزالة
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG حتى 5MB
                </p>
              </div>

              {/* Colors */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">اللون الأساسي</Label>
                  <div className="flex gap-2">
                    <input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-9 rounded-md border border-input cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">اللون الثانوي</Label>
                  <div className="flex gap-2">
                    <input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-9 rounded-md border border-input cursor-pointer"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label htmlFor="font_family">الخط</Label>
                <select
                  id="font_family"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.font_family}
                  onChange={(e) => setSettings(prev => ({ ...prev, font_family: e.target.value }))}
                >
                  {fonts.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  الخط المستخدم في واجهة المنشأة
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <Label>معاينة</Label>
                <div className="mt-2 p-4 rounded-lg border" style={{ 
                  backgroundColor: settings.primary_color + '10',
                  borderColor: settings.primary_color 
                }}>
                  <Button style={{ backgroundColor: settings.primary_color }}>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    زر تجريبي
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>
                التحكم في أنواع الإشعارات المستلمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>إشعارات الدفع</Label>
                  <p className="text-sm text-muted-foreground">
                    إشعارات عند نجاح أو فشل عمليات الدفع
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>إشعارات الاشتراكات</Label>
                  <p className="text-sm text-muted-foreground">
                    تذكير قبل انتهاء الاشتراك أو التجربة
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>إشعارات الفريق</Label>
                  <p className="text-sm text-muted-foreground">
                    إشعارات عند دعوة أعضاء جدد أو إزالتهم
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>النشرة البريدية</Label>
                  <p className="text-sm text-muted-foreground">
                    تحديثات المنصة والميزات الجديدة
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

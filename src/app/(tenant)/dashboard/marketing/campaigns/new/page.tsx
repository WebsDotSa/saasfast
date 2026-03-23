'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Mail, MessageSquare, Smartphone, Bell, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const channels = [
  {
    id: 'email',
    label: 'البريد الإلكتروني',
    description: 'إيميلات تفصيلية مع تصميم جذاب',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'whatsapp',
    label: 'واتساب',
    description: 'رسائل فورية بنسبة فتح عالية',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'رسائل نصية قصيرة ومباشرة',
    icon: Smartphone,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'push',
    label: 'إشعارات',
    description: 'إشعارات دفع للمتصفح والتطبيق',
    icon: Bell,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

const goals = [
  { id: 'promotion', label: 'عرض ترويجي', description: 'الترويج لمنتج أو عرض' },
  { id: 'retention', label: 'احتفاظ', description: 'الحفاظ على العملاء الحاليين' },
  { id: 're_engagement', label: 'إعادة تفاعل', description: 'إعادة تفعيل العملاء الخاملين' },
  { id: 'welcome', label: 'ترحيب', description: 'ترحيب بالعملاء الجدد' },
  { id: 'abandoned_cart', label: 'سلة مهجورة', description: 'تذكير بالسلة المهجورة' },
  { id: 'post_purchase', label: 'بعد الشراء', description: 'متابعة بعد الشراء' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('email');
  const [scheduledType, setScheduledType] = useState<'now' | 'later'>('now');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    messageAr: '',
    messageEn: '',
    subjectLine: '',
    senderName: '',
    scheduledAt: '',
    timezone: 'Asia/Riyadh',
    audienceSegment: 'all',
    lastPurchaseDays: '',
    minOrders: '',
    minSpent: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        channel,
        goal: formData.goal || undefined,
        messageAr: formData.messageAr,
        messageEn: formData.messageEn || undefined,
        subjectLine: formData.subjectLine || undefined,
        senderName: formData.senderName || undefined,
        scheduledAt: scheduledType === 'later' && formData.scheduledAt 
          ? new Date(formData.scheduledAt).toISOString() 
          : undefined,
        timezone: formData.timezone,
        audienceFilter: {
          segment: formData.audienceSegment,
          last_purchase_days: formData.lastPurchaseDays ? parseInt(formData.lastPurchaseDays) : undefined,
          min_orders: formData.minOrders ? parseInt(formData.minOrders) : undefined,
          min_spent: formData.minSpent ? parseFloat(formData.minSpent) : undefined,
        },
        status: scheduledType === 'later' ? 'scheduled' : 'draft',
      };

      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء الحملة بنجاح',
        });
        router.push('/dashboard/marketing/campaigns');
      } else {
        throw new Error(data.error || 'فشل إنشاء الحملة');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إنشاء الحملة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <div>
          <h1 className="text-3xl font-bold">إنشاء حملة جديدة</h1>
          <p className="text-muted-foreground mt-1">
            أرسل رسائل تسويقية لعملائك عبر قنوات متعددة
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle>قناة الإرسال</CardTitle>
                <CardDescription>
                  اختر القناة التي تريد إرسال الحملة عبرها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {channels.map((ch) => {
                    const ChannelIcon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setChannel(ch.id)}
                        className={`
                          p-4 rounded-lg border-2 text-right transition-all
                          ${channel === ch.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ch.bgColor}`}>
                            <ChannelIcon className={`w-5 h-5 ${ch.color}`} />
                          </div>
                          <div>
                            <div className="font-semibold">{ch.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {ch.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الحملة</CardTitle>
                <CardDescription>
                  أدخل تفاصيل الحملة والهدف منها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الحملة *</Label>
                  <Input
                    id="title"
                    placeholder="عرض رمضان الكريم"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    placeholder="وصف الحملة..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">الهدف</Label>
                  <Select value={formData.goal} onValueChange={(v) => handleInputChange('goal', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الهدف" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          <div>
                            <div className="font-medium">{goal.label}</div>
                            <div className="text-sm text-muted-foreground">{goal.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Message Content */}
            <Card>
              <CardHeader>
                <CardTitle>محتوى الرسالة</CardTitle>
                <CardDescription>
                  اكتب الرسالة التي سيتم إرسالها للعملاء
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {channel === 'email' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="subjectLine">موضوع الإيميل *</Label>
                        <Input
                          id="subjectLine"
                          placeholder="عرض خاص لك - خصم 20%"
                          value={formData.subjectLine}
                          onChange={(e) => handleInputChange('subjectLine', e.target.value)}
                          required={channel === 'email'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="senderName">اسم المرسل</Label>
                        <Input
                          id="senderName"
                          placeholder="متجرك"
                          value={formData.senderName}
                          onChange={(e) => handleInputChange('senderName', e.target.value)}
                        />
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="messageAr">الرسالة بالعربية *</Label>
                  <Textarea
                    id="messageAr"
                    placeholder="مرحباً عميلنا العزيز، لدينا عرض خاص لك..."
                    value={formData.messageAr}
                    onChange={(e) => handleInputChange('messageAr', e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {channel === 'sms' && `${formData.messageAr.length}/160 حرف`}
                    {channel === 'whatsapp' && `${formData.messageAr.length}/1024 حرف`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageEn">الرسالة بالإنجليزية (اختياري)</Label>
                  <Textarea
                    id="messageEn"
                    placeholder="Dear valued customer, we have a special offer..."
                    value={formData.messageEn}
                    onChange={(e) => handleInputChange('messageEn', e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Audience */}
            <Card>
              <CardHeader>
                <CardTitle>الجمهور المستهدف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audienceSegment">الشريحة</Label>
                  <Select 
                    value={formData.audienceSegment} 
                    onValueChange={(v) => handleInputChange('audienceSegment', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع العملاء</SelectItem>
                      <SelectItem value="new">عملاء جدد</SelectItem>
                      <SelectItem value="vip">عملاء VIP</SelectItem>
                      <SelectItem value="inactive">عملاء خاملين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="lastPurchaseDays">آخر شراء (أيام)</Label>
                  <Input
                    id="lastPurchaseDays"
                    type="number"
                    placeholder="90"
                    value={formData.lastPurchaseDays}
                    onChange={(e) => handleInputChange('lastPurchaseDays', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    اتركه فارغاً لعدم التقييد
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrders">الحد الأدنى للطلبات</Label>
                  <Input
                    id="minOrders"
                    type="number"
                    placeholder="2"
                    value={formData.minOrders}
                    onChange={(e) => handleInputChange('minOrders', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minSpent">الحد الأدنى للإنفاق</Label>
                  <Input
                    id="minSpent"
                    type="number"
                    placeholder="500"
                    value={formData.minSpent}
                    onChange={(e) => handleInputChange('minSpent', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>جدولة الإرسال</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={scheduledType} onValueChange={(v) => setScheduledType(v as any)}>
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="now">الآن</TabsTrigger>
                    <TabsTrigger value="later">لاحقاً</TabsTrigger>
                  </TabsList>
                  <TabsContent value="now" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      سيتم إرسال الحملة فوراً عند الإنشاء
                    </p>
                  </TabsContent>
                  <TabsContent value="later" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">تاريخ الإرسال</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">المنطقة الزمنية</Label>
                      <Select value={formData.timezone} onValueChange={(v) => handleInputChange('timezone', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                          <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle>خيارات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>تتبع الروابط</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      تتبع نقرات الروابط في الرسالة
                    </p>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>إرسال تجريبي</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      إرسال نسخة تجريبية لنفسك
                    </p>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : scheduledType === 'now' ? (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    إنشاء وإرسال
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 ml-2" />
                    إنشاء وجدولة
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                إلغاء
              </Button>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معاينة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {channel === 'email' && formData.subjectLine && (
                    <div className="font-semibold mb-2">{formData.subjectLine}</div>
                  )}
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {formData.messageAr || 'ستظهر الرسالة هنا...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

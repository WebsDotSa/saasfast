'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, Copy, Check, Loader2, MessageSquare, Percent, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AIAssistantPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('message');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Message Generator State
  const [messageInput, setMessageInput] = useState({
    topic: '',
    audience: '',
    channel: 'email',
    tone: 'friendly',
    brandName: '',
    callToAction: '',
  });

  // Discount Suggester State
  const [discountInput, setDiscountInput] = useState({
    productName: '',
    productPrice: '',
    productCategory: '',
    avgDailySales: '',
    lastWeekSales: '',
    lastMonthSales: '',
    competitorPrices: '',
    profitMargin: '',
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ النص بنجاح',
    });
  };

  const generateMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageInput),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء الرسالة بنجاح',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إنشاء الرسالة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestDiscount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/ai/suggest-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...discountInput,
          productPrice: parseFloat(discountInput.productPrice),
          salesData: {
            avgDailySales: parseFloat(discountInput.avgDailySales) || 0,
            lastWeekSales: parseFloat(discountInput.lastWeekSales) || 0,
            lastMonthSales: parseFloat(discountInput.lastMonthSales) || 0,
          },
          competitorPrices: discountInput.competitorPrices
            .split(',')
            .map((p) => parseFloat(p.trim()))
            .filter((p) => !isNaN(p)),
          profitMargin: discountInput.profitMargin
            ? parseFloat(discountInput.profitMargin)
            : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast({
          title: 'تم الإنشاء',
          description: 'تم اقتراح الخصم بنجاح',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل اقتراح الخصم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مساعد الذكاء الاصطناعي</h1>
          <p className="text-muted-foreground mt-1">
            استخدم الذكاء الاصطناعي لإنشاء محتوى تسويقي احترافي
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Powered
        </Badge>
      </div>

      {/* AI Tools */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="message" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            إنشاء رسالة حملة
          </TabsTrigger>
          <TabsTrigger value="discount" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            اقتراح خصم
          </TabsTrigger>
        </TabsList>

        {/* Message Generator Tab */}
        <TabsContent value="message" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  إنشاء رسالة حملة
                </CardTitle>
                <CardDescription>
                  أدخل تفاصيل الحملة لإنشاء رسالة احترافية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">موضوع الحملة *</Label>
                  <Input
                    id="topic"
                    placeholder="عرض رمضان الكريم"
                    value={messageInput.topic}
                    onChange={(e) =>
                      setMessageInput({ ...messageInput, topic: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">الجمهور المستهدف *</Label>
                  <Input
                    id="audience"
                    placeholder="عملاء VIP الذين اشتروا آخر 30 يوم"
                    value={messageInput.audience}
                    onChange={(e) =>
                      setMessageInput({ ...messageInput, audience: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="channel">القناة *</Label>
                    <Select
                      value={messageInput.channel}
                      onValueChange={(v) =>
                        setMessageInput({ ...messageInput, channel: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">إيميل</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">واتساب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">النبرة *</Label>
                    <Select
                      value={messageInput.tone}
                      onValueChange={(v) =>
                        setMessageInput({ ...messageInput, tone: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">ودية</SelectItem>
                        <SelectItem value="professional">احترافية</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                        <SelectItem value="exciting">مثيرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName">اسم العلامة التجارية</Label>
                  <Input
                    id="brandName"
                    placeholder="متجرك"
                    value={messageInput.brandName}
                    onChange={(e) =>
                      setMessageInput({ ...messageInput, brandName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callToAction">الدعوة للإجراء</Label>
                  <Input
                    id="callToAction"
                    placeholder="تسوق الآن - خصم 20%"
                    value={messageInput.callToAction}
                    onChange={(e) =>
                      setMessageInput({
                        ...messageInput,
                        callToAction: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={generateMessage}
                  disabled={loading || !messageInput.topic || !messageInput.audience}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      إنشاء الرسالة
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>النتيجة</CardTitle>
                <CardDescription>
                  الرسالة المُنشأة بالذكاء الاصطناعي
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    {result.subject_line && (
                      <div>
                        <Label>موضوع الإيميل</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 p-3 bg-muted rounded-lg">
                            {result.subject_line}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(result.subject_line)}
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>الرسالة بالعربية</Label>
                      <div className="flex items-start gap-2 mt-1">
                        <div className="flex-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                          {result.message_ar}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(result.message_ar)}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {result.message_en && (
                      <div>
                        <Label>الرسالة بالإنجليزية</Label>
                        <div className="flex items-start gap-2 mt-1">
                          <div className="flex-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                            {result.message_en}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(result.message_en)}
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>الدعوة للإجراء</Label>
                      <div className="p-3 bg-muted rounded-lg mt-1">
                        {result.call_to_action}
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div>
                        عدد الأحرف: {result.character_count}
                      </div>
                      <div>
                        الطول المقدر: {result.estimated_length}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>أدخل تفاصيل الحملة لإنشاء رسالة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discount Suggester Tab */}
        <TabsContent value="discount" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  اقتراح خصم مثالي
                </CardTitle>
                <CardDescription>
                  احصل على توصية بنسبة خصم مثالية بناءً على بيانات المبيعات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productName">اسم المنتج *</Label>
                    <Input
                      id="productName"
                      placeholder="منتج تجريبي"
                      value={discountInput.productName}
                      onChange={(e) =>
                        setDiscountInput({
                          ...discountInput,
                          productName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productPrice">سعر المنتج (ريال) *</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      placeholder="100"
                      value={discountInput.productPrice}
                      onChange={(e) =>
                        setDiscountInput({
                          ...discountInput,
                          productPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCategory">تصنيف المنتج</Label>
                  <Input
                    id="productCategory"
                    placeholder="إلكترونيات"
                    value={discountInput.productCategory}
                    onChange={(e) =>
                      setDiscountInput({
                        ...discountInput,
                        productCategory: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>بيانات المبيعات</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      placeholder="متوسط يومي"
                      type="number"
                      value={discountInput.avgDailySales}
                      onChange={(e) =>
                        setDiscountInput({
                          ...discountInput,
                          avgDailySales: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="الأسبوع الماضي"
                      type="number"
                      value={discountInput.lastWeekSales}
                      onChange={(e) =>
                        setDiscountInput({
                          ...discountInput,
                          lastWeekSales: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="الشهر الماضي"
                      type="number"
                      value={discountInput.lastMonthSales}
                      onChange={(e) =>
                        setDiscountInput({
                          ...discountInput,
                          lastMonthSales: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitorPrices">
                    أسعار المنافسين (مفصولة بفواصل)
                  </Label>
                  <Input
                    id="competitorPrices"
                    placeholder="90, 95, 105"
                    value={discountInput.competitorPrices}
                    onChange={(e) =>
                      setDiscountInput({
                        ...discountInput,
                        competitorPrices: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profitMargin">هامش الربح (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    placeholder="30"
                    value={discountInput.profitMargin}
                    onChange={(e) =>
                      setDiscountInput({
                        ...discountInput,
                        profitMargin: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={suggestDiscount}
                  disabled={
                    loading ||
                    !discountInput.productName ||
                    !discountInput.productPrice
                  }
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      اقتراح الخصم
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>التوصية</CardTitle>
                <CardDescription>
                  تحليل الذكاء الاصطناعي وتوصيات الخصم
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">
                          {result.suggested_rate}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          نسبة الخصم المقترحة
                        </div>
                      </div>

                      {result.suggested_amount && (
                        <div className="p-4 bg-primary/10 rounded-lg text-center">
                          <div className="text-3xl font-bold text-primary">
                            {result.suggested_amount} ر.س
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            المبلغ المقترح
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-green-500/10 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-500">
                          +{result.expected_impact.conversion_lift}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          زيادة التحويل
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>التحليل والسبب</Label>
                      <div className="p-3 bg-muted rounded-lg mt-1 whitespace-pre-wrap">
                        {result.reasoning}
                      </div>
                    </div>

                    <div>
                      <Label>التأثير المتوقع على الإيرادات</Label>
                      <div className="grid gap-3 md:grid-cols-3 mt-1">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">
                            الإيرادات
                          </div>
                          <div className="font-semibold">
                            {result.expected_impact.revenue_impact > 0 ? '+' : ''}
                            {result.expected_impact.revenue_impact}%
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">
                            الهامش
                          </div>
                          <div className="font-semibold">
                            {result.expected_impact.margin_impact > 0 ? '+' : ''}
                            {result.expected_impact.margin_impact}%
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-sm text-muted-foreground">
                            التحويل
                          </div>
                          <div className="font-semibold">
                            +{result.expected_impact.conversion_lift}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.alternative_rates && (
                      <div>
                        <Label>بدائل أخرى</Label>
                        <div className="flex gap-2 mt-1">
                          {result.alternative_rates.map((rate: number, i: number) => (
                            <Badge key={i} variant="outline">
                              {rate}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>أفضل وقت للتطبيق</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          {result.best_time_to_apply}
                        </div>
                      </div>
                      <div>
                        <Label>المدة الموصى بها</Label>
                        <div className="p-3 bg-muted rounded-lg mt-1">
                          {result.duration_recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>أدخل بيانات المنتج لتحليل الخصم الأمثل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

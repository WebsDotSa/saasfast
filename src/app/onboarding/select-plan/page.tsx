'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';

interface Plan {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  price: number;
  billing_interval: string;
  features?: any;
  limits?: any;
  included_modules?: string[];
  color: string;
  is_popular?: boolean;
}

export default function SelectPlanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/plans');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'فشل تحميل الخطط');
        }

        setPlans(data.plans || []);
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();
  }, [toast]);

  async function handleSelectPlan(plan: Plan) {
    setIsLoading(plan.id);

    try {
      // Free plan - activate immediately
      if (plan.price === 0) {
        const response = await fetch('/api/tenants/activate-free-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'فشل تفعيل الخطة');
        }

        toast({
          title: 'نجاح',
          description: `تم تفعيل ${plan.name_ar} بنجاح`,
        });

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Paid plan - initiate payment
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'فشل بدء عملية الدفع');
        }

        toast({
          title: 'جاري التحويل',
          description: 'سيتم تحويلك لبوابة الدفع',
        });

        // Redirect to payment URL
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          throw new Error('لم يتم الحصول على رابط الدفع');
        }
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }

  if (loadingPlans) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">اختر الباقة المناسبة</h1>
        <p className="text-muted-foreground">
          اختر الباقة التي تناسب احتياجات منشأتك
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentLoading = isLoading === plan.id;
          const isPopular = plan.is_popular;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all duration-300 ${
                isPopular ? 'border-primary ring-2 ring-primary/20 shadow-lg' : ''
              } ${isCurrentLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  الأكثر شعبية
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <CardTitle className="text-xl">{plan.name_ar}</CardTitle>
                </div>
                {plan.description_ar && (
                  <CardDescription>{plan.description_ar}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> ر.س/شهرياً</span>
                </div>

                <ul className="space-y-3">
                  {plan.features?.custom_domain && (
                    <ListItem>نطاق مخصص</ListItem>
                  )}
                  {plan.features?.api_access && (
                    <ListItem>API Access</ListItem>
                  )}
                  {plan.features?.remove_branding && (
                    <ListItem>إزالة العلامة التجارية</ListItem>
                  )}
                  {plan.features?.priority_support && (
                    <ListItem>دعم ذو أولوية</ListItem>
                  )}
                  {plan.limits?.max_products && (
                    <ListItem>
                      {plan.limits.max_products === -1
                        ? 'منتجات غير محدودة'
                        : `${plan.limits.max_products} منتج`}
                    </ListItem>
                  )}
                  {plan.limits?.max_users && (
                    <ListItem>
                      {plan.limits.max_users === -1
                        ? 'مستخدمين غير محدودين'
                        : `${plan.limits.max_users} مستخدم`}
                    </ListItem>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  disabled={isCurrentLoading}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : plan.price === 0 ? (
                    'ابدأ مجاناً'
                  ) : (
                    'اشترك الآن'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        يمكنك تغيير خطتك أو إلغاء اشتراكك في أي وقت
      </div>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-green-500" />
      {children}
    </li>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, User, Building, Heart } from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'individual',
    label: 'فرد',
    desc: 'مالك لشخص واحد',
    icon: User,
  },
  {
    id: 'foundation',
    label: 'مؤسسة',
    desc: 'مؤسسة فردية بسجل تجاري',
    icon: Building2,
  },
  {
    id: 'company',
    label: 'شركة',
    desc: 'كيان بعدة ملاك',
    icon: Building,
  },
  {
    id: 'nonprofit',
    label: 'جمعية خيرية',
    desc: 'منظمة غير ربحية',
    icon: Heart,
  },
];

export default function BusinessTypePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleSelectBusinessType(businessType: string) {
    setIsLoading(businessType);

    try {
      const response = await fetch('/api/tenants/update-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: businessType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل حفظ نوع النشاط');
      }

      toast({
        title: 'نجاح',
        description: 'تم حفظ نوع النشاط بنجاح',
      });

      // Redirect to plan selection
      router.push('/onboarding/select-plan');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">اختر نوع النشاط التجاري</h1>
        <p className="text-muted-foreground">
          يساعدنا هذا في تخصيص التجربة المناسبة لمنشأتك
        </p>
      </div>

      {/* Business Type Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isCurrentLoading = isLoading === type.id;

          return (
            <Card
              key={type.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary ${
                isCurrentLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => handleSelectBusinessType(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{type.label}</CardTitle>
                </div>
                <CardDescription className="text-right">{type.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={isCurrentLoading}
                >
                  {isCurrentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'اختيار'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        يمكنك تغيير هذا الإعداد لاحقاً من إعدادات المنشأة
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tenantName, setTenantName] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if user already has a tenant
      const hasTenant = (session?.user as any)?.tenant_id;
      if (hasTenant) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Not authenticated - will redirect via useEffect
  if (status === 'unauthenticated') {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = (session?.user as any)?.id;

      if (!userId) {
        toast({
          title: 'خطأ',
          description: 'المستخدم غير موجود',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: tenantName,
          email: (session?.user as any)?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء المنشأة');
      }

      toast({
        title: 'نجاح',
        description: 'تم إنشاء منشأتك بنجاح',
      });

      // Redirect to business type selection
      router.push('/onboarding/business-type');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'authenticated' && (session?.user as any)?.tenant_id) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">إنشاء منشأتك</CardTitle>
          <CardDescription>
            ابدأ بتسمية منشأتك الجديدة — يمكنك تغييرها لاحقاً
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">اسم المنشأة</Label>
              <Input
                id="tenantName"
                placeholder="مثال: متجري، شركتي، مؤسستي"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !tenantName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  إنشاء المنشأة
                  <ArrowRight className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

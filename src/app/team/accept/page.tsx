'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, Mail, LogIn } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    tenantName: string;
    roleName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('رابط الدعوة غير صالح');
      setLoading(false);
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/team/invitation/${token}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'فشل جلب تفاصيل الدعوة');
        }

        setInvitation(result.data);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(err instanceof Error ? err.message : 'الدعوة غير صالحة أو منتهية');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل قبول الدعوة');
      }

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'فشل قبول الدعوة');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
            <CardTitle>جاري تحميل الدعوة...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-2xl">تم قبول الدعوة بنجاح!</CardTitle>
            <CardDescription>
              تم انضمامك إلى الفريق. جاري إعادة التوجيه...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>تسجيل الدخول مطلوب</CardTitle>
            <CardDescription>
              يجب تسجيل الدخول بالبريد الإلكتروني {invitation?.email} لقبول الدعوة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                إذا لم يكن لديك حساب، سيتم إنشاؤه تلقائياً عند قبول الدعوة.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href={`/auth/signin?callbackUrl=/team/accept?token=${token}`} className="w-full">
              <Button className="w-full">
                <LogIn className="w-4 h-4 ml-2" />
                تسجيل الدخول
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (session?.user?.email !== invitation?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <CardTitle>البريد الإلكتروني غير متطابق</CardTitle>
            <CardDescription>
              يجب تسجيل الدخول باستخدام البريد الإلكتروني <strong>{invitation?.email}</strong> لقبول هذه الدعوة
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href={`/auth/signout?callbackUrl=/team/accept?token=${token}`} className="w-full">
              <Button variant="outline" className="w-full">
                تسجيل الخروج وتبديل الحساب
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle>دعوة للانضمام إلى فريق</CardTitle>
          <CardDescription>
            تمت دعوتك للانضمام إلى فريق <strong>{invitation?.tenantName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">البريد الإلكتروني:</span>
                <span className="font-medium">{invitation?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الدور:</span>
                <span className="font-medium">{invitation?.roleName}</span>
              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
            رفض
          </Button>
          <Button onClick={handleAccept} disabled={accepting} className="flex-1">
            {accepting ? 'جاري المعالجة...' : 'قبول الدعوة'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}

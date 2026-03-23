'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  Gift,
  Users,
  DollarSign,
  Copy,
  Share2,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralData {
  referralCode: string;
  referrals: Array<{
    id: string;
    referred_email: string;
    referred_name: string | null;
    status: string;
    reward_amount: number;
    created_at: string;
    converted_at: string | null;
  }>;
  rewards: Array<{
    id: string;
    reward_type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
  }>;
  stats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalRewards: number;
    pendingRewards: number;
  };
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/referrals');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!data?.referralCode) return;

    setCopying(true);
    const referralLink = `${window.location.origin}/auth/signup?ref=${data.referralCode}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: 'نجاح',
        description: 'تم نسخ رابط الإحالة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرابط',
        variant: 'destructive',
      });
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    if (!data?.referralCode) return;

    const referralLink = `${window.location.origin}/auth/signup?ref=${data.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'انضم إلي في SaaS Core',
          text: 'سجل الآن واحصل على خصم خاص',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalReferrals: 0,
    convertedReferrals: 0,
    totalRewards: 0,
    pendingRewards: 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🎁 برنامج الإحالات</h1>
        <p className="text-muted-foreground">
          ادعُ أصدقاءك واحصل على مكافآت قيمة
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإحالات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.convertedReferrals} تحققت
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المكافآت الكلية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRewards.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingRewards.toLocaleString('ar-SA')} ر.س قيد الانتظار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalReferrals > 0
                ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">من إجمالي الإحالات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رمز الإحالة</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{data?.referralCode || '-'}</div>
            <p className="text-xs text-muted-foreground">انسخ وشارك مع أصدقائك</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            شارك رابط الإحالة
          </CardTitle>
          <CardDescription>
            أرسل الرابط لأصدقائك واحصل على مكافآت عند تسجيلهم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/auth/signup?ref=${data?.referralCode || ''}`}
              className="font-mono text-sm"
            />
            <Button onClick={handleCopyLink} disabled={copying || !data?.referralCode}>
              {copying ? (
                <CheckCircle2 className="w-4 h-4 ml-2" />
              ) : (
                <Copy className="w-4 h-4 ml-2" />
              )}
              نسخ
            </Button>
            <Button onClick={handleShare} variant="outline" disabled={!data?.referralCode}>
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-bold mb-2">💡 كيف يعمل البرنامج؟</h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>انسخ رابط الإحالة الخاص بك</li>
              <li>شاركه مع أصدقائك عبر البريد أو وسائل التواصل</li>
              <li>عند تسجيل صديقك، تحصل على مكافأة</li>
              <li>كلما زاد عدد الإحالات، زادت مكافآت!</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            الإحالات
          </CardTitle>
          <CardDescription>قائمة الأشخاص الذين أحلتهم</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.referrals && data.referrals.length > 0 ? (
            <div className="space-y-4">
              {data.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {referral.referred_name || referral.referred_email || 'مستخدم'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={cn(
                        referral.status === 'converted' && 'bg-green-100 text-green-800',
                        referral.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                        referral.status === 'registered' && 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {referral.status === 'converted'
                        ? 'تحققت'
                        : referral.status === 'pending'
                        ? 'قيد الانتظار'
                        : 'مسجل'}
                    </Badge>
                    {referral.reward_amount > 0 && (
                      <span className="text-sm font-bold text-green-600">
                        +{referral.reward_amount.toLocaleString('ar-SA')} ر.س
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد إحالات بعد</p>
              <p className="text-sm">ابدأ بمشاركة رابط الإحالة الخاص بك</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            سجل المكافآت
          </CardTitle>
          <CardDescription>المكافآت التي حصلت عليها</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.rewards && data.rewards.length > 0 ? (
            <div className="space-y-4">
              {data.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{reward.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={reward.status === 'paid' ? 'default' : 'secondary'}
                    >
                      {reward.status === 'paid' ? 'مدفوعة' : 'قيد المعالجة'}
                    </Badge>
                    <span className="text-sm font-bold text-green-600">
                      {reward.amount.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مكافآت بعد</p>
              <p className="text-sm">استمر في دعوة أصدقائك!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Gift, Users, TrendingUp, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
}

export default function LoyaltyDashboardPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch loyalty stats
    fetch('/api/marketing/loyalty/program')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats({
            totalMembers: data.data.totalMembers || 0,
            activeMembers: Math.floor(data.data.totalMembers * 0.6),
            totalPointsIssued: data.data.totalPointsIssued || 0,
            totalPointsRedeemed: data.data.totalPointsRedeemed || 0,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">برنامج الولاء</h1>
          <p className="text-muted-foreground mt-1">
            كافئ عملاءك بالنقاط والمستويات الحصرية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/marketing/loyalty/settings">
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/marketing/loyalty/rewards/new">
              <Plus className="w-4 h-4 ml-2" />
              مكافأة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أعضاء الولاء</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.totalMembers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '-' : stats?.activeMembers || 0} عضو نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النقاط الصادرة</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.totalPointsIssued.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              نقطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النقاط المستردة</CardTitle>
            <Gift className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.totalPointsRedeemed.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              نقطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الاسترداد</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats && stats.totalPointsIssued > 0
                ? Math.round((stats.totalPointsRedeemed / stats.totalPointsIssued) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من النقاط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              المكافآت
            </CardTitle>
            <CardDescription>
              إدارة المكافآت المتاحة للعملاء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/marketing/loyalty/rewards">
                عرض المكافآت
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              الأعضاء
            </CardTitle>
            <CardDescription>
              عرض أعضاء برنامج الولاء ونقاطهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/marketing/loyalty/members">
                عرض الأعضاء
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              المستويات
            </CardTitle>
            <CardDescription>
              إعداد مستويات الولاء والشروط
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/marketing/loyalty/settings">
                الإعدادات
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tiers Preview */}
      <Card>
        <CardHeader>
          <CardTitle>مستويات الولاء</CardTitle>
          <CardDescription>
            المستويات المتاحة في برنامج الولاء
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { name: 'برونزي', icon: '🥉', color: '#cd7f32', points: '0+' },
              { name: 'فضي', icon: '🥈', color: '#c0c0c0', points: '500+' },
              { name: 'ذهبي', icon: '🥇', color: '#ffd700', points: '2000+' },
              { name: 'بلاتيني', icon: '💎', color: '#e5e4e2', points: '5000+' },
            ].map((tier) => (
              <div
                key={tier.name}
                className="p-4 rounded-lg border text-center"
                style={{ borderColor: tier.color + '40', backgroundColor: tier.color + '10' }}
              >
                <div className="text-3xl mb-2">{tier.icon}</div>
                <div className="font-semibold">{tier.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {tier.points} نقطة
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

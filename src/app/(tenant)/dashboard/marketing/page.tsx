'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tag,
  Mail,
  Gift,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Percent,
  Send,
  Star,
  UserPlus,
} from 'lucide-react';

interface MarketingStats {
  discounts: {
    total: number;
    active: number;
    totalSavings: number;
    revenueGenerated: number;
  };
  campaigns: {
    total: number;
    sent: number;
    openRate: number;
    clickRate: number;
  };
  loyalty: {
    totalMembers: number;
    activeMembers: number;
    pointsIssued: number;
    pointsRedeemed: number;
  };
  affiliates: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
  };
}

const marketingModules = [
  {
    id: 'discounts',
    title: 'الخصومات والكوبونات',
    description: 'أنشئ عروضاً ترويجية جذابة بأنواع متعددة',
    icon: Tag,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    href: '/dashboard/marketing/discounts',
    stats: ['خصومات نشطة', 'إجمالي التوفير'],
  },
  {
    id: 'campaigns',
    title: 'الحملات التسويقية',
    description: 'أرسل رسائل SMS وواتساب وإيميل لعملائك',
    icon: Mail,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    href: '/dashboard/marketing/campaigns',
    stats: ['حملات مرسلة', 'معدل الفتح'],
  },
  {
    id: 'loyalty',
    title: 'برنامج الولاء',
    description: 'كافئ عملاءك بالنقاط والمستويات الحصرية',
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    href: '/dashboard/marketing/loyalty',
    stats: ['أعضاء الولاء', 'نقاط مستردة'],
  },
  {
    id: 'affiliates',
    title: 'التسويق بالعمولة',
    description: 'وسّع فريق التسويق وادفع فقط عند البيع',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    href: '/dashboard/marketing/affiliates',
    stats: ['مسوقين نشطين', 'تحويلات'],
  },
];

export default function MarketingDashboardPage() {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch marketing stats
    fetch('/api/marketing/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.data || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch marketing stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التسويق</h1>
          <p className="text-muted-foreground mt-1">
            أدوات تسويقية متكاملة لنمو عملك وزيادة مبيعاتك
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/discounts/new">
            <Plus className="w-4 h-4 ml-2" />
            إنشاء عرض
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الخصومات النشطة</CardTitle>
            <Tag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.discounts.active || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي {loading ? '-' : stats?.discounts.total || 0} خصم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحملات المرسلة</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.campaigns.sent || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              معدل الفتح: {loading ? '-' : `${stats?.campaigns.openRate || 0}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أعضاء الولاء</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.loyalty.totalMembers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '-' : stats?.loyalty.activeMembers || 0} عضو نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسويق بالعمولة</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.affiliates.totalAffiliates || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '-' : stats?.affiliates.totalConversions || 0} تحويل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">وحدات التسويق</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {marketingModules.map((module) => (
            <Card key={module.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${module.bgColor}`}>
                    <module.icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mt-2">
                  {module.stats.map((stat, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-muted-foreground">{stat}:</span>{' '}
                      <span className="font-medium">
                        {loading ? '-' : '0'}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" asChild>
                  <Link href={module.href}>
                    إدارة {module.title}
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">إجراءات سريعة</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
            <Link href="/dashboard/marketing/discounts/new">
              <Percent className="w-5 h-5" />
              <span>إنشاء خصم جديد</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
            <Link href="/dashboard/marketing/campaigns/new">
              <Mail className="w-5 h-5" />
              <span>حملة جديدة</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
            <Link href="/dashboard/marketing/loyalty/rewards">
              <Gift className="w-5 h-5" />
              <span>إضافة مكافأة</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2" asChild>
            <Link href="/dashboard/marketing/affiliates/new">
              <UserPlus className="w-5 h-5" />
              <span>إضافة مسوق</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>
            آخر الأنشطة التسويقية في متجرك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا يوجد نشاط حديث</p>
            <p className="text-sm mt-1">
              ابدأ بإنشاء عرض تسويقي لمتجرك
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

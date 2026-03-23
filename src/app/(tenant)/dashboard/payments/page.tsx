'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  ArrowRight,
  DollarSign,
  CreditCard,
  Building,
} from 'lucide-react';
import Link from 'next/link';

interface MerchantBalance {
  available_balance: string;
  pending_balance: string;
  reserved_balance: string;
  total_earned: string;
  total_withdrawn: string;
  currency: string;
  total_transactions: number;
  successful_transactions: number;
}

interface Transaction {
  id: string;
  gross_amount: string;
  net_amount: string;
  status: string;
  payment_method: string;
  customer_name: string;
  created_at: string;
}

export default function PaymentsPage() {
  const [balance, setBalance] = useState<MerchantBalance | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      
      // جلب الرصيد
      const { data: balanceData } = await supabase
        .from('merchant_balances')
        .select('*')
        .single();
      
      setBalance(balanceData);

      // جلب آخر 5 عمليات
      const { data: transactions } = await supabase
        .from('store_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentTransactions(transactions || []);
    } catch (error) {
      console.error('Error loading payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string | number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    };

    const labels: Record<string, string> = {
      success: 'ناجحة',
      pending: 'قيد الانتظار',
      failed: 'فاشلة',
      refunded: 'مستردة',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المدفوعات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة مدفوعات متجرك وعملياتك المالية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/payments/links">
              <CreditCard className="w-4 h-4 ml-2" />
              روابط الدفع
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/payments/bank-accounts">
              <Building className="w-4 h-4 ml-2" />
              الحسابات البنكية
            </Link>
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* الرصيد المتاح */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(balance?.available_balance || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              جاهز للتحويل الفوري
            </p>
          </CardContent>
        </Card>

        {/* المستحقات قيد المعالجة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المعالجة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(balance?.pending_balance || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تصبح متاحة خلال 24 ساعة
            </p>
          </CardContent>
        </Card>

        {/* إجمالي ما تم كسبه */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي ما تم كسبه</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(balance?.total_earned || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              منذ بداية الاستخدام
            </p>
          </CardContent>
        </Card>

        {/* إجمالي المحوّل */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحوّل</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(balance?.total_withdrawn || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تم تحويلها لحسابك البنكي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* إجمالي العمليات */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمليات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.total_transactions || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="bg-green-500">
                {balance?.successful_transactions || 0} ناجحة
              </Badge>
              <Badge variant="secondary">
                {(balance?.total_transactions || 0) - (balance?.successful_transactions || 0)} أخرى
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* معدل النجاح */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance?.total_transactions && balance.total_transactions > 0
                ? Math.round(((balance.successful_transactions || 0) / balance.total_transactions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من العمليات الناجحة
            </p>
          </CardContent>
        </Card>

        {/* الرصيد المحجوز */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد المحجوز</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(balance?.reserved_balance || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              محجوز للنزاعات والاسترداد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>أهم الإجراءات المتاحة لك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/payments/withdrawal-request">
                <ArrowRight className="w-4 h-4 ml-2" />
                طلب تحويل رصيد
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/payments/links">
                <CreditCard className="w-4 h-4 ml-2" />
                إنشاء رابط دفع
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/payments/transactions">
                <DollarSign className="w-4 h-4 ml-2" />
                عرض كل العمليات
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>آخر العمليات</CardTitle>
              <CardDescription>آخر 5 عمليات دفع في متجرك</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/payments/transactions">
                عرض الكل
                <ArrowRight className="w-4 h-4 mr-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد عمليات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.customer_name || 'عميل'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-medium">
                        {formatAmount(tx.gross_amount)} ر.س
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.payment_method || 'غير محدد'}
                      </p>
                    </div>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

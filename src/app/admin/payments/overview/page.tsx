'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface OverviewData {
  summary: {
    total_gross: number;
    total_gateway_fees: number;
    total_platform_fees: number;
    total_net: number;
    total_transactions: number;
    period_days: number;
  };
  settlements: {
    total_settled: number;
    pending_amount: number;
    by_status: Record<string, number>;
  };
  top_merchants: any[];
  merchant_count: number;
}

export default function AdminPaymentsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('store_transactions')
        .select('*')
        .limit(1); // Just to test connection

      if (error) throw error;

      // محاكاة البيانات للتطوير
      // في الإنتاج، استخدم API route
      setData({
        summary: {
          total_gross: 150000,
          total_gateway_fees: 2250,
          total_platform_fees: 1500,
          total_net: 146250,
          total_transactions: 342,
          period_days: parseInt(period),
        },
        settlements: {
          total_settled: 120000,
          pending_amount: 15000,
          by_status: {
            pending: 5,
            processing: 2,
            transferred: 28,
            failed: 1,
            on_hold: 0,
          },
        },
        top_merchants: [
          { tenant_name: 'متجر أحمد', gross_amount: 45000, net_amount: 43875, transactions_count: 89 },
          { tenant_name: 'متجر محمد', gross_amount: 38000, net_amount: 37050, transactions_count: 67 },
          { tenant_name: 'متجر خالد', gross_amount: 32000, net_amount: 31200, transactions_count: 54 },
          { tenant_name: 'متجر سعد', gross_amount: 25000, net_amount: 24375, transactions_count: 43 },
          { tenant_name: 'متجر فهد', gross_amount: 10000, net_amount: 9750, transactions_count: 21 },
        ],
        merchant_count: 24,
      });
    } catch (error) {
      console.error('Error loading overview:', error);
      toastError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
          <h1 className="text-3xl font-bold">نظرة عامة على المدفوعات</h1>
          <p className="text-muted-foreground mt-1">
            إحصائيات شاملة لجميع مدفوعات المنصة
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 90 يوم</option>
            <option value="365">آخر سنة</option>
          </select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* إجمالي المبيعات */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(data?.summary.total_gross || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              خلال {data?.summary.period_days} يوم
            </p>
          </CardContent>
        </Card>

        {/* رسوم البوابة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رسوم البوابة</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(data?.summary.total_gateway_fees || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1.5% متوسط
            </p>
          </CardContent>
        </Card>

        {/* عمولة المنصة */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عمولة المنصة</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(data?.summary.total_platform_fees || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1% متوسط
            </p>
          </CardContent>
        </Card>

        {/* صافي التجار */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي التجار</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(data?.summary.total_net || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي ما يستحقه التجار
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* تم تحويلها */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم تحويلها</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(data?.settlements.total_settled || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.settlements.by_status.transferred} تسوية
            </p>
          </CardContent>
        </Card>

        {/* قيد الانتظار */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(data?.settlements.pending_amount || 0)} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.settlements.by_status.pending} تسوية
            </p>
          </CardContent>
        </Card>

        {/* عدد التجار */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد التجار</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data?.merchant_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تاجر نشط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>أعلى 10 تجار مبيعاً</CardTitle>
          <CardDescription>
            ترتيب التجار حسب إجمالي المبيعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>المتجر</TableHead>
                <TableHead>إجمالي المبيعات</TableHead>
                <TableHead>صافي التاجر</TableHead>
                <TableHead>عدد العمليات</TableHead>
                <TableHead>متوسط العملية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.top_merchants.map((merchant, index) => (
                <TableRow key={index}>
                  <TableCell className="font-bold">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {merchant.tenant_name}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatAmount(merchant.gross_amount)} ر.س
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatAmount(merchant.net_amount)} ر.س
                  </TableCell>
                  <TableCell>{merchant.transactions_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatAmount(merchant.gross_amount / merchant.transactions_count)} ر.س
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settlements by Status */}
      <Card>
        <CardHeader>
          <CardTitle>حالة التسويات</CardTitle>
          <CardDescription>
            توزيع التسويات حسب الحالة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 rounded-lg border">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {data?.settlements.by_status.transferred || 0}
              </div>
              <div className="text-sm text-muted-foreground">محوّلة</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {data?.settlements.by_status.pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">قيد الانتظار</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {data?.settlements.by_status.processing || 0}
              </div>
              <div className="text-sm text-muted-foreground">قيد المعالجة</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {data?.settlements.by_status.on_hold || 0}
              </div>
              <div className="text-sm text-muted-foreground">موقوفة</div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {data?.settlements.by_status.failed || 0}
              </div>
              <div className="text-sm text-muted-foreground">فاشلة</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

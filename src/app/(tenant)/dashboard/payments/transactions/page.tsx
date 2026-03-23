'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Filter,
  Download,
  Eye,
  CreditCard,
  User,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  myfatoorah_invoice_id: string | null;
  gross_amount: string;
  net_amount: string;
  gateway_fee_amount: string;
  platform_fee_amount: string;
  currency: string;
  status: string;
  payment_method: string;
  payment_network: string;
  card_last4: string | null;
  card_brand: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  settled_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    payment_method: 'all',
    search: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadTransactions();
  }, [pagination.page, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('store_transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // تطبيق الفلتر حسب الحالة
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // تطبيق الفلتر حسب طريقة الدفع
      if (filters.payment_method !== 'all') {
        query = query.eq('payment_method', filters.payment_method);
      }

      // تطبيق الفلتر حسب التاريخ
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date + 'T23:59:59');
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, count } = await query;

      setTransactions(data || []);
      setPagination((prev) => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit),
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
      partial_refund: 'outline',
      chargeback: 'destructive',
    };

    const labels: Record<string, string> = {
      success: 'ناجحة',
      pending: 'قيد الانتظار',
      failed: 'فاشلة',
      refunded: 'مستردة',
      partial_refund: 'مستردة جزئياً',
      chargeback: 'نزاع',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      mada: '💳',
      visa: '💳',
      mastercard: '💳',
      apple_pay: '📱',
      stcpay: '📱',
    };
    return icons[method?.toLowerCase()] || '💰';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العمليات</h1>
          <p className="text-muted-foreground mt-1">
            عرض وتتبع جميع عمليات الدفع
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلترة العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* البحث */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالعميل أو البريد..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pr-10"
                />
              </div>
            </div>

            {/* حالة العملية */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="success">ناجحة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="failed">فاشلة</SelectItem>
                <SelectItem value="refunded">مستردة</SelectItem>
              </SelectContent>
            </Select>

            {/* طريقة الدفع */}
            <Select
              value={filters.payment_method}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, payment_method: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="mada">Mada</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="apple_pay">Apple Pay</SelectItem>
                <SelectItem value="stcpay">STC Pay</SelectItem>
              </SelectContent>
            </Select>

            {/* زر تطبيق الفلتر */}
            <Button onClick={loadTransactions}>تطبيق</Button>
          </div>

          {/* فلترة التاريخ */}
          <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">من تاريخ</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة العمليات</CardTitle>
              <CardDescription>
                {pagination.total} عملية | صفحة {pagination.page} من{' '}
                {pagination.totalPages || 1}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد عمليات</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على عمليات تطابق معايير البحث
              </p>
              <Button variant="outline" onClick={() => setFilters({
                status: 'all',
                payment_method: 'all',
                search: '',
                start_date: '',
                end_date: '',
              })}>
                إعادة تعيين الفلتر
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الرسوم</TableHead>
                    <TableHead>الصافي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {tx.myfatoorah_invoice_id || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {tx.customer_name || 'غير محدد'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tx.customer_email || tx.customer_phone || '-'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getPaymentMethodIcon(tx.payment_method)}
                          </span>
                          <div>
                            <div className="text-sm font-medium">
                              {tx.payment_method || 'غير محدد'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tx.payment_network || ''}
                              {tx.card_last4 && ` •••• ${tx.card_last4}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(tx.gross_amount)} {tx.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatAmount(Number(tx.gateway_fee_amount) + Number(tx.platform_fee_amount))}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatAmount(tx.net_amount)} {tx.currency}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                عرض {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} من{' '}
                {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

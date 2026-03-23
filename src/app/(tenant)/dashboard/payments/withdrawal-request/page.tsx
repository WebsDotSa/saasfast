'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowRight,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  bank_name: string;
  iban: string;
  account_holder: string;
  is_primary: boolean;
  is_verified: boolean;
}

interface MerchantBalance {
  available_balance: string;
  pending_balance: string;
  reserved_balance: string;
  total_earned: string;
  total_withdrawn: string;
}

interface Settlement {
  id: string;
  settlement_number: string;
  gross_amount: string;
  gateway_fees: string;
  platform_fees: string;
  net_amount: string;
  status: string;
  bank_reference: string | null;
  transferred_at: string | null;
  created_at: string;
}

export default function WithdrawalRequestPage() {
  const [balance, setBalance] = useState<MerchantBalance | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bank_account_id: '',
    amount: '',
    notes: '',
  });

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

      // جلب الحسابات البنكية الموثقة
      const { data: accountsData } = await supabase
        .from('merchant_bank_accounts')
        .select('*')
        .eq('is_verified', true)
        .order('is_primary', { ascending: false });
      setAccounts(accountsData || []);

      // جلب طلبات التحويل
      const { data: settlementsData } = await supabase
        .from('settlements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setSettlements(settlementsData || []);

      // تعيين الحساب الأساسي كافتراضي
      const primaryAccount = accountsData?.find((a) => a.is_primary);
      if (primaryAccount) {
        setFormData((prev) => ({ ...prev, bank_account_id: primaryAccount.id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bank_account_id || !formData.amount) {
      toastError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toastError('المبلغ غير صحيح');
      return;
    }

    if (amount > parseFloat(balance?.available_balance || '0')) {
      toastError('الرصيد غير كافي');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('settlements')
        .insert({
          tenant_id: (await supabase.from('merchant_balances').select('tenant_id').single()).data?.tenant_id,
          bank_account_id: formData.bank_account_id,
          gross_amount: amount,
          gateway_fees: Math.round(amount * 0.015 * 100) / 100,
          platform_fees: Math.round(amount * 0.01 * 100) / 100,
          net_amount: amount - Math.round(amount * 0.015 * 100) / 100 - Math.round(amount * 0.01 * 100) / 100,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          period_end: new Date().toISOString(),
          status: 'pending',
          notes: formData.notes || null,
          transaction_count: 1,
        });

      if (error) throw error;

      toastSuccess('تم إرسال طلب التحويل بنجاح');
      setFormData((prev) => ({ ...prev, amount: '', notes: '' }));
      loadData();
    } catch (error: any) {
      toastError('فشل إرسال الطلب: ' + error.message);
    } finally {
      setSubmitting(false);
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
      pending: 'secondary',
      processing: 'default',
      transferred: 'default',
      failed: 'destructive',
      on_hold: 'outline',
    };

    const labels: Record<string, string> = {
      pending: 'قيد المراجعة',
      processing: 'قيد المعالجة',
      transferred: 'تم التحويل',
      failed: 'فشل',
      on_hold: 'موقوف',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">طلب تحويل رصيد</h1>
          <p className="text-muted-foreground mt-1">
            حوّل أرباحك إلى حسابك البنكي
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/payments">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمدفوعات
          </Link>
        </Button>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(balance?.available_balance || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              جاهز للتحويل الفوري
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المعالجة</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(balance?.pending_balance || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تصبح متاحة خلال 24 ساعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحوّل</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(balance?.total_withdrawn || '0')} ر.س
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              منذ البداية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>طلب تحويل جديد</CardTitle>
          <CardDescription>
            أدخل مبلغ التحويل واختر الحساب البنكي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الحساب البنكي */}
            <div className="grid gap-2">
              <Label htmlFor="bank_account">الحساب البنكي</Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bank_account_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      لا توجد حسابات بنكية موثقة
                    </SelectItem>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {account.bank_name} - {account.iban.slice(-4)}
                          {account.is_primary && ' (أساسي)'}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <p className="text-sm text-amber-600">
                  ⚠️ يجب إضافة حساب بنكي موثق أولاً
                </p>
              )}
            </div>

            {/* المبلغ */}
            <div className="grid gap-2">
              <Label htmlFor="amount">مبلغ التحويل (ر.س)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                disabled={accounts.length === 0}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  الحد الأقصى: {formatAmount(balance?.available_balance || '0')} ر.س
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: balance?.available_balance || '0',
                    }))
                  }
                  disabled={accounts.length === 0}
                >
                  الكل
                </Button>
              </div>
            </div>

            {/* الرسوم */}
            {formData.amount && !isNaN(parseFloat(formData.amount)) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المبلغ الإجمالي</span>
                      <span className="font-medium">
                        {formatAmount(formData.amount)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>رسوم البوابة (1.5%)</span>
                      <span>
                        -{formatAmount(Math.round(parseFloat(formData.amount) * 0.015 * 100) / 100)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>عمولة المنصة (1%)</span>
                      <span>
                        -{formatAmount(Math.round(parseFloat(formData.amount) * 0.01 * 100) / 100)} ر.س
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>صافي التحويل</span>
                      <span className="text-green-600">
                        {formatAmount(
                          parseFloat(formData.amount) -
                            Math.round(parseFloat(formData.amount) * 0.015 * 100) / 100 -
                            Math.round(parseFloat(formData.amount) * 0.01 * 100) / 100
                        )} ر.س
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ملاحظات */}
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Input
                id="notes"
                placeholder="أي ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                disabled={accounts.length === 0}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || accounts.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 ml-2" />
                  طلب تحويل
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات</CardTitle>
          <CardDescription>
            آخر 10 طلبات تحويل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد تحويلات بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم التسوية</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead>الرسوم</TableHead>
                    <TableHead>الصافي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>رقم التحويل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-mono text-sm">
                        {settlement.settlement_number}
                      </TableCell>
                      <TableCell>{formatDate(settlement.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(settlement.gross_amount)} ر.س
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatAmount(
                          Number(settlement.gateway_fees) + Number(settlement.platform_fees)
                        )} ر.س
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatAmount(settlement.net_amount)} ر.س
                      </TableCell>
                      <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {settlement.bank_reference || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

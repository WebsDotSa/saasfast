'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building,
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface Merchant {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  balance: {
    available: number;
    pending: number;
    reserved: number;
    total_earned: number;
    total_withdrawn: number;
  };
  stats: {
    total_transactions: number;
    successful_transactions: number;
    month_transactions: number;
  };
  settlements: {
    last_settlement: string | null;
    last_settlement_amount: number;
    pending_amount: number;
    pending_count: number;
  };
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
  created_at: string;
  tenant_name: string;
  bank_name: string;
  iban: string;
}

export default function AdminPaymentsMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total_earned');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    amount: '',
    bank_reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // جلب قائمة التجار
      const merchantsData: Merchant[] = [
        {
          tenant_id: '1',
          tenant_name: 'متجر أحمد',
          tenant_email: 'ahmed@example.com',
          balance: {
            available: 15000,
            pending: 5000,
            reserved: 1000,
            total_earned: 85000,
            total_withdrawn: 65000,
          },
          stats: {
            total_transactions: 234,
            successful_transactions: 228,
            month_transactions: 45,
          },
          settlements: {
            last_settlement: new Date().toISOString(),
            last_settlement_amount: 12000,
            pending_amount: 15000,
            pending_count: 2,
          },
        },
        {
          tenant_id: '2',
          tenant_name: 'متجر محمد',
          tenant_email: 'mohammed@example.com',
          balance: {
            available: 22000,
            pending: 3000,
            reserved: 500,
            total_earned: 120000,
            total_withdrawn: 95000,
          },
          stats: {
            total_transactions: 345,
            successful_transactions: 340,
            month_transactions: 67,
          },
          settlements: {
            last_settlement: new Date().toISOString(),
            last_settlement_amount: 18000,
            pending_amount: 22000,
            pending_count: 1,
          },
        },
      ];

      setMerchants(merchantsData);

      // جلب التسويات المعلقة
      const settlementsData: Settlement[] = [
        {
          id: '1',
          settlement_number: 'STL-202603-0001',
          gross_amount: '15000.00',
          gateway_fees: '225.00',
          platform_fees: '150.00',
          net_amount: '14625.00',
          status: 'pending',
          bank_reference: null,
          created_at: new Date().toISOString(),
          tenant_name: 'متجر أحمد',
          bank_name: 'مصرف الراجحي',
          iban: 'SA4480000123456789012345',
        },
      ];

      setPendingSettlements(settlementsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toastError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number | string) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const handleApproveSettlement = async () => {
    try {
      const supabase = createClient();
      
      // في الإنتاج، استخدم API route
      // await supabase.from('settlements').update({...}
      
      toastSuccess('تمت الموافقة على التحويل بنجاح');
      setSettlementDialogOpen(false);
      loadData();
    } catch (error) {
      toastError('فشل الموافقة على التحويل');
    }
  };

  const filteredMerchants = merchants.filter((m) =>
    m.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tenant_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMerchants = [...filteredMerchants].sort((a, b) => {
    if (sortBy === 'total_earned') {
      return b.balance.total_earned - a.balance.total_earned;
    } else if (sortBy === 'available_balance') {
      return b.balance.available - a.balance.available;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تجار المنصة</h1>
          <p className="text-muted-foreground mt-1">
            إدارة أرباح وتحويلات جميع التجار
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التجار</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحويلات معلقة</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSettlements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرصدة</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(merchants.reduce((sum, m) => sum + m.balance.available, 0))} ر.س
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المحوّل</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(merchants.reduce((sum, m) => sum + m.balance.total_withdrawn, 0))} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Settlements */}
      {pendingSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              تحويلات معلقة للموافقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التسوية</TableHead>
                  <TableHead>التاجر</TableHead>
                  <TableHead>البنك</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الرسوم</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-mono text-sm">
                      {settlement.settlement_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {settlement.tenant_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{settlement.bank_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {settlement.iban.slice(-8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(settlement.gross_amount)} ر.س
                    </TableCell>
                    <TableCell className="text-red-600">
                      {formatAmount(Number(settlement.gateway_fees) + Number(settlement.platform_fees))} ر.س
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatAmount(settlement.net_amount)} ر.س
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(settlement.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchants.find(m => m.tenant_id === settlement.tenant_name) || null);
                            setSettlementForm({
                              amount: settlement.net_amount,
                              bank_reference: '',
                              notes: '',
                            });
                            setSettlementDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          موافقة
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة التجار</CardTitle>
              <CardDescription>
                {sortedMerchants.length} تاجر
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن تاجر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_earned">الأكثر ربحاً</SelectItem>
                  <SelectItem value="available_balance">الرصيد المتاح</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاجر</TableHead>
                <TableHead>الرصيد المتاح</TableHead>
                <TableHead>قيد المعالجة</TableHead>
                <TableHead>إجمالي ما تم كسبه</TableHead>
                <TableHead>إجمالي المحوّل</TableHead>
                <TableHead>العمليات</TableHead>
                <TableHead>آخر تسوية</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMerchants.map((merchant) => (
                <TableRow key={merchant.tenant_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{merchant.tenant_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {merchant.tenant_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatAmount(merchant.balance.available)} ر.س
                  </TableCell>
                  <TableCell className="text-orange-600">
                    {formatAmount(merchant.balance.pending)} ر.س
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(merchant.balance.total_earned)} ر.س
                  </TableCell>
                  <TableCell className="text-blue-600">
                    {formatAmount(merchant.balance.total_withdrawn)} ر.س
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {merchant.stats.successful_transactions} / {merchant.stats.total_transactions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {merchant.settlements.last_settlement
                      ? new Date(merchant.settlements.last_settlement).toLocaleDateString('ar-SA')
                      : '-'}
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
        </CardContent>
      </Card>

      {/* Settlement Approval Dialog */}
      <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الموافقة على تحويل</DialogTitle>
            <DialogDescription>
              تأكيد تحويل المبلغ للتاجر
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>المبلغ الصافي</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(settlementForm.amount)} ر.س
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank_reference">رقم التحويل البنكي</Label>
              <Input
                id="bank_reference"
                placeholder="مثلاً: TRF-123456"
                value={settlementForm.bank_reference}
                onChange={(e) =>
                  setSettlementForm((prev) => ({
                    ...prev,
                    bank_reference: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                placeholder="ملاحظات إضافية..."
                value={settlementForm.notes}
                onChange={(e) =>
                  setSettlementForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleApproveSettlement}>
              <CheckCircle className="w-4 h-4 ml-2" />
              تأكيد التحويل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

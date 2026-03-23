'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Download,
  Search,
  DollarSign,
} from 'lucide-react';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface Settlement {
  id: string;
  settlement_number: string;
  tenant_id: string;
  tenant_name: string;
  gross_amount: string;
  gateway_fees: string;
  platform_fees: string;
  net_amount: string;
  status: string;
  bank_reference: string | null;
  bank_name: string;
  iban: string;
  created_at: string;
  transferred_at: string | null;
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'hold'>('approve');
  const [actionForm, setActionForm] = useState({
    bank_reference: '',
    notes: '',
    rejection_reason: '',
  });

  useEffect(() => {
    loadSettlements();
  }, [statusFilter]);

  const loadSettlements = async () => {
    try {
      const supabase = createClient();
      
      // بيانات تجريبية للتطوير
      const data: Settlement[] = [
        {
          id: '1',
          settlement_number: 'STL-202603-0001',
          tenant_id: '1',
          tenant_name: 'متجر أحمد',
          gross_amount: '15000.00',
          gateway_fees: '225.00',
          platform_fees: '150.00',
          net_amount: '14625.00',
          status: 'pending',
          bank_reference: null,
          bank_name: 'مصرف الراجحي',
          iban: 'SA4480000123456789012345',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          transferred_at: null,
        },
        {
          id: '2',
          settlement_number: 'STL-202603-0002',
          tenant_id: '2',
          tenant_name: 'متجر محمد',
          gross_amount: '22000.00',
          gateway_fees: '330.00',
          platform_fees: '220.00',
          net_amount: '21450.00',
          status: 'transferred',
          bank_reference: 'TRF-789456',
          bank_name: 'البنك الأهلي',
          iban: 'SA5510000123456789012345',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          transferred_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          settlement_number: 'STL-202603-0003',
          tenant_id: '3',
          tenant_name: 'متجر خالد',
          gross_amount: '8000.00',
          gateway_fees: '120.00',
          platform_fees: '80.00',
          net_amount: '7800.00',
          status: 'on_hold',
          bank_reference: null,
          bank_name: 'بنك الرياض',
          iban: 'SA6620000123456789012345',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          transferred_at: null,
        },
        {
          id: '4',
          settlement_number: 'STL-202603-0004',
          tenant_id: '4',
          tenant_name: 'متجر سعد',
          gross_amount: '12000.00',
          gateway_fees: '180.00',
          platform_fees: '120.00',
          net_amount: '11700.00',
          status: 'failed',
          bank_reference: null,
          bank_name: 'البنك السعودي الفرنسي',
          iban: 'SA7730000123456789012345',
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          transferred_at: null,
        },
      ];

      setSettlements(data);
    } catch (error) {
      console.error('Error loading settlements:', error);
      toastError('فشل تحميل التسويات');
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
    const badges: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'قيد الانتظار' },
      processing: { variant: 'default', icon: RefreshCw, label: 'قيد المعالجة' },
      transferred: { variant: 'default', icon: CheckCircle, label: 'تم التحويل' },
      failed: { variant: 'destructive', icon: XCircle, label: 'فشل' },
      on_hold: { variant: 'outline', icon: AlertCircle, label: 'موقوف' },
    };

    const config = badges[status] || badges.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const handleAction = async () => {
    try {
      const supabase = createClient();

      if (actionType === 'approve' && !actionForm.bank_reference) {
        toastError('يرجى إدخال رقم التحويل البنكي');
        return;
      }

      if (actionType === 'reject' && !actionForm.rejection_reason) {
        toastError('يرجى إدخال سبب الرفض');
        return;
      }

      // في الإنتاج، استخدم API route
      // await fetch('/api/admin/payments/settle', {...}

      const actionLabels = {
        approve: 'تمت الموافقة',
        reject: 'تم الرفض',
        hold: 'تم الإيقاف',
      };

      toastSuccess(actionLabels[actionType]);
      setActionDialogOpen(false);
      loadSettlements();
    } catch (error) {
      toastError('فشل تنفيذ الإجراء');
    }
  };

  const openActionDialog = (settlement: Settlement, type: 'approve' | 'reject' | 'hold') => {
    setSelectedSettlement(settlement);
    setActionType(type);
    setActionForm({
      bank_reference: '',
      notes: '',
      rejection_reason: '',
    });
    setActionDialogOpen(true);
  };

  const filteredSettlements = settlements.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchTerm && !s.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !s.settlement_number.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    transferred: settlements.filter(s => s.status === 'transferred').length,
    failed: settlements.filter(s => s.status === 'failed').length,
    on_hold: settlements.filter(s => s.status === 'on_hold').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة التسويات</h1>
          <p className="text-muted-foreground mt-1">
            الموافقة على التحويلات ومتابعة التسويات
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإجمالي</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم التحويل</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.transferred}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موقوفة</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.on_hold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>تصفية التسويات</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالتاجر أو رقم التسوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="transferred">تم التحويل</SelectItem>
                <SelectItem value="on_hold">موقوف</SelectItem>
                <SelectItem value="failed">فاشلة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadSettlements}>تطبيق</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة التسويات</CardTitle>
          <CardDescription>
            {filteredSettlements.length} تسوية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التسوية</TableHead>
                  <TableHead>التاجر</TableHead>
                  <TableHead>البنك</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الرسوم</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>تاريخ التحويل</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map((settlement) => (
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
                          ...{settlement.iban.slice(-6)}
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
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(settlement.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {settlement.transferred_at
                        ? formatDate(settlement.transferred_at)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {settlement.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openActionDialog(settlement, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionDialog(settlement, 'hold')}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionDialog(settlement, 'reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'الموافقة على التحويل'}
              {actionType === 'reject' && 'رفض التحويل'}
              {actionType === 'hold' && 'إيقاف التحويل'}
            </DialogTitle>
            <DialogDescription>
              {selectedSettlement?.tenant_name} - {selectedSettlement?.settlement_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>المبلغ الصافي</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(selectedSettlement?.net_amount || 0)} ر.س
              </div>
            </div>

            {actionType === 'approve' && (
              <div className="grid gap-2">
                <Label htmlFor="bank_reference">رقم التحويل البنكي *</Label>
                <Input
                  id="bank_reference"
                  placeholder="مثلاً: TRF-123456"
                  value={actionForm.bank_reference}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      bank_reference: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {actionType === 'reject' && (
              <div className="grid gap-2">
                <Label htmlFor="rejection_reason">سبب الرفض *</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="اشرح سبب الرفض..."
                  value={actionForm.rejection_reason}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      rejection_reason: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="ملاحظات إضافية..."
                value={actionForm.notes}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAction}
              variant={actionType === 'approve' ? 'default' : actionType === 'reject' ? 'destructive' : 'secondary'}
            >
              {actionType === 'approve' && <CheckCircle className="w-4 h-4 ml-2" />}
              {actionType === 'reject' && <XCircle className="w-4 h-4 ml-2" />}
              {actionType === 'hold' && <Clock className="w-4 h-4 ml-2" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

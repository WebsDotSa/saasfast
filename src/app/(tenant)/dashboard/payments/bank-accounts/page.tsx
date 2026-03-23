'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Star,
  Banknote,
  Copy,
} from 'lucide-react';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string | null;
  iban: string;
  swift_code: string | null;
  is_primary: boolean;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    swift_code: '',
    is_primary: false,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('merchant_bank_accounts')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const supabase = createClient();
      
      // التحقق من صحة IBAN
      if (!validateIBAN(formData.iban)) {
        toastError('رقم IBAN غير صحيح');
        return;
      }

      const { data, error } = await supabase
        .from('merchant_bank_accounts')
        .insert({
          bank_name: formData.bank_name,
          account_holder: formData.account_holder,
          account_number: formData.account_number || null,
          iban: formData.iban.toUpperCase().replace(/\s/g, ''),
          swift_code: formData.swift_code || null,
          is_primary: formData.is_primary,
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      toastSuccess('تم إضافة الحساب البنكي بنجاح');
      setAddDialogOpen(false);
      resetForm();
      loadAccounts();
    } catch (error: any) {
      toastError('فشل إضافة الحساب: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editAccount) return;

    try {
      const supabase = createClient();
      
      if (!validateIBAN(formData.iban)) {
        toastError('رقم IBAN غير صحيح');
        return;
      }

      const { error } = await supabase
        .from('merchant_bank_accounts')
        .update({
          bank_name: formData.bank_name,
          account_holder: formData.account_holder,
          account_number: formData.account_number || null,
          iban: formData.iban.toUpperCase().replace(/\s/g, ''),
          swift_code: formData.swift_code || null,
          is_primary: formData.is_primary,
        })
        .eq('id', editAccount.id);

      if (error) throw error;

      toastSuccess('تم تحديث الحساب البنكي');
      setEditAccount(null);
      resetForm();
      loadAccounts();
    } catch (error: any) {
      toastError('فشل تحديث الحساب: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب البنكي؟')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('merchant_bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toastSuccess('تم حذف الحساب البنكي');
      loadAccounts();
    } catch (error: any) {
      toastError('فشل حذف الحساب: ' + error.message);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('set_primary_bank_account', {
        p_account_id: id,
        p_tenant_id: (await supabase.from('merchant_bank_accounts').select('tenant_id').eq('id', id).single()).data?.tenant_id,
      });

      if (error) throw error;

      toastSuccess('تم تعيين الحساب كأساسي');
      loadAccounts();
    } catch (error: any) {
      toastError('فشل تعيين الحساب كأساسي: ' + error.message);
    }
  };

  const handleCopyIBAN = async (iban: string) => {
    try {
      await navigator.clipboard.writeText(iban);
      toastSuccess('تم نسخ IBAN');
    } catch (error) {
      toastError('فشل نسخ IBAN');
    }
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_holder: '',
      account_number: '',
      iban: '',
      swift_code: '',
      is_primary: false,
    });
  };

  const openEditDialog = (account: BankAccount) => {
    setEditAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number || '',
      iban: account.iban,
      swift_code: account.swift_code || '',
      is_primary: account.is_primary,
    });
    setAddDialogOpen(true);
  };

  const validateIBAN = (iban: string): boolean => {
    const cleanIban = iban.replace(/[\s-]/g, '').toUpperCase();
    
    if (cleanIban.length !== 24) return false;
    if (!cleanIban.startsWith('SA')) return false;
    if (!/^\d+$/.test(cleanIban.substring(2))) return false;
    
    return true;
  };

  const formatIBAN = (iban: string): string => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الحسابات البنكية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة حساباتك البنكية لاستقبال التحويلات
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setEditAccount(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة حساب
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editAccount ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي جديد'}
              </DialogTitle>
              <DialogDescription>
                {editAccount 
                  ? 'تعديل معلومات الحساب البنكي' 
                  : 'أضف حسابك البنكي لاستقبال التحويلات'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bank_name">اسم البنك</Label>
                <Input
                  id="bank_name"
                  placeholder="مثلاً: مصرف الراجحي"
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bank_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_holder">اسم صاحب الحساب</Label>
                <Input
                  id="account_holder"
                  placeholder="الاسم كما في السجل التجاري"
                  value={formData.account_holder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, account_holder: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  placeholder="SAxx xxxx xxxx xxxx xxxx xxxx"
                  value={formData.iban}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, iban: e.target.value }))
                  }
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  يجب أن يكون IBAN سعودي (SA + 22 رقم)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_number">رقم الحساب</Label>
                <Input
                  id="account_number"
                  placeholder="رقم الحساب (اختياري)"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, account_number: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="swift_code">SWIFT Code</Label>
                <Input
                  id="swift_code"
                  placeholder="رمز SWIFT (اختياري)"
                  value={formData.swift_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, swift_code: e.target.value.toUpperCase() }))
                  }
                  className="uppercase"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_primary: checked }))
                  }
                />
                <Label htmlFor="is_primary">تعيين كحساب أساسي</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={editAccount ? handleUpdate : handleAdd}>
                {editAccount ? 'حفظ التعديلات' : 'إضافة الحساب'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            معلومات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            • يجب أن يكون الحساب البنكي باسم المنشأة المسجلة
          </p>
          <p className="text-muted-foreground">
            • رقم IBAN يجب أن يكون صحيحاً (SA + 22 رقم)
          </p>
          <p className="text-muted-foreground">
            • التحويلات تتم خلال 1-3 أيام عمل
          </p>
          <p className="text-muted-foreground">
            • يمكنك تحديد حساب واحد كأساسي للتحويلات التلقائية
          </p>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>الحسابات البنكية</CardTitle>
          <CardDescription>
            {accounts.length} حساب بنكي مسجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد حسابات بنكية</h3>
              <p className="text-muted-foreground mb-4">
                أضف حسابك البنكي الأول لاستقبال التحويلات
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حساب بنكي
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البنك</TableHead>
                    <TableHead>اسم صاحب الحساب</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>SWIFT</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الأساسي</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {account.bank_name}
                        </div>
                      </TableCell>
                      <TableCell>{account.account_holder}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">
                            {formatIBAN(account.iban)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyIBAN(account.iban)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.swift_code || '-'}
                      </TableCell>
                      <TableCell>
                        {account.is_verified ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            موثق
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 ml-1" />
                            غير موثق
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.is_primary ? (
                          <Badge variant="default" className="bg-yellow-600">
                            <Star className="w-3 h-3 ml-1" />
                            أساسي
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(account.id)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(account)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
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

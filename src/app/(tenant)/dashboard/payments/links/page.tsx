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
  CreditCard,
  Plus,
  Copy,
  Share2,
  MessageSquare,
  Link as LinkIcon,
  Check,
  Trash2,
  Clock,
  X,
} from 'lucide-react';
import { toast, toastSuccess, toastError } from '@/hooks/use-toast';

interface PaymentLink {
  id: string;
  link_number: string;
  title: string;
  amount: string;
  currency: string;
  description: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  myfatoorah_url: string | null;
  short_url: string | null;
  status: string;
  payment_status: string;
  transaction_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
  });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading payment links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('payment_links')
        .insert({
          title: formData.title,
          amount: parseFloat(formData.amount),
          currency: 'SAR',
          description: formData.description || null,
          customer_name: formData.customer_name || null,
          customer_phone: formData.customer_phone || null,
          customer_email: formData.customer_email || null,
        })
        .select()
        .single();

      if (error) throw error;

      toastSuccess('تم إنشاء رابط الدفع بنجاح');
      setCreateDialogOpen(false);
      setFormData({
        title: '',
        amount: '',
        description: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
      });
      loadLinks();
    } catch (error: any) {
      toastError('فشل إنشاء رابط الدفع: ' + error.message);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyingId(id);
      toastSuccess('تم نسخ الرابط');
      setTimeout(() => setCopyingId(null), 2000);
    } catch (error) {
      toastError('فشل نسخ الرابط');
    }
  };

  const handleShare = (link: PaymentLink) => {
    const text = `رابط دفع: ${link.title}\nالمبلغ: ${link.amount} ${link.currency}\n${link.myfatoorah_url}`;
    
    if (navigator.share) {
      navigator.share({
        title: link.title,
        text,
        url: link.myfatoorah_url || undefined,
      });
    } else {
      handleCopy(link.myfatoorah_url || '', link.id);
    }
  };

  const handleWhatsAppShare = (link: PaymentLink) => {
    const text = `رابط دفع: ${link.title}\nالمبلغ: ${link.amount} ${link.currency}\n${link.myfatoorah_url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      paid: 'default',
      expired: 'secondary',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      active: 'نشط',
      paid: 'مدفوع',
      expired: 'منتهي',
      cancelled: 'ملغى',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      success: 'default',
      failed: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: 'قيد الدفع',
      success: 'مدفوع',
      failed: 'فاشل',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">روابط الدفع</h1>
          <p className="text-muted-foreground mt-1">
            أنشئ روابط دفع سريعة وشاركها مع عملائك
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء رابط دفع
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء رابط دفع جديد</DialogTitle>
              <DialogDescription>
                أنشئ رابط دفع سريع وشاركه مع عميلك
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">عنوان الرابط</Label>
                <Input
                  id="title"
                  placeholder="مثلاً: منتج مميز"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ (ر.س)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  placeholder="وصف المنتج أو الخدمة..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer_name">اسم العميل (اختياري)</Label>
                <Input
                  id="customer_name"
                  placeholder="اسم العميل"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer_email">البريد الإلكتروني</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customer_email: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer_phone">رقم الهاتف</Label>
                  <Input
                    id="customer_phone"
                    placeholder="05xxxxxxxx"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreate}>
                إنشاء الرابط
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الروابط</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{links.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الروابط النشطة</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links.filter((l) => l.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الروابط المدفوعة</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links.filter((l) => l.payment_status === 'success').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الروابط المنتهية</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links.filter((l) => l.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة روابط الدفع</CardTitle>
          <CardDescription>
            جميع روابط الدفع التي أنشأتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-16">
              <LinkIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد روابط</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإنشاء أول رابط دفع
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء رابط دفع
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الرابط</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-sm">
                        {link.link_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{link.title || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {link.description?.substring(0, 50) || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{link.customer_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {link.customer_email || link.customer_phone || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(link.amount)} {link.currency}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(link.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(link.payment_status)}
                      </TableCell>
                      <TableCell>
                        {link.expires_at ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(link.expires_at)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {link.myfatoorah_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(link.myfatoorah_url!, link.id)}
                              >
                                {copyingId === link.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(link)}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleWhatsAppShare(link)}
                              >
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              </Button>
                            </>
                          )}
                          {link.status === 'active' && (
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
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

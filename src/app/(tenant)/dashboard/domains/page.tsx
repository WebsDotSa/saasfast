'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
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
import { Globe, Plus, Trash2, CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Domain {
  id: string;
  domain: string;
  domain_type: 'custom' | 'subdomain';
  status: 'pending' | 'active' | 'error' | 'ssl_pending' | 'ssl_active' | 'ssl_failed';
  is_primary: boolean;
  verified_at: string | null;
  ssl_verified_at: string | null;
  created_at: string;
}

export default function DomainsPage() {
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const result = await response.json();

      if (result.success) {
        setDomains(result.data);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain || !newDomain.includes('.')) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال نطاق صالح (مثال: mystore.com)',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'نجاح',
          description: 'تم إضافة النطاق بنجاح',
        });
        setDialogOpen(false);
        setNewDomain('');
        fetchDomains();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إضافة النطاق',
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId);
    try {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'نجاح',
          description: 'تم التحقق من النطاق',
        });
        fetchDomains();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل التحقق من النطاق',
        variant: 'destructive',
      });
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النطاق؟')) return;

    setDeleting(domainId);
    try {
      const response = await fetch('/api/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'نجاح',
          description: 'تم حذف النطاق',
        });
        fetchDomains();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف النطاق',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      active: { label: 'نشط', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      error: { label: 'خطأ', color: 'bg-red-100 text-red-800', icon: XCircle },
      ssl_pending: { label: 'SSL قيد الانتظار', color: 'bg-blue-100 text-blue-800', icon: Clock },
      ssl_active: { label: 'SSL نشط', color: 'bg-green-100 text-green-800', icon: Shield },
      ssl_failed: { label: 'SSL فشل', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const { label, color, icon: Icon } = config[status] || config.pending;

    return (
      <Badge className={cn('flex items-center gap-1 w-fit', color)}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const primaryDomain = domains.find(d => d.is_primary);
  const customDomains = domains.filter(d => !d.is_primary);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">النطاقات المخصصة</h1>
          <p className="text-muted-foreground">
            إدارة النطاقات المخصصة لمنشأتك
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة نطاق
        </Button>
      </div>

      {/* Primary Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            النطاق الأساسي
          </CardTitle>
          <CardDescription>
            النطاق الرئيسي لمنشأتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {primaryDomain ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="font-bold text-lg">{primaryDomain.domain}</p>
                <p className="text-sm text-muted-foreground">
                  {primaryDomain.domain_type === 'subdomain' ? 'نطاق فرعي' : 'نطاق مخصص'}
                </p>
              </div>
              {getStatusBadge(primaryDomain.status)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد نطاق أساسي</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            النطاقات المخصصة
          </CardTitle>
          <CardDescription>
            النطاقات المخصصة التي أضفتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customDomains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النطاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell>
                      {domain.ssl_verified_at ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="w-3 h-3 ml-1" />
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(domain.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2 justify-end">
                        {domain.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(domain.id)}
                            disabled={verifying === domain.id}
                          >
                            {verifying === domain.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(domain.id)}
                          disabled={deleting === domain.id}
                        >
                          {deleting === domain.id ? (
                            <Trash2 className="w-4 h-4 animate-pulse" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد نطاقات مخصصة</p>
              <p className="text-sm">أضف نطاقًا مخصصًا لمتجرك</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية إعداد نطاق مخصص</CardTitle>
          <CardDescription>
            اتبع هذه الخطوات لإضافة نطاقك المخصص
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>أضف النطاق في لوحة التحكم أعلاه</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <div className="flex-1">
                  <p>في لوحة تحكم نطاقك (DNS Provider)، أضف السجلات التالية:</p>
                  <div className="mt-2 p-3 bg-background rounded font-mono text-xs space-y-2">
                    <div>
                      <p className="font-bold">A Record:</p>
                      <p>Host: @ → Value: 76.76.21.21</p>
                    </div>
                    <div>
                      <p className="font-bold">CNAME Record:</p>
                      <p>Host: www → Value: cname.vercel-dns.com</p>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>انقر على "تحقق" بعد إضافة السجلات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>سيتم تفعيل SSL تلقائياً خلال دقائق</span>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="w-4 h-4" />
            <a
              href="https://vercel.com/docs/custom-domains"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              دليل Vercel للنطاقات المخصصة
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة نطاق مخصص</DialogTitle>
            <DialogDescription>
              أضف نطاقك المخصص لربطه بمنشأتك
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">النطاق</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                مثال: mystore.com أو shop.mybrand.sa
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddDomain}>
              إضافة النطاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

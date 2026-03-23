'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Plus, MoreVertical, Eye, CheckCircle, XCircle, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: string;
  commissionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  totalEarned: number;
  createdAt: string;
}

export default function AffiliatesListPage() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/marketing/affiliates');
      const data = await res.json();
      if (data.success) {
        setAffiliates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/marketing/affiliates/${id}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        toast({
          title: 'تمت الموافقة',
          description: 'تم الموافقة على المسوق بنجاح',
        });
        fetchAffiliates();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل الموافقة على المسوق',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      pending: { label: 'بانتظار الموافقة', variant: 'secondary' },
      active: { label: 'نشط', variant: 'default' },
      suspended: { label: 'معلق', variant: 'secondary' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
      banned: { label: 'محظور', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التسويق بالعمولة</h1>
          <p className="text-muted-foreground mt-1">
            أدر المسوقين بالعمولة وتتبع أداءهم
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/affiliates/new">
            <Plus className="w-4 h-4 ml-2" />
            مسوق جديد
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المسوقين</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مسوقين نشطين</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التحويلات</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.reduce((sum, a) => sum + (a.totalConversions || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.reduce((sum, a) => sum + (a.totalSales || 0), 0).toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المسوقين</CardTitle>
          <CardDescription>
            {affiliates.length} مسوق
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : affiliates.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد مسوقين</p>
              <Button variant="link" asChild>
                <Link href="/dashboard/marketing/affiliates/new">
                  أضف مسوقك الأول
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسوق</TableHead>
                  <TableHead>كود الإحالة</TableHead>
                  <TableHead>العمولة</TableHead>
                  <TableHead>النقرات</TableHead>
                  <TableHead>التحويلات</TableHead>
                  <TableHead>المبيعات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{affiliate.name}</div>
                        <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{affiliate.referralCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>{affiliate.commissionRate}%</div>
                    </TableCell>
                    <TableCell>{affiliate.totalClicks || 0}</TableCell>
                    <TableCell>{affiliate.totalConversions || 0}</TableCell>
                    <TableCell>{affiliate.totalSales?.toLocaleString() || 0} ر.س</TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/marketing/affiliates/${affiliate.id}`}>
                              <Eye className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </Link>
                          </DropdownMenuItem>
                          {affiliate.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleApprove(affiliate.id)}>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              الموافقة
                            </DropdownMenuItem>
                          )}
                          {affiliate.status === 'active' && (
                            <DropdownMenuItem>
                              <XCircle className="w-4 h-4 ml-2" />
                              تعليق
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

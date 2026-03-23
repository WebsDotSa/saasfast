'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog';
import {
  Tag,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Percent,
  DollarSign,
  Truck,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  nameAr: string;
  nameEn?: string;
  code?: string;
  discountType: string;
  applyingMethod: string;
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

interface DiscountsResponse {
  success: boolean;
  data: Discount[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

const discountTypeIcons: Record<string, any> = {
  percentage: Percent,
  fixed_amount: DollarSign,
  free_shipping: Truck,
  buy_x_get_y: Package,
  bundle: Package,
  tiered: Percent,
};

const discountTypeLabels: Record<string, string> = {
  percentage: 'نسبة مئوية',
  fixed_amount: 'قيمة ثابتة',
  free_shipping: 'شحن مجاني',
  buy_x_get_y: 'اشترِ واحصل',
  bundle: 'حزمة',
  tiered: 'متدرج',
};

export default function DiscountsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('isActive', statusFilter);
      if (typeFilter !== 'all') params.set('discountType', typeFilter);

      const res = await fetch(`/api/marketing/discounts?${params}`);
      const data: DiscountsResponse = await res.json();

      if (data.success) {
        setDiscounts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [statusFilter, typeFilter]);

  const handleDelete = async () => {
    if (!discountToDelete) return;

    try {
      const res = await fetch(`/api/marketing/discounts/${discountToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الخصم بنجاح',
        });
        fetchDiscounts();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف الخصم',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/marketing/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        toast({
          title: 'تم التحديث',
          description: `تم ${currentStatus ? 'تعطيل' : 'تفعيل'} الخصم بنجاح`,
        });
        fetchDiscounts();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحديث حالة الخصم',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({
      title: 'تم النسخ',
      description: `تم نسخ كود الخصم: ${code}`,
    });
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const startsAt = new Date(discount.startsAt);
    const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;

    if (!discount.isActive) {
      return (
        <Badge variant="secondary">
          غير نشط
        </Badge>
      );
    }

    if (startsAt > now) {
      return (
        <Badge variant="outline">
          قريباً
        </Badge>
      );
    }

    if (endsAt && endsAt < now) {
      return (
        <Badge variant="destructive">
          منتهي
        </Badge>
      );
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return (
        <Badge variant="secondary">
          مستنفذ
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="bg-green-500">
        نشط
      </Badge>
    );
  };

  const filteredDiscounts = discounts.filter((discount) => {
    const query = searchQuery.toLowerCase();
    return (
      discount.nameAr.toLowerCase().includes(query) ||
      discount.nameEn?.toLowerCase().includes(query) ||
      discount.code?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الخصومات</h1>
          <p className="text-muted-foreground mt-1">
            أنشئ وأدر العروض الترويجية لزيادة مبيعاتك
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/discounts/new">
            <Plus className="w-4 h-4 ml-2" />
            خصم جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="true">نشط</SelectItem>
                <SelectItem value="false">غير نشط</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="percentage">نسبة مئوية</SelectItem>
                <SelectItem value="fixed_amount">قيمة ثابتة</SelectItem>
                <SelectItem value="free_shipping">شحن مجاني</SelectItem>
                <SelectItem value="buy_x_get_y">اشترِ واحصل</SelectItem>
                <SelectItem value="bundle">حزمة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخصومات</CardTitle>
          <CardDescription>
            {filteredDiscounts.length} خصم من أصل {discounts.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد خصومات</p>
              <Button variant="link" asChild>
                <Link href="/dashboard/marketing/discounts/new">
                  أنشئ خصمك الأول
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الخصم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الاستخدام</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الفترة</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => {
                  const TypeIcon = discountTypeIcons[discount.discountType] || Tag;

                  return (
                    <TableRow key={discount.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{discount.nameAr}</div>
                          {discount.nameEn && (
                            <div className="text-sm text-muted-foreground">
                              {discount.nameEn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" />
                          <span>{discountTypeLabels[discount.discountType]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {discount.code ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{discount.code}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopyCode(discount.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary">تلقائي</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {discount.discountType === 'percentage'
                            ? `${discount.value}%`
                            : discount.discountType === 'free_shipping'
                            ? 'شحن مجاني'
                            : `${discount.value} ر.س`}
                        </div>
                        {discount.minOrderAmount && (
                          <div className="text-sm text-muted-foreground">
                            حد أدنى: {discount.minOrderAmount} ر.س
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          {discount.usedCount}
                          {discount.maxUses ? ` / ${discount.maxUses}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(discount)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            من: {new Date(discount.startsAt).toLocaleDateString('ar-SA')}
                          </div>
                          {discount.endsAt && (
                            <div className="text-muted-foreground">
                              إلى: {new Date(discount.endsAt).toLocaleDateString('ar-SA')}
                            </div>
                          )}
                        </div>
                      </TableCell>
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
                              <Link href={`/dashboard/marketing/discounts/${discount.id}`}>
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyCode(discount.code)}>
                              <Copy className="w-4 h-4 ml-2" />
                              نسخ الكود
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(discount.id, discount.isActive)}
                            >
                              {discount.isActive ? (
                                <>
                                  <EyeOff className="w-4 h-4 ml-2" />
                                  تعطيل
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 ml-2" />
                                  تفعيل
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDiscountToDelete(discount.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الخصم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

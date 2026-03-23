'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  suspendTenant,
  activateTenant,
  cancelTenant,
  changeTenantPlan,
  extendTrial,
  deleteTenant,
} from '@/app/admin/tenants/actions';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Ban, RefreshCw, Clock, Trash2 } from 'lucide-react';

interface Plan {
  id: string;
  name_ar: string;
}

interface TenantActionsProps {
  tenantId: string;
  tenantName: string;
  currentStatus: string;
  plans: Plan[];
  currentPlanId?: string;
}

export function TenantActions({
  tenantId,
  tenantName,
  currentStatus,
  plans,
  currentPlanId,
}: TenantActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState('7');
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId || '');

  async function handle(key: string, fn: () => Promise<void>) {
    setLoading(key);
    try {
      await fn();
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'active' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              تعليق
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعليق المستأجر</DialogTitle>
              <DialogDescription>
                هل تريد تعليق حساب <strong>{tenantName}</strong>؟ سيتوقف وصولهم فوراً.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={loading === 'suspend'}
                onClick={() => handle('suspend', () => suspendTenant(tenantId))}
              >
                {loading === 'suspend' ? 'جاري...' : 'تعليق'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {(currentStatus === 'suspended' || currentStatus === 'cancelled') && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 border-green-300 text-green-700 hover:bg-green-50">
              <CheckCircle className="h-4 w-4" />
              تنشيط
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تنشيط المستأجر</DialogTitle>
              <DialogDescription>
                هل تريد تنشيط حساب <strong>{tenantName}</strong>؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                disabled={loading === 'activate'}
                onClick={() => handle('activate', () => activateTenant(tenantId))}
              >
                {loading === 'activate' ? 'جاري...' : 'تنشيط'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {currentStatus !== 'cancelled' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Ban className="h-4 w-4" />
              إلغاء
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إلغاء الاشتراك</DialogTitle>
              <DialogDescription>
                هل تريد إلغاء اشتراك <strong>{tenantName}</strong>؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={loading === 'cancel'}
                onClick={() => handle('cancel', () => cancelTenant(tenantId))}
              >
                {loading === 'cancel' ? 'جاري...' : 'إلغاء الاشتراك'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* تغيير الخطة */}
      {plans.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              تغيير الخطة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تغيير خطة المستأجر</DialogTitle>
              <DialogDescription>اختر الخطة الجديدة لـ {tenantName}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">الخطة</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر خطة..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                disabled={!selectedPlan || loading === 'changePlan'}
                onClick={() =>
                  handle('changePlan', () => changeTenantPlan(tenantId, selectedPlan))
                }
              >
                {loading === 'changePlan' ? 'جاري...' : 'تغيير الخطة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* تمديد التجربة */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Clock className="h-4 w-4" />
            تمديد تجريبي
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تمديد فترة التجربة</DialogTitle>
            <DialogDescription>تمديد الفترة التجريبية لـ {tenantName}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">عدد الأيام</Label>
            <Input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              min="1"
              max="365"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={loading === 'trial'}
              onClick={() =>
                handle('trial', () => extendTrial(tenantId, parseInt(trialDays)))
              }
            >
              {loading === 'trial' ? 'جاري...' : `تمديد ${trialDays} يوم`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حذف */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            أرشفة
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>أرشفة المستأجر</DialogTitle>
            <DialogDescription>
              هل تريد أرشفة حساب <strong>{tenantName}</strong>؟ هذا الإجراء يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={loading === 'delete'}
              onClick={() =>
                handle('delete', async () => {
                  await deleteTenant(tenantId);
                  router.push('/admin/tenants');
                })
              }
            >
              {loading === 'delete' ? 'جاري...' : 'أرشفة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

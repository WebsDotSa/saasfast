'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createAnnouncement } from '@/app/admin/announcements/actions';

export function AnnouncementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info',
    is_active: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setLoading(true);
    setError('');
    try {
      await createAnnouncement(form);
      setForm({ title: '', content: '', type: 'info', is_active: true });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        + إعلان جديد
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">إنشاء إعلان جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>العنوان *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                placeholder="عنوان الإعلان"
              />
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full h-10 border rounded-md px-3 text-sm bg-background"
              >
                <option value="info">معلومة</option>
                <option value="success">نجاح</option>
                <option value="warning">تحذير</option>
                <option value="maintenance">صيانة</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>الرسالة *</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              required
              placeholder="نص الإعلان للمستأجرين..."
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">نشر الإعلان فوراً</span>
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري النشر...' : 'نشر الإعلان'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnnouncementForm } from '@/components/admin/announcement-form';

export default async function AdminAnnouncementsPage() {
  const supabase = createAdminClient();

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  const TYPE_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
    info: { label: 'معلومة', variant: 'secondary' },
    warning: { label: 'تحذير', variant: 'destructive' },
    success: { label: 'نجاح', variant: 'default' },
    maintenance: { label: 'صيانة', variant: 'outline' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">الإعلانات</h1>
        <p className="text-muted-foreground">إدارة الإعلانات للمستأجرين</p>
      </div>

      <AnnouncementForm />

      <Card>
        <CardHeader>
          <CardTitle>الإعلانات الحالية</CardTitle>
          <CardDescription>{announcements?.length || 0} إعلان</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const type = TYPE_MAP[ann.type] || { label: ann.type, variant: 'outline' as const };
                return (
                  <div key={ann.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={type.variant}>{type.label}</Badge>
                        <span className="font-medium text-sm">{ann.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {ann.is_active ? (
                          <span className="text-green-600 font-medium">نشط</span>
                        ) : (
                          <span>غير نشط</span>
                        )}
                        <span>{new Date(ann.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{ann.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد إعلانات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

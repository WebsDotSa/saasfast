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
import { Mail, Plus, MoreVertical, Edit, Trash2, Eye, Play, Pause, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  channel: string;
  status: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

export default function CampaignsListPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/marketing/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      scheduled: { label: 'مجدولة', variant: 'outline' },
      running: { label: 'جارية', variant: 'default' },
      paused: { label: 'متوقفة', variant: 'secondary' },
      completed: { label: 'مكتملة', variant: 'default' },
      failed: { label: 'فشلت', variant: 'destructive' },
      cancelled: { label: 'ملغاة', variant: 'secondary' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      sms: Send,
      whatsapp: Send,
      push: Send,
    };
    const Icon = icons[channel] || Mail;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الحملات التسويقية</h1>
          <p className="text-muted-foreground mt-1">
            أرسل رسائل SMS وواتساب وإيميل لعملائك
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/campaigns/new">
            <Plus className="w-4 h-4 ml-2" />
            حملة جديدة
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحملات</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المرسلة</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الفتح</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0) > 0 &&
               campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0) > 0
                ? Math.round((campaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0) /
                   campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النقر</CardTitle>
            <Play className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0) > 0 &&
               campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0) > 0
                ? Math.round((campaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0) /
                   campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحملات</CardTitle>
          <CardDescription>
            {campaigns.length} حملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد حملات</p>
              <Button variant="link" asChild>
                <Link href="/dashboard/marketing/campaigns/new">
                  أنشئ حملتك الأولى
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحملة</TableHead>
                  <TableHead>القناة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المرسلة</TableHead>
                  <TableHead>الفتح</TableHead>
                  <TableHead>النقر</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const ChannelIcon = getChannelIcon(campaign.channel);
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="font-medium">{campaign.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="w-4 h-4" />
                          <span className="capitalize">{campaign.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.sentCount || 0}</TableCell>
                      <TableCell>{campaign.openedCount || 0}</TableCell>
                      <TableCell>{campaign.clickedCount || 0}</TableCell>
                      <TableCell>
                        {new Date(campaign.createdAt).toLocaleDateString('ar-SA')}
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
                              <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="w-4 h-4 ml-2" />
                              إرسال
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}

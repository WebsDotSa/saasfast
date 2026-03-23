'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  Users,
  UserPlus,
  MoreVertical,
  Mail,
  Trash2,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  permissions: any[];
  invitation_status: string;
  accepted_at: string | null;
  created_at: string;
  users: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  message: string | null;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

interface TeamData {
  members: TeamMember[];
  invitations: TeamInvitation[];
}

const roleNames: Record<string, string> = {
  owner: 'المالك',
  admin: 'مدير',
  editor: 'محرر',
  viewer: 'مشاهد',
  developer: 'مطور',
};

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  editor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  developer: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function TeamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [teamData, setTeamData] = useState<TeamData>({ members: [], invitations: [] });
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteMessage, setInviteMessage] = useState('');

  const fetchTeamData = useCallback(async () => {
    try {
      const response = await fetch('/api/team');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل جلب البيانات');
      }

      setTeamData(result.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل جلب بيانات الفريق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchTeamData();
    }
  }, [session, fetchTeamData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل إرسال الدعوة');
      }

      toast({
        title: 'نجاح',
        description: 'تم إرسال الدعوة بنجاح',
      });

      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteMessage('');
      fetchTeamData();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إرسال الدعوة',
        variant: 'destructive',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`هل أنت متأكد من إزالة ${email} من الفريق؟`)) {
      return;
    }

    try {
      const response = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل إزالة العضو');
      }

      toast({
        title: 'نجاح',
        description: 'تم إزالة العضو بنجاح',
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إزالة العضو',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch('/api/team/update-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل تحديث الدور');
      }

      toast({
        title: 'نجاح',
        description: 'تم تحديث الدور بنجاح',
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل تحديث الدور',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الدعوة؟')) {
      return;
    }

    try {
      const response = await fetch('/api/team/cancel-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل إلغاء الدعوة');
      }

      toast({
        title: 'نجاح',
        description: 'تم إلغاء الدعوة بنجاح',
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إلغاء الدعوة',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/team/accept?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'نجاح',
        description: 'تم نسخ رابط الدعوة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرابط',
        variant: 'destructive',
      });
    }
  };

  const currentUserRole = teamData.members.find(
    (m) => m.users.email === session?.user?.email
  )?.role;

  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل بيانات الفريق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">فريق العمل</h1>
          <p className="text-muted-foreground">
            إدارة أعضاء الفريق ودعوات الانضمام
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 ml-2" />
            دعوة عضو
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عدد الأعضاء</p>
              <p className="text-2xl font-bold">{teamData.members.length}</p>
            </div>
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الدعوات المعلقة</p>
              <p className="text-2xl font-bold">{teamData.invitations.length}</p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المنشأة</p>
              <p className="text-lg font-semibold truncate max-w-[200px]">
                {session?.user?.name || 'منشأة'}
              </p>
            </div>
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">أعضاء الفريق</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>العضو</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الانضمام</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.users.name?.[0]?.toUpperCase() || member.users.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {member.users.name || member.users.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.users.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(roleColors[member.role])}>
                    {roleNames[member.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.invitation_status === 'accepted' ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      <span>نشط</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <Clock className="w-4 h-4 ml-2" />
                      <span>قيد الانتظار</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.accepted_at
                    ? new Date(member.accepted_at).toLocaleDateString('ar-SA')
                    : '-'}
                </TableCell>
                <TableCell>
                  {canManageTeam && member.users.email !== session?.user?.email && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>تحديث الدور</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                          <Shield className="w-4 h-4 ml-2" />
                          مدير
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'editor')}>
                          محرر
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                          مشاهد
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id, member.users.email)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          إزالة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {teamData.members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  لا يوجد أعضاء في الفريق
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invitations Table */}
      {teamData.invitations.length > 0 && (
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">الدعوات المعلقة</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>أرسلت في</TableHead>
                <TableHead>تنتهي في</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge className={cn(roleColors[invitation.role])}>
                      {roleNames[invitation.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invitation.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invitation.expires_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canManageTeam && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInviteLink(invitation.token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.id)}
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
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دعوة عضو جديد</DialogTitle>
            <DialogDescription>
              أرسل دعوة لشخص ما للانضمام إلى فريقك
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <Input
                  type="email"
                  placeholder="example@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الدور</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                    <SelectItem value="editor">محرر</SelectItem>
                    <SelectItem value="developer">مطور</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رسالة (اختياري)</label>
                <Input
                  placeholder="أضف رسالة شخصية..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? 'جاري الإرسال...' : 'إرسال الدعوة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI Agent Detail — صفحة تفاصيل الوكيل الذكي
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, MessageSquare, BarChart3, Settings, Globe, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  model_name: string;
  is_active: boolean;
  total_conversations: number;
  created_at: string;
  channels?: string[];
  system_prompt?: string;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  support: "دعم فني",
  sales: "مبيعات",
  hr: "موارد بشرية",
  custom: "مخصص",
};

const MODEL_LABELS: Record<string, string> = {
  "claude-sonnet-4-5": "Claude Sonnet 4",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4o": "GPT-4o",
  "gemini-pro": "Gemini Pro",
  "msaed-chat-v1": "Msaed Chat v1",
};

export default function AIAgentDetail() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const res = await fetch(`/api/ai/agents/${agentId}`);
      if (!res.ok) {
        throw new Error("Failed to load agent");
      }
      const data = await res.json();
      setAgent(data);
    } catch (error) {
      console.error("Error loading agent:", error);
      toast.error("فشل تحميل الوكيل");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الوكيل؟")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/ai/agents/${agentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete agent");
      }

      toast.success("تم حذف الوكيل بنجاح");
      router.push("/dashboard/ai");
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("فشل حذف الوكيل");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🤖</div>
          <p className="text-muted-foreground">جاري تحميل الوكيل...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>الوكيل غير موجود</CardTitle>
              <CardDescription>
                لم نتمكن من العثور على الوكيل المطلوب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/dashboard/ai")}>
                العودة للقائمة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/ai")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <Badge variant={agent.is_active ? "default" : "secondary"}>
                  {agent.is_active ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {AGENT_TYPE_LABELS[agent.agent_type] || agent.agent_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/ai/agents/${agentId}/edit`)}>
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                المحادثات
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.total_conversations || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">إجمالي المحادثات</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                النموذج
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {MODEL_LABELS[agent.model_name] || agent.model_name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">AI Model</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تاريخ الإنشاء
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(agent.created_at).toLocaleDateString("ar-SA")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">تاريخ الإنشاء</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="channels">القنوات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الوكيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    الوصف
                  </h3>
                  <p className="text-sm">
                    {agent.description || "لا يوجد وصف"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    نوع الوكيل
                  </h3>
                  <Badge>{AGENT_TYPE_LABELS[agent.agent_type] || agent.agent_type}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    الحالة
                  </h3>
                  <Badge variant={agent.is_active ? "default" : "secondary"}>
                    {agent.is_active ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الوكيل</CardTitle>
                <CardDescription>
                  تكوين النموذج والسلوك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    النموذج المستخدم
                  </h3>
                  <p className="text-sm">
                    {MODEL_LABELS[agent.model_name] || agent.model_name}
                  </p>
                </div>
                {agent.system_prompt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      موجه النظام
                    </h3>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-mono dir-rtl">
                        {agent.system_prompt}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>قنوات التواصل</CardTitle>
                <CardDescription>
                  القنوات المتاحة للوكيل
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.channels && agent.channels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {agent.channels.map((channel) => (
                      <Badge key={channel} variant="outline">
                        {channel === "website" && "🌐 "}
                        {channel === "whatsapp" && "💬 "}
                        {channel === "snap" && "👻 "}
                        {channel === "telegram" && "✈️ "}
                        {channel}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    لم يتم إضافة قنوات بعد
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>تحليلات الوكيل</CardTitle>
                <CardDescription>
                  إحصائيات أداء الوكيل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>التحليلات متاحة قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

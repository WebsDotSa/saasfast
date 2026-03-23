// ═══════════════════════════════════════════════════════════════════════════════
// AI Agent Dashboard — الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  overall: {
    totalConversations: number;
    activeConversations: number;
    closedConversations: number;
    totalMessages: number;
    totalUsers: number;
    avgRating: number;
    avgResponseTime: number;
  };
  daily: Array<{
    date: string;
    conversations: number;
    messages: number;
    users: number;
    avgRating: number;
  }>;
  topAgents: Array<{
    id: string;
    name: string;
    agentType: string;
    totalConversations: number;
    avgRating: number;
  }>;
  knowledge: {
    totalDocuments: number;
    totalUsage: number;
    helpfulRate: number;
  };
  recentConversations: Array<{
    id: string;
    agentName: string;
    customerName: string;
    customerEmail?: string;
    status: string;
    rating: number;
    lastMessageAt: string;
  }>;
}

export default function AIAgentDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/analytics')
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 وكلاء الذكاء الاصطناعي
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                إدارة وتحليل أداء وكلاء الذكاء الاصطناعي
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/ai/agents/new"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                + وكيل جديد
              </Link>
              <Link
                href="/dashboard/ai/knowledge"
                className="px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                📚 قاعدة المعرفة
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="إجمالي المحادثات"
            value={data?.overall.totalConversations || 0}
            icon="💬"
            trend="+12%"
          />
          <StatCard
            title="الرسائل"
            value={data?.overall.totalMessages || 0}
            icon="📝"
            trend="+8%"
          />
          <StatCard
            title="المستخدمين النشطين"
            value={data?.overall.totalUsers || 0}
            icon="👥"
            trend="+15%"
          />
          <StatCard
            title="متوسط التقييم"
            value={data?.overall.avgRating.toFixed(1) || '0'}
            icon="⭐"
            trend="+0.3"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Agents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🏆 أفضل الوكلاء</h2>
            <div className="space-y-4">
              {data?.topAgents.slice(0, 5).map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.agentType}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {agent.totalConversations} محادثة
                    </p>
                    <p className="text-xs text-gray-500">
                      ⭐ {agent.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📚 قاعدة المعرفة</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">إجمالي المستندات</p>
                    <p className="text-sm text-gray-500">مستند معرف</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {data?.knowledge.totalDocuments || 0}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                    👁️
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">إجمالي المشاهدات</p>
                    <p className="text-sm text-gray-500">مرة</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {data?.knowledge.totalUsage || 0}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-xl">
                    ✅
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">معدل الفائدة</p>
                    <p className="text-sm text-gray-500">من المستندات المفيدة</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {data?.knowledge.helpfulRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">💬 المحادثات الأخيرة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الوكيل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    التقييم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    آخر رسالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.recentConversations.slice(0, 10).map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {conv.customerName || 'غير معروف'}
                      </div>
                      {conv.customerEmail && (
                        <div className="text-sm text-gray-500">
                          {conv.customerEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{conv.agentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={conv.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conv.rating ? (
                        <div className="flex items-center gap-1">
                          {'⭐'.repeat(conv.rating)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(conv.lastMessageAt).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2">↑ {trend}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    closed: 'bg-blue-100 text-blue-800',
    escalated: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800',
  };

  const labels: Record<string, string> = {
    active: 'نشط',
    closed: 'مغلقة',
    escalated: 'مُصعدة',
    paused: 'موقوفة',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

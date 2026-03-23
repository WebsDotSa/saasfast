// ═══════════════════════════════════════════════════════════════════════════════
// Create New AI Agent — صفحة إنشاء وكيل جديد
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AGENT_TYPES = [
  { id: "support", name: "دعم فني", icon: "🎧" },
  { id: "sales", name: "مبيعات", icon: "💰" },
  { id: "hr", name: "موارد بشرية", icon: "👥" },
  { id: "custom", name: "مخصص", icon: "⚙️" },
];

const MODELS = [
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    arabic: true,
  },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", arabic: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", arabic: true },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google", arabic: false },
  {
    id: "msaed-chat-v1",
    name: "Msaed Chat v1",
    provider: "Msaed",
    arabic: true,
  },
];

const CHANNELS = [
  { id: "website", name: "الموقع", icon: "🌐" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "snap", name: "Snapchat", icon: "👻" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
];

export default function CreateAIAgent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agentType: "support",
    modelName: "claude-sonnet-4-5",
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 1000,
    channels: [] as string[],
    primaryColor: "#6c63ff",
    welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create agent");
      }

      // Redirect to agents list
      router.push("/dashboard/ai");
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("حدث خطأ أثناء إنشاء الوكيل");
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((c) => c !== channelId)
        : [...prev.channels, channelId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                إنشاء وكيل ذكي جديد
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                قم بتكوين وكيل الذكاء الاصطناعي حسب احتياجاتك
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">المعلومات الأساسية</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الوكيل *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: مساعد الدعم الذكي"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="وصف قصير لدور الوكيل..."
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الوكيل *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AGENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, agentType: type.id })
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.agentType === type.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="text-sm font-medium">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Model */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              نموذج الذكاء الاصطناعي
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                النموذج *
              </label>
              <select
                value={formData.modelName}
                onChange={(e) =>
                  setFormData({ ...formData, modelName: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider}) {model.arabic && "🇸🇦"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                💡 نماذج Claude و GPT-4 تدعم العربية بشكل ممتاز
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({formData.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  قيم أعلى = إبداع أكثر، قيم أقل = إجابات أكثر تحفظاً
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens ({formData.maxTokens})
                </label>
                <input
                  type="number"
                  min="100"
                  max="4096"
                  step="100"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  الحد الأقصى لعدد الرموز في الإجابة
                </p>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">تعليمات النظام</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt *
              </label>
              <textarea
                required
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder="أنت مساعد دعم فني محترف..."
                dir="rtl"
              />
              <p className="mt-2 text-sm text-gray-500">
                📝 هذه التعليمات تحدد شخصية وسلوك الوكيل
              </p>
            </div>
          </div>

          {/* Channels */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">القنوات</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.channels.includes(channel.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{channel.icon}</div>
                  <div className="text-sm font-medium">{channel.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">المظهر</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اللون الأساسي
                </label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رسالة الترحيب
                </label>
                <input
                  type="text"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, welcomeMessage: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الوكيل"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

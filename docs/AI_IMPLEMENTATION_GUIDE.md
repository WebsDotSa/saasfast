# 🚀 دليل التنفيذ السريع — تكامل الذكاء الاصطناعي

**دليل عملي خطوة بخطوة لتنفيذ AI Integration**

**تاريخ الإنشاء:** 21 مارس 2026  
**المستوى:** عملي وتنفيذي

---

## 📦 الخطوة 1: تثبيت الحزم (5 دقائق)

```bash
# Vercel AI SDK — الواجهة الموحدة للذكاء الاصطناعي
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# LangChain — للتطبيقات المتقدمة
npm install langchain @langchain/core @langchain/community

# Token counting
npm install tiktoken

# أو كلها مرة واحدة
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google langchain tiktoken
```

---

## 🔧 الخطوة 2: إضافة متغيرات البيئة (3 دقائق)

أضف هذه المتغيرات إلى `.env.local`:

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🤖 AI CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Anthropic (Claude) — موصى به للعربية
ANTHROPIC_API_KEY=sk-ant-your-key-here

# OpenAI (GPT-4) — للتحليلات المتقدمة
OPENAI_API_KEY=sk-your-key-here

# Google (Gemini) — بديل منخفض التكلفة
GOOGLE_AI_API_KEY=your-key-here

# Msaed.ai — للنماذج العربية (اختياري)
MSAED_API_KEY=your-key-here

# AI Gateway Configuration
AI_DEFAULT_MODEL=claude-sonnet-4
AI_FALLBACK_MODELS=gpt-4-turbo,msaed-chat-v1
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Caching
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600

# Rate Limiting
AI_RATE_LIMIT_REQUESTS_PER_MINUTE=60
AI_RATE_LIMIT_TOKENS_PER_MINUTE=10000

# Cost Tracking
AI_COST_TRACKING_ENABLED=true
AI_MONTHLY_BUDGET_USD=1000
AI_COST_ALERT_THRESHOLD=0.8
```

---

## 🗄️ الخطوة 3: ترحيل قاعدة البيانات (5 دقائق)

```bash
# في Supabase Dashboard → SQL Editor
# شغّل الملف التالي:

supabase/migrations/025_ai_vector_store.sql
```

**أو عبر CLI:**

```bash
npx supabase migration up
```

**ماذا يُنشئ هذا الملف؟**

✅ 7 جداول جديدة:

- `ai_documents` — مستندات المعرفة (RAG)
- `ai_conversations` — سجل المحادثات
- `ai_usage_logs` — سجل الاستخدام
- `ai_knowledge_base` — قاعدة المعرفة
- `ai_models` — سجل النماذج
- `ai_prompts` — مكتبة القوالب
- `ai_quotas` — حدود الاستخدام

✅ Functions:

- `search_similar_documents()` — بحث تشابهي
- `track_ai_usage()` — تتبع التكلفة
- `get_ai_usage_current_month()` — إحصاءات الشهر
- `check_ai_quota()` — التحقق من الحدود

✅ RLS Policies — عزل كامل للبيانات

✅ Indexes — أداء سريع

---

## 🏗️ الخطوة 4: بناء AI Gateway (30 دقيقة)

أنشئ الملف التالي:

```typescript
// src/lib/ai/gateway.ts
import { generateText, streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { db } from "@/lib/db";
import { aiUsageLogs, aiModels } from "@/lib/db/schema";

interface AIRequest {
  tenantId: string;
  userId: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

interface AIResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number;
}

class AIGateway {
  private models = {
    anthropic: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
    openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    google: createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY }),
  };

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. Select model
    const modelName =
      request.model || process.env.AI_DEFAULT_MODEL || "claude-sonnet-4-5";
    const model = this.selectModel(modelName);

    try {
      // 2. Generate response
      const result = await generateText({
        model,
        messages: request.messages,
        system: request.system,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 1000,
      });

      const latency = Date.now() - startTime;

      // 3. Calculate cost
      const cost = await this.calculateCost(modelName, result.usage);

      // 4. Log usage
      await this.logUsage({
        ...request,
        model: modelName,
        usage: result.usage,
        cost,
        latency,
        success: true,
      });

      return {
        text: result.text,
        model: modelName,
        usage: result.usage,
        cost,
        latency,
      };
    } catch (error) {
      // 5. Fallback to alternative model
      console.error("[AI Gateway] Error:", error);

      await this.logUsage({
        ...request,
        model: modelName,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        latency: Date.now() - startTime,
      });

      throw error;
    }
  }

  async stream(request: AIRequest) {
    const modelName = request.model || "claude-sonnet-4-5";
    const model = this.selectModel(modelName);

    return streamText({
      model,
      messages: request.messages,
      system: request.system,
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 1000,
    });
  }

  private selectModel(modelName: string) {
    if (modelName.includes("claude")) {
      return this.models.anthropic(modelName);
    }
    if (modelName.includes("gpt")) {
      return this.models.openai(modelName);
    }
    if (modelName.includes("gemini")) {
      return this.models.google(modelName);
    }
    // Default to Claude
    return this.models.anthropic("claude-sonnet-4-5");
  }

  private async calculateCost(model: string, usage: any): Promise<number> {
    const pricing: Record<string, { input: number; output: number }> = {
      "claude-sonnet-4-5": { input: 0.003, output: 0.015 },
      "gpt-4-turbo": { input: 0.01, output: 0.03 },
      "gemini-pro": { input: 0.0005, output: 0.0015 },
    };

    const modelPricing = pricing[model] || pricing["claude-sonnet-4-5"];
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;

    return inputCost + outputCost;
  }

  private async logUsage(data: any) {
    await db.insert(aiUsageLogs).values({
      tenantId: data.tenantId,
      userId: data.userId,
      requestType: "chat",
      modelUsed: data.model,
      promptTokens: data.usage?.promptTokens || 0,
      completionTokens: data.usage?.completionTokens || 0,
      totalTokens: data.usage?.totalTokens || 0,
      costUsd: data.cost || 0,
      latencyMs: data.latency || 0,
      success: data.success,
      errorMessage: data.errorMessage,
      createdAt: new Date(),
    });
  }
}

export const aiGateway = new AIGateway();
```

---

## 💬 الخطوة 5: إنشاء API Support Chat (20 دقيقة)

```typescript
// src/app/api/ai/support/chat/route.ts
import { aiGateway } from "@/lib/ai/gateway";
import { searchSimilarDocuments } from "@/lib/ai/vector-store";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { messages, tenantId } = body;

    // 1. Get last user message
    const lastMessage = messages[messages.length - 1];

    // 2. Search knowledge base (RAG)
    // Note: Implement embedding generation
    const similarDocs = await searchSimilarDocuments(
      tenantId,
      null, // embedding - implement later
      5,
      ["knowledge_base", "faq", "product_info"],
    );

    // 3. Build context from documents
    const context = similarDocs
      .map((doc: any) => `Source: ${doc.title}\nContent: ${doc.content}`)
      .join("\n\n");

    // 4. Create system prompt with context
    const systemPrompt = `أنت مساعد دعم فني محترف.

استخدم المعلومات التالية من قاعدة المعرفة للإجابة:

${context}

إذا لم تجد الإجابة في السياق، اعتذر بلباقة واقترح التواصل مع الدعم البشري.
تحدث باللهجة السعودية المهذبة.
كن مختصراً ومفيداً.`;

    // 5. Call AI Gateway
    const result = await aiGateway.stream({
      tenantId,
      userId: session.user.id,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      model: "claude-sonnet-4-5",
      temperature: 0.7,
      maxTokens: 500,
    });

    // 6. Return stream
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Support Chat] Error:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
```

---

## 🎨 الخطوة 6: بناء Chat Component (25 دقيقة)

```tsx
// src/components/ai/support-chat.tsx
"use client";

import { useChat } from "ai/react";
import { useState } from "react";

interface SupportChatProps {
  tenantId: string;
}

export function SupportChat({ tenantId }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `/api/ai/support/chat?tenantId=${tenantId}`,
    });

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {isOpen ? (
          <span className="text-2xl">❌</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary to-secondary">
            <h3 className="text-lg font-semibold text-white">
              🤖 المساعد الذكي
            </h3>
            <p className="text-sm text-white/80">اسألني أي شيء!</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إرسال
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

---

## 📊 الخطوة 7: بناء AI Dashboard (40 دقيقة)

```tsx
// src/app/(tenant)/dashboard/ai/page.tsx
"use client";

import { useEffect, useState } from "react";

interface AIUsage {
  totalTokens: number;
  totalCostUsd: number;
  totalRequests: number;
  remainingTokens: number;
  remainingCost: number;
}

export default function AIDashboard() {
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => res.json())
      .then((data) => {
        setUsage(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📊 استخدام الذكاء الاصطناعي</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">Tokens المستخدمة</div>
          <div className="text-3xl font-bold text-primary">
            {usage?.totalTokens.toLocaleString() || 0}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            المتبقي: {usage?.remainingTokens.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">التكلفة (USD)</div>
          <div className="text-3xl font-bold text-green-600">
            ${usage?.totalCostUsd.toFixed(2) || "0.00"}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            الميزانية: $
            {(usage?.totalCostUsd + (usage?.remainingCost || 0)).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">عدد الطلبات</div>
          <div className="text-3xl font-bold text-purple-600">
            {usage?.totalRequests.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-sm text-gray-500 mb-2">متوسط التكلفة/طلب</div>
          <div className="text-3xl font-bold text-orange-600">
            $
            {((usage?.totalCostUsd || 0) / (usage?.totalRequests || 1)).toFixed(
              4,
            )}
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="bg-white rounded-lg p-6 shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">تقدم الاستخدام الشهري</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Tokens</span>
              <span className="text-sm text-gray-600">
                {usage && usage.totalTokens > 0
                  ? Math.round(
                      (usage.totalTokens /
                        (usage.totalTokens + usage.remainingTokens)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: usage
                    ? `${Math.min(
                        100,
                        (usage.totalTokens /
                          (usage.totalTokens + usage.remainingTokens)) *
                          100,
                      )}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">التكلفة</span>
              <span className="text-sm text-gray-600">
                {usage && usage.totalCostUsd > 0
                  ? Math.round(
                      (usage.totalCostUsd /
                        (usage.totalCostUsd + usage.remainingCost)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{
                  width: usage
                    ? `${Math.min(
                        100,
                        (usage.totalCostUsd /
                          (usage.totalCostUsd + usage.remainingCost)) *
                          100,
                      )}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/ai/knowledge"
          className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">📚 قاعدة المعرفة</h3>
          <p className="text-sm text-gray-600">إدارة المستندات والـ FAQ</p>
        </a>

        <a
          href="/dashboard/ai/conversations"
          className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">💬 المحادثات</h3>
          <p className="text-sm text-gray-600">سجل المحادثات والتقييمات</p>
        </a>

        <a
          href="/dashboard/ai/settings"
          className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">⚙️ الإعدادات</h3>
          <p className="text-sm text-gray-600">تكوين النماذج والحدود</p>
        </a>
      </div>
    </div>
  );
}
```

---

## ✅ قائمة التحقق النهائية

### Infrastructure

- [ ] حزم AI مثبتة
- [ ] متغيرات البيئة مُضافة
- [ ] Migration 025 تم تشغيله
- [ ] جداول AI موجودة في قاعدة البيانات
- [ ] RLS Policies مفعّلة

### AI Gateway

- [ ] AI Gateway مُنشأ
- [ ] اختيار النموذج يعمل
- [ ] Cost tracking مُطبّق
- [ ] Logging مُفعّل
- [ ] Fallback strategy موجود

### Support Chat

- [ ] API Route مُنشأ
- [ ] RAG integration يعمل
- [ ] Chat Component مُنشأ
- [ ] Streaming يعمل
- [ ] UI/UX مناسب

### Dashboard

- [ ] AI Dashboard مُنشأ
- [ ] Usage stats تظهر
- [ ] Progress bars تعمل
- [ ] Quick actions موجودة

### Testing

- [ ] اختبار دردشة بالعربي
- [ ] اختبار تكلفة منخفضة
- [ ] اختبار RAG search
- [ ] اختبار error handling
- [ ] اختبار rate limiting

---

## 🎯 الخطوات التالية

بعد إكمال هذا الدليل:

1. **تحسين RAG** — إضافة embeddings حقيقية
2. **بناء Knowledge Base Import** — رفع ملفات PDF/Word
3. **إضافة Analytics** — تحليل المحادثات
4. **تحسين Prompts** — A/B testing
5. **تكامل WhatsApp** — دعم متعدد القنوات

---

**الوقت المتوقع للتنفيذ الكامل:** 3-4 ساعات  
**المستوى المطلوب:** متوسط في Next.js و React

**للدعم:** راجع `AI_INTEGRATION_STRATEGY.md` للتفاصيل الكاملة

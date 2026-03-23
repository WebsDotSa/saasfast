// ═══════════════════════════════════════════════════════════════════════════════
// AI Gateway — البوابة الموحدة للذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════
// Unified AI Gateway with multi-provider support
// Supports: OpenAI, Anthropic, Google, Msaed (Arabic)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  generateText,
  streamText,
  type CoreMessage,
  type TextStreamPart,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// ───────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ───────────────────────────────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic" | "google" | "msaed";

export interface AIModelConfig {
  provider: AIProvider;
  modelName: string;
  maxTokens: number;
  contextWindow: number;
  inputCostPer1K: number;
  outputCostPer1K: number;
  supportsVision: boolean;
  supportsFunctions: boolean;
}

export interface AIRequest {
  tenantId: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  messages: CoreMessage[];
  system?: string;
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  useRAG?: boolean;
  ragLimit?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: AIProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    usd: number;
    sar: number;
  };
  latency: number;
  finishReason: string;
  warnings?: any[];
}

export interface StreamRequest extends AIRequest {
  onChunk?: (chunk: TextStreamPart<any>) => void;
  onFinish?: (response: AIResponse) => void;
}

// ───────────────────────────────────────────────────────────────────────────────
// Model Configurations
// ───────────────────────────────────────────────────────────────────────────────

export const MODEL_CONFIGS: Record<string, AIModelConfig> = {
  // Anthropic Models
  "claude-sonnet-4-5": {
    provider: "anthropic",
    modelName: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsVision: true,
    supportsFunctions: true,
  },
  "claude-opus-3": {
    provider: "anthropic",
    modelName: "claude-3-opus-20240229",
    maxTokens: 4096,
    contextWindow: 200000,
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    supportsVision: true,
    supportsFunctions: true,
  },
  "claude-haiku-3": {
    provider: "anthropic",
    modelName: "claude-3-haiku-20240307",
    maxTokens: 4096,
    contextWindow: 200000,
    inputCostPer1K: 0.00025,
    outputCostPer1K: 0.00125,
    supportsVision: true,
    supportsFunctions: true,
  },

  // OpenAI Models
  "gpt-4-turbo": {
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    maxTokens: 4096,
    contextWindow: 128000,
    inputCostPer1K: 0.01,
    outputCostPer1K: 0.03,
    supportsVision: true,
    supportsFunctions: true,
  },
  "gpt-4o": {
    provider: "openai",
    modelName: "gpt-4o",
    maxTokens: 4096,
    contextWindow: 128000,
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.015,
    supportsVision: true,
    supportsFunctions: true,
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    modelName: "gpt-3.5-turbo-0125",
    maxTokens: 4096,
    contextWindow: 16385,
    inputCostPer1K: 0.0005,
    outputCostPer1K: 0.0015,
    supportsVision: false,
    supportsFunctions: true,
  },

  // Google Models
  "gemini-pro": {
    provider: "google",
    modelName: "gemini-pro",
    maxTokens: 2048,
    contextWindow: 32000,
    inputCostPer1K: 0.0005,
    outputCostPer1K: 0.0015,
    supportsVision: true,
    supportsFunctions: true,
  },
  "gemini-ultra": {
    provider: "google",
    modelName: "gemini-ultra",
    maxTokens: 4096,
    contextWindow: 128000,
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.015,
    supportsVision: true,
    supportsFunctions: true,
  },

  // Msaed Models (Arabic-focused)
  "msaed-chat-v1": {
    provider: "msaed",
    modelName: "msaed-chat-v1",
    maxTokens: 2048,
    contextWindow: 32000,
    inputCostPer1K: 0.002,
    outputCostPer1K: 0.006,
    supportsVision: false,
    supportsFunctions: false,
  },
};

// Default model for Arabic support
export const DEFAULT_MODEL = "claude-sonnet-4-5";
export const DEFAULT_ARABIC_MODEL = "msaed-chat-v1";

// ───────────────────────────────────────────────────────────────────────────────
// AI Gateway Class
// ───────────────────────────────────────────────────────────────────────────────

class AIGateway {
  private providers: Record<AIProvider, any>;

  constructor() {
    this.providers = {
      openai: createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      }),
      anthropic: createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      }),
      google: createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      }),
      msaed: createOpenAI({
        apiKey: process.env.MSAED_API_KEY,
        baseURL: "https://api.msaed.ai/v1",
      }),
    };
  }

  /**
   * Generate text response
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. Select model
    const modelName = request.model || DEFAULT_MODEL;
    const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS[DEFAULT_MODEL];

    // 2. Get provider model
    const providerModel = this.providers[config.provider](config.modelName);

    try {
      // 3. Generate response
      const result = await generateText({
        model: providerModel,
        messages: request.messages,
        system: request.system,
        temperature: request.temperature || config.inputCostPer1K,
        maxTokens: request.maxTokens || config.maxTokens,
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
        stopSequences: request.stopSequences,
      });

      const latency = Date.now() - startTime;

      // 4. Calculate cost
      const cost = this.calculateCost(
        config,
        result.usage.promptTokens,
        result.usage.completionTokens,
      );

      return {
        text: result.text,
        model: modelName,
        provider: config.provider,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        cost,
        latency,
        finishReason: result.finishReason,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error("[AI Gateway] Generation error:", error);
      throw error;
    }
  }

  /**
   * Stream text response
   */
  async stream(request: StreamRequest) {
    const modelName = request.model || DEFAULT_MODEL;
    const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS[DEFAULT_MODEL];
    const providerModel = this.providers[config.provider](config.modelName);

    return streamText({
      model: providerModel,
      messages: request.messages,
      system: request.system,
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || config.maxTokens,
      topP: request.topP,
      frequencyPenalty: request.frequencyPenalty,
      presencePenalty: request.presencePenalty,
      stopSequences: request.stopSequences,
      onFinish: async (result) => {
        const cost = this.calculateCost(
          config,
          result.usage.promptTokens,
          result.usage.completionTokens,
        );

        if (request.onFinish) {
          await request.onFinish({
            text: result.text,
            model: modelName,
            provider: config.provider,
            usage: {
              promptTokens: result.usage.promptTokens,
              completionTokens: result.usage.completionTokens,
              totalTokens: result.usage.totalTokens,
            },
            cost,
            latency: Date.now(),
            finishReason: result.finishReason,
          });
        }
      },
    });
  }

  /**
   * Calculate cost based on model pricing
   */
  private calculateCost(
    config: AIModelConfig,
    promptTokens: number,
    completionTokens: number,
  ): { usd: number; sar: number } {
    const inputCost = (promptTokens / 1000) * config.inputCostPer1K;
    const outputCost = (completionTokens / 1000) * config.outputCostPer1K;
    const totalUSD = inputCost + outputCost;
    const totalSAR = totalUSD * 3.75;

    return {
      usd: totalUSD,
      sar: totalSAR,
    };
  }

  /**
   * Select best model based on language and task
   */
  selectModel(options: {
    language?: "ar" | "en" | "auto";
    task?: "chat" | "analysis" | "code" | "translation";
    budget?: "low" | "medium" | "high";
  }): string {
    const { language = "auto", task = "chat", budget = "medium" } = options;

    // Arabic priority
    if (language === "ar") {
      return DEFAULT_ARABIC_MODEL;
    }

    // Task-based selection
    switch (task) {
      case "code":
        return "claude-sonnet-4-5";
      case "analysis":
        return budget === "high" ? "claude-opus-3" : "claude-sonnet-4-5";
      case "translation":
        return "gemini-pro";
      default:
        return budget === "high" ? "gpt-4o" : "claude-sonnet-4-5";
    }
  }

  /**
   * Get model info
   */
  getModelInfo(modelName: string): AIModelConfig | null {
    return MODEL_CONFIGS[modelName] || null;
  }

  /**
   * List available models
   */
  listModels(provider?: AIProvider): AIModelConfig[] {
    const models = Object.values(MODEL_CONFIGS);
    return provider ? models.filter((m) => m.provider === provider) : models;
  }
}

// Export singleton instance
export const aiGateway = new AIGateway();

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create system prompt for AI Agent
 */
export function createAgentSystemPrompt(options: {
  agentName: string;
  agentType: string;
  systemPrompt: string;
  knowledgeContext?: string;
  tone?: "formal" | "friendly" | "professional";
  language?: "ar" | "en";
}): string {
  const {
    agentName,
    agentType,
    systemPrompt,
    knowledgeContext,
    tone = "professional",
    language = "ar",
  } = options;

  const toneInstructions = {
    formal:
      language === "ar"
        ? "تحدث بأسلوب رسمي ومهذب"
        : "Use a formal and polite tone",
    friendly:
      language === "ar"
        ? "تحدث بأسلوب ودي ودافئ"
        : "Use a friendly and warm tone",
    professional:
      language === "ar"
        ? "تحدث بأسلوب مهني واحترافي"
        : "Use a professional and respectful tone",
  };

  const knowledgeInstruction = knowledgeContext
    ? language === "ar"
      ? `\n\nاستخدم المعلومات التالية من قاعدة المعرفة للإجابة:\n${knowledgeContext}`
      : `\n\nUse the following knowledge base information to answer:\n${knowledgeContext}`
    : "";

  return `${systemPrompt}

${toneInstructions[tone]}.${knowledgeInstruction}

${
  language === "ar"
    ? "إذا لم تكن متأكداً من الإجابة، اعتذر بلباقة واقترح التواصل مع الدعم البشري."
    : "If you are not sure about the answer, apologize politely and suggest contacting human support."
}`;
}

/**
 * Format messages for AI
 */
export function formatMessagesForAI(
  messages: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>,
): CoreMessage[] {
  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}

/**
 * Estimate tokens in text (rough estimate)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters in English, ≈ 1.5 characters in Arabic
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const otherChars = text.length - arabicChars;

  return Math.round(arabicChars / 1.5 + otherChars / 4);
}

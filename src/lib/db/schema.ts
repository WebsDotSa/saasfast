// ═══════════════════════════════════════════════════════════════════════════════
// Drizzle ORM Schema — AI Agent Module Tables
// ═══════════════════════════════════════════════════════════════════════════════

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  date,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';

// drizzle-orm@0.29.x لا يدعم vector مباشرة — نستخدم customType
const vector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return config ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown) {
    if (typeof value === 'string') {
      return value.slice(1, -1).split(',').map(Number);
    }
    return value as number[];
  },
});
import { relations } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// AI Agents Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiAgents = pgTable('ai_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  agentType: varchar('agent_type', { length: 50 }).notNull().default('support'),
  modelProvider: varchar('model_provider', { length: 50 }).default('anthropic'),
  modelName: varchar('model_name', { length: 100 }).default('claude-sonnet-4-5'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).default('0.7'),
  maxTokens: integer('max_tokens').default(1000),
  systemPrompt: text('system_prompt').notNull().default('أنت مساعد ذكي ومفيد.'),
  channels: varchar('channels', { length: 200 }).array().default([]),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  avatarUrl: text('avatar_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#6c63ff'),
  welcomeMessage: text('welcome_message').default('مرحباً! كيف يمكنني مساعدتك اليوم؟'),
  settings: jsonb('settings').default({}),
  totalConversations: integer('total_conversations').default(0),
  totalMessages: integer('total_messages').default(0),
  avgResponseTimeMs: integer('avg_response_time_ms').default(0),
  satisfactionRate: numeric('satisfaction_rate', { precision: 3, scale: 2 }).default('0'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ───────────────────────────────────────────────────────────────────────────────
// AI Conversations Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  agentId: uuid('agent_id'),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  conversationId: varchar('conversation_id', { length: 100 }),
  channel: varchar('channel', { length: 50 }).default('website'),
  customerId: varchar('customer_id', { length: 200 }),
  customerName: varchar('customer_name', { length: 200 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  status: varchar('status', { length: 30 }).default('active'),
  context: jsonb('context').default({}),
  rating: integer('rating'),
  feedback: text('feedback'),
  escalatedTo: uuid('escalated_to'),
  escalatedAt: timestamp('escalated_at'),
  escalationReason: text('escalation_reason'),
  messageCount: integer('message_count').default(0),
  totalTokens: integer('total_tokens').default(0),
  totalCost: numeric('total_cost', { precision: 10, scale: 6 }).default('0'),
  avgResponseTimeMs: integer('avg_response_time_ms').default(0),
  startedAt: timestamp('started_at').defaultNow(),
  lastMessageAt: timestamp('last_message_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ───────────────────────────────────────────────────────────────────────────────
// AI Messages Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  messageType: varchar('message_type', { length: 30 }).notNull(),
  role: varchar('role', { length: 30 }).notNull(),
  content: text('content').notNull(),
  contentJson: jsonb('content_json'),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  modelUsed: varchar('model_used', { length: 100 }),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).default('0'),
  latencyMs: integer('latency_ms').default(0),
  ragContext: uuid('rag_context').array().default([]),
  isVisible: boolean('is_visible').default(true),
  isEdited: boolean('is_edited').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ───────────────────────────────────────────────────────────────────────────────
// AI Knowledge Base Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiKnowledgeBase = pgTable('ai_knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  knowledgeType: varchar('knowledge_type', { length: 50 }).default('document'),
  sourceUrl: text('source_url'),
  sourceFileName: varchar('source_file_name', { length: 255 }),
  sourceFileSize: integer('source_file_size'),
  content: text('content').notNull(),
  contentHash: varchar('content_hash', { length: 64 }),
  embedding: vector('embedding', { dimensions: 1536 }),
  category: varchar('category', { length: 100 }),
  tags: varchar('tags', { length: 200 }).array().default([]),
  language: varchar('language', { length: 10 }).default('ar'),
  isActive: boolean('is_active').default(true),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'),
  usageCount: integer('usage_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ───────────────────────────────────────────────────────────────────────────────
// AI Analytics Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiAnalytics = pgTable('ai_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  agentId: uuid('agent_id'),
  periodDate: date('period_date').notNull(),
  periodType: varchar('period_type', { length: 20 }).notNull(),
  totalConversations: integer('total_conversations').default(0),
  totalMessages: integer('total_messages').default(0),
  totalUsers: integer('total_users').default(0),
  avgResponseTimeMs: integer('avg_response_time_ms').default(0),
  avgTokensPerMessage: integer('avg_tokens_per_message').default(0),
  totalTokens: integer('total_tokens').default(0),
  totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 6 }).default('0'),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).default('0'),
  totalRatings: integer('total_ratings').default(0),
  resolutionRate: numeric('resolution_rate', { precision: 5, scale: 4 }).default('0'),
  escalationRate: numeric('escalation_rate', { precision: 5, scale: 4 }).default('0'),
  channelBreakdown: jsonb('channel_breakdown').default({}),
  topQuestions: jsonb('top_questions').default([]),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueIdx: uniqueIndex('ai_analytics_unique').on(
    table.tenantId,
    table.agentId,
    table.periodDate,
    table.periodType
  ),
}));

// ───────────────────────────────────────────────────────────────────────────────
// AI Channel Configs Table
// ───────────────────────────────────────────────────────────────────────────────

export const aiChannelConfigs = pgTable('ai_channel_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  agentId: uuid('agent_id'),
  channel: varchar('channel', { length: 50 }).notNull(),
  config: jsonb('config').notNull().default({}),
  isActive: boolean('is_active').default(true),
  webhookUrl: text('webhook_url'),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ───────────────────────────────────────────────────────────────────────────────
// Table Relations
// ───────────────────────────────────────────────────────────────────────────────

export const aiAgentsRelations = relations(aiAgents, ({ many }) => ({
  conversations: many(aiConversations),
  messages: many(aiMessages),
  channelConfigs: many(aiChannelConfigs),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  agent: one(aiAgents, {
    fields: [aiConversations.agentId],
    references: [aiAgents.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const aiKnowledgeBaseRelations = relations(aiKnowledgeBase, ({}) => ({}));

export const aiAnalyticsRelations = relations(aiAnalytics, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [aiAnalytics.agentId],
    references: [aiAgents.id],
  }),
}));

export const aiChannelConfigsRelations = relations(aiChannelConfigs, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [aiChannelConfigs.agentId],
    references: [aiAgents.id],
  }),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Export Types
// ───────────────────────────────────────────────────────────────────────────────

export type AIAgent = typeof aiAgents.$inferSelect;
export type NewAIAgent = typeof aiAgents.$inferInsert;

export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;

export type AIMessage = typeof aiMessages.$inferSelect;
export type NewAIMessage = typeof aiMessages.$inferInsert;

export type AIKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type NewAIKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;

export type AIAnalytics = typeof aiAnalytics.$inferSelect;
export type NewAIAnalytics = typeof aiAnalytics.$inferInsert;

export type AIChannelConfig = typeof aiChannelConfigs.$inferSelect;
export type NewAIChannelConfig = typeof aiChannelConfigs.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Payments Module Tables (Migrations 040-043)
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// Store Transactions Table (040)
// ───────────────────────────────────────────────────────────────────────────────

export const storeTransactions = pgTable('store_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // External Identifiers
  myfatoorahInvoiceId: varchar('myfatoorah_invoice_id', { length: 100 }),
  myfatoorahPaymentId: varchar('myfatoorah_payment_id', { length: 100 }),
  storeOrderId: uuid('store_order_id'),
  paymentLinkId: uuid('payment_link_id'),
  externalReference: varchar('external_reference', { length: 200 }),

  // Amounts
  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SAR'),

  // Fees
  gatewayFeeRate: numeric('gateway_fee_rate', { precision: 5, scale: 4 }).default('0.015'),
  gatewayFeeAmount: numeric('gateway_fee_amount', { precision: 12, scale: 2 }),
  platformFeeRate: numeric('platform_fee_rate', { precision: 5, scale: 4 }).default('0.01'),
  platformFeeAmount: numeric('platform_fee_amount', { precision: 12, scale: 2 }),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }),

  // Payment Method
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentNetwork: varchar('payment_network', { length: 50 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  cardBrand: varchar('card_brand', { length: 20 }),

  // Customer Info
  customerName: varchar('customer_name', { length: 200 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),

  // Status
  status: varchar('status', { length: 30 }).notNull().default('pending'),

  // Refund
  refundedAmount: numeric('refunded_amount', { precision: 12, scale: 2 }).default('0'),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),

  // Settlement
  settlementId: uuid('settlement_id'),
  settledAt: timestamp('settled_at'),

  // Raw Data
  rawPayload: jsonb('raw_payload'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_store_tx_tenant').on(table.tenantId, table.createdAt),
  statusIdx: index('idx_store_tx_status').on(table.status),
  settlementIdx: index('idx_store_tx_settlement').on(table.settlementId),
  paymentLinkIdx: index('idx_store_tx_payment_link').on(table.paymentLinkId),
  mfInvoiceIdx: uniqueIndex('idx_store_tx_mf_invoice').on(table.myfatoorahInvoiceId),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Merchant Balances Table (041)
// ───────────────────────────────────────────────────────────────────────────────

export const merchantBalances = pgTable('merchant_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),

  // Balances
  availableBalance: numeric('available_balance', { precision: 12, scale: 2 }).default('0'),
  pendingBalance: numeric('pending_balance', { precision: 12, scale: 2 }).default('0'),
  reservedBalance: numeric('reserved_balance', { precision: 12, scale: 2 }).default('0'),
  totalEarned: numeric('total_earned', { precision: 12, scale: 2 }).default('0'),
  totalWithdrawn: numeric('total_withdrawn', { precision: 12, scale: 2 }).default('0'),

  // Statistics
  totalTransactions: integer('total_transactions').default(0),
  successfulTransactions: integer('successful_transactions').default(0),
  failedTransactions: integer('failed_transactions').default(0),
  refundedTransactions: integer('refunded_transactions').default(0),
  totalRefunded: numeric('total_refunded', { precision: 12, scale: 2 }).default('0'),

  // Info
  currency: varchar('currency', { length: 3 }).default('SAR'),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_merchant_balances_tenant').on(table.tenantId),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Payment Links Table (042)
// ───────────────────────────────────────────────────────────────────────────────

export const paymentLinks = pgTable('payment_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Link Number
  linkNumber: varchar('link_number', { length: 50 }).notNull().unique(),

  // Info
  title: varchar('title', { length: 200 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SAR'),
  description: text('description'),

  // Customer Info
  customerName: varchar('customer_name', { length: 200 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerEmail: varchar('customer_email', { length: 255 }),

  // MyFatoorah
  myfatoorahUrl: text('myfatoorah_url'),
  shortUrl: varchar('short_url', { length: 100 }),
  myfatoorahInvoiceId: varchar('myfatoorah_invoice_id', { length: 100 }),

  // Status
  status: varchar('status', { length: 20 }).default('active'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),

  // Transaction Link
  transactionId: uuid('transaction_id'),

  // Expiry
  expiresAt: timestamp('expires_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_payment_links_tenant').on(table.tenantId, table.createdAt),
  statusIdx: index('idx_payment_links_status').on(table.status),
  paymentStatusIdx: index('idx_payment_links_payment_status').on(table.paymentStatus),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Merchant Bank Accounts Table (042)
// ───────────────────────────────────────────────────────────────────────────────

export const merchantBankAccounts = pgTable('merchant_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Bank Info
  bankName: varchar('bank_name', { length: 100 }).notNull(),
  accountHolder: varchar('account_holder', { length: 200 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  iban: varchar('iban', { length: 34 }).notNull(),
  swiftCode: varchar('swift_code', { length: 20 }),

  // Status
  isPrimary: boolean('is_primary').default(false),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_merchant_bank_accounts_tenant').on(table.tenantId),
  primaryIdx: index('idx_merchant_bank_accounts_primary').on(table.tenantId, table.isPrimary),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Settlements Table (043)
// ───────────────────────────────────────────────────────────────────────────────

export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // Settlement Number
  settlementNumber: varchar('settlement_number', { length: 50 }).notNull().unique(),

  // Bank Account
  bankAccountId: uuid('bank_account_id'),

  // Amounts
  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
  gatewayFees: numeric('gateway_fees', { precision: 12, scale: 2 }).notNull(),
  platformFees: numeric('platform_fees', { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SAR'),
  transactionCount: integer('transaction_count'),

  // Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Status
  status: varchar('status', { length: 30 }).default('pending'),

  // Bank Transfer
  bankReference: varchar('bank_reference', { length: 100 }),
  transferredAt: timestamp('transferred_at'),
  transferNote: text('transfer_note'),

  // Approval
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  // Notes
  notes: text('notes'),
  adminNotes: text('admin_notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_settlements_tenant').on(table.tenantId, table.createdAt),
  statusIdx: index('idx_settlements_status').on(table.status),
  numberIdx: uniqueIndex('idx_settlements_number').on(table.settlementNumber),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Payment Relations
// ───────────────────────────────────────────────────────────────────────────────

export const storeTransactionsRelations = relations(storeTransactions, ({ one }) => ({
  tenant: one(merchantBalances, {
    fields: [storeTransactions.tenantId],
    references: [merchantBalances.tenantId],
  }),
}));

export const merchantBalancesRelations = relations(merchantBalances, ({ one }) => ({
  tenant: one(merchantBalances, {
    fields: [merchantBalances.tenantId],
    references: [merchantBalances.tenantId],
  }),
}));

export const paymentLinksRelations = relations(paymentLinks, ({ one }) => ({
  tenant: one(merchantBalances, {
    fields: [paymentLinks.tenantId],
    references: [merchantBalances.tenantId],
  }),
}));

export const merchantBankAccountsRelations = relations(merchantBankAccounts, ({ one }) => ({
  tenant: one(merchantBalances, {
    fields: [merchantBankAccounts.tenantId],
    references: [merchantBalances.tenantId],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  tenant: one(merchantBalances, {
    fields: [settlements.tenantId],
    references: [merchantBalances.tenantId],
  }),
  bankAccount: one(merchantBankAccounts, {
    fields: [settlements.bankAccountId],
    references: [merchantBankAccounts.id],
  }),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Payment Types
// ───────────────────────────────────────────────────────────────────────────────

export type StoreTransaction = typeof storeTransactions.$inferSelect;
export type NewStoreTransaction = typeof storeTransactions.$inferInsert;

export type MerchantBalance = typeof merchantBalances.$inferSelect;
export type NewMerchantBalance = typeof merchantBalances.$inferInsert;

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type NewPaymentLink = typeof paymentLinks.$inferInsert;

export type MerchantBankAccount = typeof merchantBankAccounts.$inferSelect;
export type NewMerchantBankAccount = typeof merchantBankAccounts.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module Tables (Migrations 030-033)
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// Discounts Tables (030)
// ───────────────────────────────────────────────────────────────────────────────

export const discounts = pgTable('discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  discountType: varchar('discount_type', { length: 30 }).notNull().default('percentage'),
  applyingMethod: varchar('applying_method', { length: 20 }).notNull().default('automatic'),

  nameAr: varchar('name_ar', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  code: varchar('code', { length: 50 }),
  value: numeric('value', { precision: 10, scale: 2 }).notNull().default('0'),

  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  usesPerCustomer: integer('uses_per_customer'),

  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),

  appliesTo: varchar('applies_to', { length: 20 }).notNull().default('all'),
  productIds: uuid('product_ids').array().default([]),
  categoryIds: uuid('category_ids').array().default([]),
  customerIds: uuid('customer_ids').array().default([]),
  regionIds: uuid('region_ids').array().default([]),
  collectionIds: uuid('collection_ids').array().default([]),

  paymentMethod: varchar('payment_method', { length: 50 }),

  startsAt: timestamp('starts_at').notNull().defaultNow(),
  endsAt: timestamp('ends_at'),
  isActive: boolean('is_active').notNull().default(true),

  priority: integer('priority').notNull().default(0),
  isCombinable: boolean('is_combinable').notNull().default(false),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const discountUsageLogs = pgTable('discount_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  discountId: uuid('discount_id').notNull().references(() => discounts.id, { onDelete: 'cascade' }),

  orderId: uuid('order_id'),
  orderAmount: numeric('order_amount', { precision: 10, scale: 2 }).notNull(),

  customerId: uuid('customer_id'),
  customerEmail: varchar('customer_email', { length: 255 }),

  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),

  status: varchar('status', { length: 20 }).notNull().default('applied'),

  usedAt: timestamp('used_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default({}),
});

export const customerDiscountUsage = pgTable('customer_discount_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  discountId: uuid('discount_id').notNull().references(() => discounts.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull(),

  usageCount: integer('usage_count').notNull().default(0),
  lastUsedAt: timestamp('last_used_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────────────────────
// Marketing Campaigns Tables (031)
// ───────────────────────────────────────────────────────────────────────────────

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),

  channel: varchar('channel', { length: 20 }).notNull(),
  goal: varchar('goal', { length: 50 }),

  status: varchar('status', { length: 20 }).notNull().default('draft'),

  audienceFilter: jsonb('audience_filter').default({}),

  messageAr: text('message_ar').notNull(),
  messageEn: text('message_en'),
  subjectLine: varchar('subject_line', { length: 200 }),
  senderName: varchar('sender_name', { length: 100 }),

  templateId: varchar('template_id', { length: 100 }),
  templateVars: jsonb('template_vars').default({}),

  scheduledAt: timestamp('scheduled_at'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Riyadh'),

  totalRecipients: integer('total_recipients').default(0),
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  openedCount: integer('opened_count').default(0),
  clickedCount: integer('clicked_count').default(0),
  convertedCount: integer('converted_count').default(0),
  bouncedCount: integer('bounced_count').default(0),
  unsubscribedCount: integer('unsubscribed_count').default(0),

  revenueGenerated: numeric('revenue_generated', { precision: 12, scale: 2 }).default('0'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).default('0'),
  costPerMessage: numeric('cost_per_message', { precision: 10, scale: 4 }).default('0'),

  isAbTest: boolean('is_ab_test').default(false),
  abTestVariant: varchar('ab_test_variant', { length: 10 }),
  abTestWinner: varchar('ab_test_winner', { length: 10 }),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const campaignRecipients = pgTable('campaign_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  campaignId: uuid('campaign_id').notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),

  customerId: uuid('customer_id'),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerName: varchar('customer_name', { length: 200 }),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  messageId: varchar('message_id', { length: 255 }),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  convertedAt: timestamp('converted_at'),

  orderId: uuid('order_id'),
  revenue: numeric('revenue', { precision: 10, scale: 2 }).default('0'),

  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const campaignClicks = pgTable('campaign_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  campaignId: uuid('campaign_id').notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').references(() => campaignRecipients.id, { onDelete: 'cascade' }),

  url: text('url').notNull(),
  urlAlias: varchar('url_alias', { length: 100 }),

  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),

  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),

  clickedAt: timestamp('clicked_at').notNull().defaultNow(),

  metadata: jsonb('metadata').default({}),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),

  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),

  templateType: varchar('template_type', { length: 50 }).notNull(),

  subject: varchar('subject', { length: 500 }).notNull(),
  previewText: varchar('preview_text', { length: 200 }),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),

  variables: jsonb('variables').default([]),

  category: varchar('category', { length: 100 }),
  tags: varchar('tags', { length: 100 }).array(),

  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(false),

  usageCount: integer('usage_count').default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const smsTemplates = pgTable('sms_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),

  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),

  content: text('content').notNull(),
  maxLength: integer('max_length').default(160),

  variables: jsonb('variables').default([]),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────────────────────
// Loyalty Program Tables (032)
// ───────────────────────────────────────────────────────────────────────────────

export const loyaltyPrograms = pgTable('loyalty_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  nameAr: varchar('name_ar', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),

  pointsPerSar: numeric('points_per_sar', { precision: 10, scale: 4 }).notNull().default('1.0'),
  sarPerPoint: numeric('sar_per_point', { precision: 10, scale: 4 }).notNull().default('0.05'),

  minPointsToRedeem: integer('min_points_to_redeem').notNull().default(100),
  pointsExpiryMonths: integer('points_expiry_months'),

  tiersEnabled: boolean('tiers_enabled').notNull().default(true),
  tiersConfig: jsonb('tiers_config').default([]),

  rewardsEnabled: boolean('rewards_enabled').notNull().default(true),
  rewardsConfig: jsonb('rewards_config').default([]),

  isActive: boolean('is_active').notNull().default(true),

  totalMembers: integer('total_members').default(0),
  totalPointsIssued: integer('total_points_issued').default(0),
  totalPointsRedeemed: integer('total_points_redeemed').default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const loyaltyAccounts = pgTable('loyalty_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').notNull(),

  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 200 }),
  customerPhone: varchar('customer_phone', { length: 20 }),

  currentBalance: integer('current_balance').notNull().default(0),
  lifetimeEarned: integer('lifetime_earned').notNull().default(0),
  lifetimeRedeemed: integer('lifetime_redeemed').notNull().default(0),
  lifetimeExpired: integer('lifetime_expired').notNull().default(0),

  currentTier: varchar('current_tier', { length: 50 }).notNull().default('bronze'),
  tierUpdatedAt: timestamp('tier_updated_at'),

  nextTier: varchar('next_tier', { length: 50 }),
  pointsToNextTier: integer('points_to_next_tier'),

  pointsExpiringAt: timestamp('points_expiring_at'),
  pointsExpiringAmount: integer('points_expiring_amount').default(0),

  status: varchar('status', { length: 20 }).notNull().default('active'),

  notifyOnEarn: boolean('notify_on_earn').default(true),
  notifyOnRedeem: boolean('notify_on_redeem').default(true),
  notifyOnTier: boolean('notify_on_tier').default(true),
  notifyOnExpiry: boolean('notify_on_expiry').default(true),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  accountId: uuid('account_id').notNull().references(() => loyaltyAccounts.id, { onDelete: 'cascade' }),

  type: varchar('type', { length: 20 }).notNull(),

  points: integer('points').notNull(),
  balanceAfter: integer('balance_after').notNull(),

  monetaryValue: numeric('monetary_value', { precision: 10, scale: 2 }),

  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  orderAmount: numeric('order_amount', { precision: 10, scale: 2 }),

  description: text('description'),
  notes: text('notes'),

  expiresAt: timestamp('expires_at'),

  status: varchar('status', { length: 20 }).notNull().default('completed'),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const loyaltyRewards = pgTable('loyalty_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  nameAr: varchar('name_ar', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),

  rewardType: varchar('reward_type', { length: 30 }).notNull(),

  pointsCost: integer('points_cost').notNull(),

  discountType: varchar('discount_type', { length: 20 }),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }),

  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
  applicableProducts: uuid('applicable_products').array(),
  applicableCategories: uuid('applicable_categories').array(),

  validityDays: integer('validity_days').default(30),

  totalQuantity: integer('total_quantity'),
  redeemedCount: integer('redeemed_count').default(0),
  perCustomerLimit: integer('per_customer_limit').default(1),

  isActive: boolean('is_active').notNull().default(true),

  sortOrder: integer('sort_order').default(0),
  imageUrl: text('image_url'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const loyaltyRedemptions = pgTable('loyalty_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  accountId: uuid('account_id').notNull().references(() => loyaltyAccounts.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id').notNull().references(() => loyaltyRewards.id, { onDelete: 'cascade' }),

  customerId: uuid('customer_id').notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),

  pointsUsed: integer('points_used').notNull(),

  rewardCode: varchar('reward_code', { length: 100 }).unique(),
  discountCode: varchar('discount_code', { length: 50 }),

  status: varchar('status', { length: 20 }).notNull().default('active'),

  usedAt: timestamp('used_at'),
  usedOrderId: uuid('used_order_id'),

  expiresAt: timestamp('expires_at').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const loyaltyTierHistory = pgTable('loyalty_tier_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  accountId: uuid('account_id').notNull().references(() => loyaltyAccounts.id, { onDelete: 'cascade' }),

  fromTier: varchar('from_tier', { length: 50 }),
  toTier: varchar('to_tier', { length: 50 }).notNull(),

  reason: varchar('reason', { length: 50 }),
  reasonDetails: text('reason_details'),

  pointsAtChange: integer('points_at_change'),
  lifetimeSpentAtChange: numeric('lifetime_spent_at_change', { precision: 12, scale: 2 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────────────────────
// Affiliate Marketing Tables (033)
// ───────────────────────────────────────────────────────────────────────────────

export const affiliates = pgTable('affiliates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  userId: uuid('user_id'),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),

  companyName: varchar('company_name', { length: 200 }),
  taxNumber: varchar('tax_number', { length: 50 }),
  country: varchar('country', { length: 100 }).default('SA'),

  referralCode: varchar('referral_code', { length: 50 }).notNull(),
  referralLink: text('referral_link'),

  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull().default('10.00'),
  commissionType: varchar('commission_type', { length: 20 }).notNull().default('percentage'),
  commissionValue: numeric('commission_value', { precision: 10, scale: 2 }),
  tieredCommission: jsonb('tiered_commission').default([]),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  totalClicks: integer('total_clicks').notNull().default(0),
  totalConversions: integer('total_conversions').notNull().default(0),
  totalSales: numeric('total_sales', { precision: 12, scale: 2 }).notNull().default('0'),
  totalEarned: numeric('total_earned', { precision: 12, scale: 2 }).notNull().default('0'),
  totalPaid: numeric('total_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  pendingPayout: numeric('pending_payout', { precision: 12, scale: 2 }).notNull().default('0'),

  payoutMethod: varchar('payout_method', { length: 50 }),
  payoutDetails: jsonb('payout_details').default({}),

  minPayoutAmount: numeric('min_payout_amount', { precision: 10, scale: 2 }).default('100.00'),

  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),

  metadata: jsonb('metadata').default({}),

  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  lastPayoutAt: timestamp('last_payout_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const affiliateClicks = pgTable('affiliate_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),

  visitorId: varchar('visitor_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),

  deviceType: varchar('device_type', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),

  country: varchar('country', { length: 100 }),
  region: varchar('region', { length: 100 }),
  city: varchar('city', { length: 100 }),

  landingUrl: text('landing_url'),
  referringUrl: text('referring_url'),

  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 200 }),
  utmContent: varchar('utm_content', { length: 200 }),
  utmTerm: varchar('utm_term', { length: 200 }),

  converted: boolean('converted').notNull().default(false),
  conversionId: uuid('conversion_id'),

  createdAt: timestamp('created_at').notNull().defaultNow(),

  metadata: jsonb('metadata').default({}),
});

export const affiliateConversions = pgTable('affiliate_conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),

  orderId: uuid('order_id').notNull(),
  orderAmount: numeric('order_amount', { precision: 10, scale: 2 }).notNull(),

  customerId: uuid('customer_id'),
  customerEmail: varchar('customer_email', { length: 255 }),

  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  clickedAt: timestamp('clicked_at'),
  convertedAt: timestamp('converted_at').notNull().defaultNow(),

  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),

  paidAt: timestamp('paid_at'),
  paymentReference: varchar('payment_reference', { length: 100 }),

  rejectedAt: timestamp('rejected_at'),
  rejectedBy: uuid('rejected_by'),
  rejectionReason: text('rejection_reason'),

  refundedAt: timestamp('refunded_at'),

  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const affiliatePayouts = pgTable('affiliate_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id, { onDelete: 'cascade' }),

  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('SAR'),

  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  conversionsCount: integer('conversions_count').notNull().default(0),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  payoutMethod: varchar('payout_method', { length: 50 }).notNull(),

  paymentReference: varchar('payment_reference', { length: 100 }),
  paymentProof: text('payment_proof'),

  bankDetails: jsonb('bank_details'),

  notes: text('notes'),
  adminNotes: text('admin_notes'),

  requestedAt: timestamp('requested_at').defaultNow(),
  processedAt: timestamp('processed_at'),
  processedBy: uuid('processed_by'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const affiliateBanners = pgTable('affiliate_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),

  bannerType: varchar('banner_type', { length: 50 }),

  imageUrl: text('image_url'),
  textContent: text('text_content'),
  linkUrl: text('link_url'),

  width: integer('width'),
  height: integer('height'),

  isActive: boolean('is_active').notNull().default(true),

  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────────────────────
// Marketing Table Relations
// ───────────────────────────────────────────────────────────────────────────────

export const discountsRelations = relations(discounts, ({ many }) => ({
  usageLogs: many(discountUsageLogs),
  customerUsage: many(customerDiscountUsage),
}));

export const discountUsageLogsRelations = relations(discountUsageLogs, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountUsageLogs.discountId],
    references: [discounts.id],
  }),
}));

export const customerDiscountUsageRelations = relations(customerDiscountUsage, ({ one }) => ({
  discount: one(discounts, {
    fields: [customerDiscountUsage.discountId],
    references: [discounts.id],
  }),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ many }) => ({
  recipients: many(campaignRecipients),
  clicks: many(campaignClicks),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignRecipients.campaignId],
    references: [marketingCampaigns.id],
  }),
}));

export const campaignClicksRelations = relations(campaignClicks, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignClicks.campaignId],
    references: [marketingCampaigns.id],
  }),
  recipient: one(campaignRecipients, {
    fields: [campaignClicks.recipientId],
    references: [campaignRecipients.id],
  }),
}));

export const loyaltyProgramsRelations = relations(loyaltyPrograms, ({}) => ({}));

export const loyaltyAccountsRelations = relations(loyaltyAccounts, ({ many, one }) => ({
  transactions: many(loyaltyTransactions),
  redemptions: many(loyaltyRedemptions),
  tierHistory: many(loyaltyTierHistory),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  account: one(loyaltyAccounts, {
    fields: [loyaltyTransactions.accountId],
    references: [loyaltyAccounts.id],
  }),
}));

export const loyaltyRedemptionsRelations = relations(loyaltyRedemptions, ({ one }) => ({
  account: one(loyaltyAccounts, {
    fields: [loyaltyRedemptions.accountId],
    references: [loyaltyAccounts.id],
  }),
  reward: one(loyaltyRewards, {
    fields: [loyaltyRedemptions.rewardId],
    references: [loyaltyRewards.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ many }) => ({
  clicks: many(affiliateClicks),
  conversions: many(affiliateConversions),
  payouts: many(affiliatePayouts),
}));

export const affiliateClicksRelations = relations(affiliateClicks, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [affiliateClicks.affiliateId],
    references: [affiliates.id],
  }),
}));

export const affiliateConversionsRelations = relations(affiliateConversions, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [affiliateConversions.affiliateId],
    references: [affiliates.id],
  }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayouts, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [affiliatePayouts.affiliateId],
    references: [affiliates.id],
  }),
}));

// ───────────────────────────────────────────────────────────────────────────────
// Marketing Types
// ───────────────────────────────────────────────────────────────────────────────

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type DiscountUsageLog = typeof discountUsageLogs.$inferSelect;
export type NewDiscountUsageLog = typeof discountUsageLogs.$inferInsert;

export type CustomerDiscountUsage = typeof customerDiscountUsage.$inferSelect;
export type NewCustomerDiscountUsage = typeof customerDiscountUsage.$inferInsert;

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type NewMarketingCampaign = typeof marketingCampaigns.$inferInsert;

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type NewCampaignRecipient = typeof campaignRecipients.$inferInsert;

export type CampaignClick = typeof campaignClicks.$inferSelect;
export type NewCampaignClick = typeof campaignClicks.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type NewSmsTemplate = typeof smsTemplates.$inferInsert;

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type NewLoyaltyProgram = typeof loyaltyPrograms.$inferInsert;

export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type NewLoyaltyAccount = typeof loyaltyAccounts.$inferInsert;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type NewLoyaltyReward = typeof loyaltyRewards.$inferInsert;

export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type NewLoyaltyRedemption = typeof loyaltyRedemptions.$inferInsert;

export type LoyaltyTierHistory = typeof loyaltyTierHistory.$inferSelect;
export type NewLoyaltyTierHistory = typeof loyaltyTierHistory.$inferInsert;

export type Affiliate = typeof affiliates.$inferSelect;
export type NewAffiliate = typeof affiliates.$inferInsert;

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type NewAffiliateClick = typeof affiliateClicks.$inferInsert;

export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type NewAffiliateConversion = typeof affiliateConversions.$inferInsert;

export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type NewAffiliatePayout = typeof affiliatePayouts.$inferInsert;

export type AffiliateBanner = typeof affiliateBanners.$inferSelect;
export type NewAffiliateBanner = typeof affiliateBanners.$inferInsert;

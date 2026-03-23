import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Audit Logging System
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لتسجيل جميع العمليات الحساسة في النظام للتدقيق الأمني
//
// الاستخدام:
// import { logAudit, getAuditLogs } from '@/lib/audit';
//
// await logAudit({
//   action: 'user.login',
//   resource_type: 'user',
//   metadata: { ip: '192.168.1.1' }
// });
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuditLogData {
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
}

/**
 * تسجيل عملية في audit logs
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    
    // الحصول على tenant_id من session
    let tenantId: string | null = null;
    if (session?.user) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', session.user.id)
        .single();
      
      tenantId = tenantUser?.tenant_id || null;
    }

    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: session?.user?.id || null,
      action: data.action,
      resource_type: data.resource_type || null,
      resource_id: data.resource_id || null,
      old_value: data.old_value || null,
      new_value: data.new_value || null,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Audit Log] Error:', error);
    // لا نرمي الخطأ - logging لا يجب أن يكسر التطبيق
  }
}

/**
 * الحصول على audit logs لـ tenant معين
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users (
          email,
          user_metadata
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.resource_type) {
      query = query.eq('resource_type', options.resource_type);
    }

    if (options?.date_from) {
      query = query.gte('created_at', options.date_from);
    }

    if (options?.date_to) {
      query = query.lte('created_at', options.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('[Get Audit Logs] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * أفعال شائعة للتسجيل
 */
export const AuditActions = {
  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  PASSWORD_RESET: 'user.password_reset',
  
  // Tenant
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',
  
  // Subscription
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_UPDATE: 'subscription.update',
  SUBSCRIPTION_CANCEL: 'subscription.cancel',
  SUBSCRIPTION_RENEW: 'subscription.renew',
  
  // Payment
  PAYMENT_INITIATE: 'payment.initiate',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUND: 'payment.refund',
  
  // User Management
  USER_INVITE: 'user.invite',
  USER_REMOVE: 'user.remove',
  ROLE_CHANGE: 'user.role_change',
  
  // Data
  DATA_EXPORT: 'data.export',
  DATA_DELETE: 'data.delete',
  
  // Security
  LOGIN_FAILED: 'security.login_failed',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit',
  UNAUTHORIZED_ACCESS: 'security.unauthorized',
} as const;

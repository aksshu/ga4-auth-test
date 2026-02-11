
import { supabase } from '../supabaseClient';
import { ProjectContext, KPIDictionary, KPIThreshold, KPIFact, CSVUploadLog, JiraConnection, ReleaseReport, JiraCustomFieldMapping, GA4Settings, GA4SyncHistory } from '../types';

/**
 * Executes a Supabase query with a safety timeout and retry logic.
 */
async function safeQuery<T>(
  promiseFn: () => Promise<{data: T | null, error: any}>, 
  defaultVal: T, 
  context: string,
  retries: number = 2,
  timeoutMs: number = 12000 
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const timeoutPromise = new Promise<{data: null, error: any}>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${context} exceeded ${timeoutMs/1000}s limit.`)), timeoutMs);
      });

      const { data, error } = await Promise.race([promiseFn(), timeoutPromise]);
      clearTimeout(timeoutId);
      
      if (error) {
        console.warn(`[DB-Service] [${new Date().toISOString()}] Attempt ${attempt}/${retries} failed for ${context}:`, error.message);
        if (attempt === retries) return defaultVal;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }
      
      return data ?? defaultVal;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.message?.includes('Timeout');
      console.error(`[DB-Service] [${new Date().toISOString()}] Attempt ${attempt}/${retries} ${isTimeout ? 'timed out' : 'error'} in ${context}:`, err.message || err);
      
      if (attempt === retries) return defaultVal;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return defaultVal;
}

export const databaseService = {
  // WORKSPACES
  async getWorkspaces(): Promise<ProjectContext[]> {
    const cachedRaw = localStorage.getItem('productpulse_workspaces_cache');
    const cachedData = cachedRaw ? JSON.parse(cachedRaw) : [];

    const fetchWorkspaces = async () => {
      const data = await safeQuery(
        () => supabase.from('workspaces').select('*').order('created_at', { ascending: false }),
        null, 
        'Get Workspaces',
        3, 
        15000 
      );

      if (data) {
        localStorage.setItem('productpulse_workspaces_cache', JSON.stringify(data));
        return data;
      }
      return cachedData;
    };

    if (cachedData.length > 0) {
      fetchWorkspaces().catch(err => console.warn("[DB-Service] Background refresh issue:", err));
      return cachedData;
    }

    return fetchWorkspaces();
  },

  async createWorkspace(workspace: Omit<ProjectContext, 'id'>): Promise<ProjectContext> {
    const { data: userData } = await supabase.auth.getUser();
    const payload = { ...workspace } as any;
    delete payload.id;
    const { data, error } = await supabase.from('workspaces').insert([{ ...payload, user_id: userData?.user?.id }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateWorkspace(id: string, updates: Partial<ProjectContext>) {
    const payload = { ...updates } as any;
    delete payload.id; 
    const { data, error } = await supabase.from('workspaces').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // GA4 CORE
  async getGA4Settings(): Promise<GA4Settings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return safeQuery(
      () => supabase.from('user_ga4_settings').select('*').eq('user_id', user.id).maybeSingle(),
      null,
      'Get GA4 Settings',
      1,
      8000
    );
  },

  async saveGA4Settings(settings: Omit<GA4Settings, 'id' | 'user_id'>): Promise<GA4Settings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");

    const payload = { ...settings, user_id: user.id };
    const { data, error } = await supabase
      .from('user_ga4_settings')
      .upsert(payload, { onConflict: 'user_id,property_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async logGA4Sync(history: Omit<GA4SyncHistory, 'id' | 'user_id'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('ga4_sync_history').insert([{ ...history, user_id: user.id }]);
  },

  // JIRA CORE
  async getJiraConnection(): Promise<JiraConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return safeQuery(
      () => supabase
        .from('jira_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      null,
      'Get Jira Connection',
      1,
      10000
    );
  },

  async saveJiraConnection(conn: Omit<JiraConnection, 'id' | 'user_id'>): Promise<JiraConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    const payload = { ...conn, user_id: user.id, is_active: true };
    const { data, error } = await supabase
      .from('jira_connections')
      .upsert(payload, { onConflict: 'user_id,jira_base_url,project_key' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // JIRA MAPPINGS
  async saveCustomFieldMapping(mapping: Omit<JiraCustomFieldMapping, 'id'>): Promise<void> {
    await supabase.from('jira_custom_field_mappings').upsert(mapping, { onConflict: 'jira_connection_id,field_name' });
  },

  async getCustomFieldMapping(connectionId: string, fieldName: string): Promise<string | null> {
    const { data } = await supabase
      .from('jira_custom_field_mappings')
      .select('jira_field_id')
      .eq('jira_connection_id', connectionId)
      .eq('field_name', fieldName)
      .maybeSingle();
    return data?.jira_field_id || null;
  },

  // RELEASE REPORTS
  async getReleaseReports(): Promise<ReleaseReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    return safeQuery(
      () => supabase.from('release_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      [],
      'Get Release Reports'
    );
  },

  async saveReleaseReport(report: Omit<ReleaseReport, 'id' | 'user_id'>): Promise<ReleaseReport> {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...report, user_id: user?.id };
    const { data, error } = await supabase.from('release_reports').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // TENANTS & FACTS
  async getAvailableTenants(): Promise<string[]> {
    const data = await safeQuery(() => supabase.from('kpi_daily_facts').select('tenant_id'), [], 'Get Tenants');
    return Array.from(new Set(data.filter(d => d.tenant_id).map(d => d.tenant_id)));
  },

  async getTenantFacts(tenantId: string): Promise<KPIFact[]> {
    return safeQuery(() => supabase.from('kpi_daily_facts').select('*').eq('tenant_id', tenantId).order('kpi_date', { ascending: true }), [], `Get Facts: ${tenantId}`);
  },

  async getFactsForRange(tenantId: string, days: number): Promise<KPIFact[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateStr = startDate.toISOString().split('T')[0];
    return safeQuery(() => supabase.from('kpi_daily_facts').select('*').eq('tenant_id', tenantId).gte('kpi_date', dateStr).order('kpi_date', { ascending: true }), [], `Get Facts Range: ${tenantId}`);
  },

  async bulkIngestFacts(facts: KPIFact[]): Promise<void> {
    const cleanFacts = facts.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from('kpi_daily_facts').upsert(cleanFacts);
    if (error) throw error;
  },

  async getKPIDictionary(keys?: string[]): Promise<KPIDictionary[]> {
    return safeQuery(() => {
      let query = supabase.from('kpi_dictionary').select('*');
      if (keys && keys.length > 0) query = query.in('kpi_key', keys);
      return query;
    }, [], 'Get Dictionary');
  },

  async saveKPIDefinition(definition: KPIDictionary, tenantId: string): Promise<void> {
    const payload = { ...definition } as any;
    delete payload.id;
    await supabase.from('kpi_dictionary').upsert(payload, { onConflict: 'kpi_key' });
  },

  async getTenantThresholds(tenantId: string): Promise<KPIThreshold[]> {
    return safeQuery(() => supabase.from('kpi_thresholds').select('*').eq('tenant_id', tenantId), [], 'Get Thresholds');
  },

  async saveThresholds(thresholds: KPIThreshold[]): Promise<void> {
    const cleanThresholds = thresholds.map((t: any) => {
      const { id, ...rest } = t;
      return rest;
    });
    await supabase.from('kpi_thresholds').upsert(cleanThresholds, { onConflict: 'tenant_id,kpi_key' });
  },

  async logUpload(log: Omit<CSVUploadLog, 'id'>): Promise<void> {
    await supabase.from('csv_upload_log').insert([log]);
  },

  async getCSVTemplateHeaders(): Promise<string[]> {
    const data = await safeQuery(() => supabase.from('csv_template_headers').select('column_name'), [], 'Get Headers');
    if (data.length > 0) return data.map(d => d.column_name);
    return ['tenant_id', 'site_id', 'kpi_date'];
  },
};

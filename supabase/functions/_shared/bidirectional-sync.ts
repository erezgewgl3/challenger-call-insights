// Simplified version of BidirectionalSyncManager for use in edge functions
// This is a subset of the full library for edge function compatibility

export interface SyncOperation {
  id: string;
  user_id: string;
  sync_type: 'crm_to_sw' | 'sw_to_crm' | 'bidirectional';
  operation_type: string;
  source_system: string;
  source_record_id?: string;
  target_system: string;
  target_record_id?: string;
  operation_status: 'pending' | 'completed' | 'failed' | 'conflict';
  sync_data: Record<string, any>;
  conflict_data?: Record<string, any>;
  resolution_strategy?: 'timestamp' | 'user_preference' | 'manual';
  resolved_by?: string;
  resolved_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  completed_at?: string;
}

export class BidirectionalSyncManager {
  private userId: string;
  private supabase: any;

  constructor(userId: string, supabaseClient?: any) {
    this.userId = userId;
    this.supabase = supabaseClient;
  }

  // Initialize with supabase client (for edge functions)
  setSupabaseClient(client: any) {
    this.supabase = client;
  }

  // Create a new sync operation
  async createSyncOperation(operation: Partial<SyncOperation>): Promise<SyncOperation> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase
      .from('sync_operations')
      .insert({
        user_id: this.userId,
        sync_type: operation.sync_type || 'bidirectional',
        operation_type: operation.operation_type!,
        source_system: operation.source_system!,
        source_record_id: operation.source_record_id,
        target_system: operation.target_system!,
        target_record_id: operation.target_record_id,
        sync_data: operation.sync_data || {},
        retry_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return this.dbRowToSyncOperation(data);
  }

  // Execute sync operation
  async executeSyncOperation(operationId: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: operation, error: operationError } = await this.supabase
      .from('sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (operationError) throw operationError;

    const operationTyped = this.dbRowToSyncOperation(operation);

    try {
      await this.updateSyncStatus(operationId, 'pending');
      
      // Log sync start
      await this.logAuditTrail({
        sync_operation_id: operationId,
        action_type: 'sync_started',
        entity_type: operationTyped.operation_type,
        entity_id: operationTyped.source_record_id || 'unknown',
        metadata: { 
          source_system: operationTyped.source_system,
          target_system: operationTyped.target_system 
        }
      });

      // Simple execution - in edge functions we just mark as completed
      // The actual business logic would be handled by the calling function
      
      await this.updateSyncStatus(operationId, 'completed');
      
      // Log completion
      await this.logAuditTrail({
        sync_operation_id: operationId,
        action_type: 'sync_completed',
        entity_type: operationTyped.operation_type,
        entity_id: operationTyped.target_record_id || 'unknown',
        metadata: { sync_duration: Date.now() }
      });

    } catch (error: any) {
      await this.updateSyncStatus(operationId, 'failed', error.message);
      throw error;
    }
  }

  // Update sync operation status
  private async updateSyncStatus(
    operationId: string, 
    status: SyncOperation['operation_status'],
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { 
      operation_status: status,
      ...(status === 'completed' && { completed_at: new Date().toISOString() })
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
      // Get current retry count and increment
      const { data: currentOp } = await this.supabase
        .from('sync_operations')
        .select('retry_count')
        .eq('id', operationId)
        .single();
      
      updateData.retry_count = (currentOp?.retry_count || 0) + 1;
    }

    const { error } = await this.supabase
      .from('sync_operations')
      .update(updateData)
      .eq('id', operationId);

    if (error) throw error;
  }

  // Log actions to audit trail
  async logAuditTrail(entry: {
    sync_operation_id?: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    before_data?: Record<string, any>;
    after_data?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('sync_audit_trail')
      .insert({
        user_id: this.userId,
        sync_operation_id: entry.sync_operation_id,
        action_type: entry.action_type,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        before_data: entry.before_data,
        after_data: entry.after_data,
        metadata: entry.metadata || {},
        performed_by: this.userId
      });

    if (error) {
      console.error('Failed to log audit trail:', error);
      // Don't throw - audit logging shouldn't break sync operations
    }
  }

  // Helper function to convert database row to SyncOperation
  private dbRowToSyncOperation(row: any): SyncOperation {
    return {
      id: row.id,
      user_id: row.user_id,
      sync_type: row.sync_type as 'crm_to_sw' | 'sw_to_crm' | 'bidirectional',
      operation_type: row.operation_type,
      source_system: row.source_system,
      source_record_id: row.source_record_id,
      target_system: row.target_system,
      target_record_id: row.target_record_id,
      operation_status: row.operation_status as 'pending' | 'completed' | 'failed' | 'conflict',
      sync_data: this.jsonToRecord(row.sync_data),
      conflict_data: row.conflict_data ? this.jsonToRecord(row.conflict_data) : undefined,
      resolution_strategy: row.resolution_strategy as 'timestamp' | 'user_preference' | 'manual' | undefined,
      resolved_by: row.resolved_by,
      resolved_at: row.resolved_at,
      error_message: row.error_message,
      retry_count: row.retry_count,
      created_at: row.created_at,
      completed_at: row.completed_at
    };
  }

  // Helper function to safely cast Json to Record<string, any>
  private jsonToRecord(json: any): Record<string, any> {
    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      return json as Record<string, any>;
    }
    return {};
  }
}
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Helper function to safely cast Json to Record<string, any>
function jsonToRecord(json: Json): Record<string, any> {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return json as Record<string, any>;
  }
  return {};
}

// Helper function to convert database row to SyncOperation
function dbRowToSyncOperation(row: any): SyncOperation {
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
    sync_data: jsonToRecord(row.sync_data),
    conflict_data: row.conflict_data ? jsonToRecord(row.conflict_data) : undefined,
    resolution_strategy: row.resolution_strategy as 'timestamp' | 'user_preference' | 'manual' | undefined,
    resolved_by: row.resolved_by,
    resolved_at: row.resolved_at,
    error_message: row.error_message,
    retry_count: row.retry_count,
    created_at: row.created_at,
    completed_at: row.completed_at
  };
}

// Helper function to convert database row to SyncConflict
function dbRowToSyncConflict(row: any): SyncConflict {
  return {
    id: row.id,
    sync_operation_id: row.sync_operation_id,
    user_id: row.user_id,
    conflict_type: row.conflict_type as 'data_mismatch' | 'timestamp_conflict' | 'schema_change',
    local_data: jsonToRecord(row.local_data),
    remote_data: jsonToRecord(row.remote_data),
    field_conflicts: jsonToRecord(row.field_conflicts),
    resolution_status: row.resolution_status as 'pending' | 'resolved' | 'ignored',
    resolution_data: row.resolution_data ? jsonToRecord(row.resolution_data) : undefined,
    resolved_by: row.resolved_by,
    resolved_at: row.resolved_at,
    created_at: row.created_at
  };
}

// Helper function to convert database row to UserSyncPreferences
function dbRowToUserSyncPreferences(row: any): UserSyncPreferences {
  return {
    id: row.id,
    user_id: row.user_id,
    crm_type: row.crm_type,
    sync_direction: row.sync_direction as 'to_crm' | 'from_crm' | 'bidirectional',
    auto_resolve_conflicts: row.auto_resolve_conflicts,
    preferred_resolution_strategy: row.preferred_resolution_strategy as 'timestamp' | 'crm_priority' | 'sw_priority',
    sync_frequency_minutes: row.sync_frequency_minutes,
    enabled: row.enabled,
    sync_settings: jsonToRecord(row.sync_settings),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Types for bidirectional sync
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

export interface SyncConflict {
  id: string;
  sync_operation_id: string;
  user_id: string;
  conflict_type: 'data_mismatch' | 'timestamp_conflict' | 'schema_change';
  local_data: Record<string, any>;
  remote_data: Record<string, any>;
  field_conflicts: Record<string, any>;
  resolution_status: 'pending' | 'resolved' | 'ignored';
  resolution_data?: Record<string, any>;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface UserSyncPreferences {
  id: string;
  user_id: string;
  crm_type: string;
  sync_direction: 'to_crm' | 'from_crm' | 'bidirectional';
  auto_resolve_conflicts: boolean;
  preferred_resolution_strategy: 'timestamp' | 'crm_priority' | 'sw_priority';
  sync_frequency_minutes: number;
  enabled: boolean;
  sync_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class BidirectionalSyncManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create a new sync operation
  async createSyncOperation(operation: Partial<SyncOperation>): Promise<SyncOperation> {
    const { data, error } = await supabase
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
    return dbRowToSyncOperation(data);
  }

  // Detect conflicts between local and remote data
  async detectConflicts(
    syncOperationId: string,
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): Promise<SyncConflict | null> {
    const conflicts = this.findDataConflicts(localData, remoteData);
    
    if (Object.keys(conflicts).length === 0) {
      return null;
    }

    // Determine conflict type
    let conflictType: SyncConflict['conflict_type'] = 'data_mismatch';
    
    if (localData.updated_at && remoteData.updated_at) {
      const localTime = new Date(localData.updated_at);
      const remoteTime = new Date(remoteData.updated_at);
      
      if (Math.abs(localTime.getTime() - remoteTime.getTime()) < 60000) {
        conflictType = 'timestamp_conflict';
      }
    }

    const { data, error } = await supabase
      .from('sync_conflicts')
      .insert({
        sync_operation_id: syncOperationId,
        user_id: this.userId,
        conflict_type: conflictType,
        local_data: localData,
        remote_data: remoteData,
        field_conflicts: conflicts
      })
      .select()
      .single();

    if (error) throw error;
    return dbRowToSyncConflict(data);
  }

  // Find specific field conflicts between datasets
  private findDataConflicts(
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): Record<string, any> {
    const conflicts: Record<string, any> = {};
    
    // Compare all fields
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);
    
    for (const key of allKeys) {
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      // Skip system fields
      if (['id', 'created_at', 'updated_at'].includes(key)) continue;
      
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts[key] = {
          local: localValue,
          remote: remoteValue,
          type: this.getConflictType(localValue, remoteValue)
        };
      }
    }
    
    return conflicts;
  }

  private getConflictType(localValue: any, remoteValue: any): string {
    if (localValue === null || localValue === undefined) return 'missing_local';
    if (remoteValue === null || remoteValue === undefined) return 'missing_remote';
    if (typeof localValue !== typeof remoteValue) return 'type_mismatch';
    return 'value_mismatch';
  }

  // Resolve conflicts using specified strategy
  async resolveConflict(
    conflictId: string,
    strategy: 'timestamp' | 'crm_priority' | 'sw_priority' | 'manual',
    manualResolution?: Record<string, any>
  ): Promise<SyncConflict> {
    const { data: conflict, error: conflictError } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('id', conflictId)
      .single();

    if (conflictError) throw conflictError;

    const conflictTyped = dbRowToSyncConflict(conflict);
    let resolvedData: Record<string, any> = {};

    switch (strategy) {
      case 'timestamp':
        resolvedData = this.resolveByTimestamp(conflictTyped.local_data, conflictTyped.remote_data);
        break;
      case 'crm_priority':
        resolvedData = { ...conflictTyped.local_data, ...conflictTyped.remote_data };
        break;
      case 'sw_priority':
        resolvedData = { ...conflictTyped.remote_data, ...conflictTyped.local_data };
        break;
      case 'manual':
        resolvedData = manualResolution || conflictTyped.local_data;
        break;
    }

    const { data, error } = await supabase
      .from('sync_conflicts')
      .update({
        resolution_status: 'resolved',
        resolution_data: resolvedData,
        resolved_by: this.userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (error) throw error;

    const resolvedConflict = dbRowToSyncConflict(data);

    // Log resolution to audit trail
    await this.logAuditTrail({
      action_type: 'conflict_resolved',
      entity_type: 'sync_conflict',
      entity_id: conflictId,
      before_data: conflictTyped,
      after_data: resolvedConflict,
      metadata: { strategy, resolution_method: strategy }
    });

    return resolvedConflict;
  }

  private resolveByTimestamp(
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): Record<string, any> {
    const localTime = new Date(localData.updated_at || localData.created_at || 0);
    const remoteTime = new Date(remoteData.updated_at || remoteData.created_at || 0);
    
    // Use most recent data as base, but merge non-conflicting fields
    const newerData = localTime > remoteTime ? localData : remoteData;
    const olderData = localTime > remoteTime ? remoteData : localData;
    
    return { ...olderData, ...newerData };
  }

  // Execute sync operation
  async executeSyncOperation(operationId: string): Promise<void> {
    const { data: operation, error: operationError } = await supabase
      .from('sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (operationError) throw operationError;

    const operationTyped = dbRowToSyncOperation(operation);

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

      // Execute the actual sync logic based on operation type
      await this.performSyncOperation(operationTyped);
      
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

  private async performSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.operation_type) {
      case 'deal_update':
        await this.syncDealUpdate(operation);
        break;
      case 'contact_sync':
        await this.syncContactData(operation);
        break;
      case 'task_completion':
        await this.syncTaskCompletion(operation);
        break;
      case 'analysis_update':
        await this.syncAnalysisUpdate(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.operation_type}`);
    }
  }

  private async syncDealUpdate(operation: SyncOperation): Promise<void> {
    const dealData = operation.sync_data;
    
    // Update account/deal information
    if (operation.target_record_id) {
      const { error } = await supabase
        .from('accounts')
        .update({
          deal_stage: dealData.stage,
          notes: dealData.notes,
          // Add other relevant fields
        })
        .eq('id', operation.target_record_id);

      if (error) throw error;
    }
  }

  private async syncContactData(operation: SyncOperation): Promise<void> {
    // Read-only contact sync - we don't modify CRM data, only read it
    const contactData = operation.sync_data;
    
    // Update internal contact matching data
    // This would typically update matching tables or refresh contact cache
    console.log('Syncing contact data:', contactData);
  }

  private async syncTaskCompletion(operation: SyncOperation): Promise<void> {
    const taskData = operation.sync_data;
    
    // Log task completion in our system
    await this.logAuditTrail({
      sync_operation_id: operation.id,
      action_type: 'task_completed',
      entity_type: 'task',
      entity_id: taskData.task_id,
      after_data: taskData,
      metadata: { 
        completed_in_crm: true,
        crm_system: operation.source_system
      }
    });
  }

  private async syncAnalysisUpdate(operation: SyncOperation): Promise<void> {
    const analysisData = operation.sync_data;
    
    // Update analysis with CRM context
    if (operation.target_record_id) {
      const { error } = await supabase
        .from('conversation_analysis')
        .update({
          recommendations: {
            ...analysisData.recommendations,
            crm_context: analysisData.crm_data
          }
        })
        .eq('id', operation.target_record_id);

      if (error) throw error;
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
      // Increment retry count manually since we don't have an increment function
      const { data: currentOp } = await supabase
        .from('sync_operations')
        .select('retry_count')
        .eq('id', operationId)
        .single();
      
      updateData.retry_count = (currentOp?.retry_count || 0) + 1;
    }

    const { error } = await supabase
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
    const { error } = await supabase
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

  // Get user sync preferences
  async getSyncPreferences(crmType: string): Promise<UserSyncPreferences | null> {
    const { data, error } = await supabase
      .from('user_sync_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .eq('crm_type', crmType)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? dbRowToUserSyncPreferences(data) : null;
  }

  // Update sync preferences
  async updateSyncPreferences(
    crmType: string, 
    preferences: Partial<UserSyncPreferences>
  ): Promise<UserSyncPreferences> {
    const { data, error } = await supabase
      .from('user_sync_preferences')
      .upsert({
        user_id: this.userId,
        crm_type: crmType,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return dbRowToUserSyncPreferences(data);
  }

  // Get pending conflicts for user
  async getPendingConflicts(): Promise<SyncConflict[]> {
    const { data, error } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('user_id', this.userId)
      .eq('resolution_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbRowToSyncConflict);
  }

  // Get sync operations for user
  async getSyncOperations(status?: SyncOperation['operation_status']): Promise<SyncOperation[]> {
    let query = supabase
      .from('sync_operations')
      .select('*')
      .eq('user_id', this.userId);

    if (status) {
      query = query.eq('operation_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbRowToSyncOperation);
  }

  // Rollback a sync operation
  async rollbackSyncOperation(operationId: string): Promise<void> {
    const { data: operation, error: operationError } = await supabase
      .from('sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (operationError) throw operationError;

    // Get the original data from audit trail
    const { data: auditEntries, error: auditError } = await supabase
      .from('sync_audit_trail')
      .select('*')
      .eq('sync_operation_id', operationId)
      .eq('action_type', 'sync_completed')
      .order('performed_at', { ascending: false })
      .limit(1);

    if (auditError) throw auditError;

    if (auditEntries && auditEntries.length > 0) {
      const auditEntry = auditEntries[0];
      
      // Restore the before_data if available
      if (auditEntry.before_data && auditEntry.entity_type && auditEntry.entity_id) {
        await this.restoreEntityData(
          auditEntry.entity_type,
          auditEntry.entity_id,
          jsonToRecord(auditEntry.before_data)
        );
      }

      // Log the rollback
      await this.logAuditTrail({
        sync_operation_id: operationId,
        action_type: 'sync_rollback',
        entity_type: auditEntry.entity_type,
        entity_id: auditEntry.entity_id,
        before_data: jsonToRecord(auditEntry.after_data),
        after_data: jsonToRecord(auditEntry.before_data),
        metadata: { rollback_reason: 'manual_rollback' }
      });
    }
  }

  private async restoreEntityData(
    entityType: string,
    entityId: string,
    restoreData: Record<string, any>
  ): Promise<void> {
    // Handle restoration based on entity type
    switch (entityType) {
      case 'deal':
      case 'account':
        const { error: accountError } = await supabase
          .from('accounts')
          .update(restoreData)
          .eq('id', entityId);
        if (accountError) throw accountError;
        break;
        
      case 'analysis':
        const { error: analysisError } = await supabase
          .from('conversation_analysis')
          .update(restoreData)
          .eq('id', entityId);
        if (analysisError) throw analysisError;
        break;
        
      default:
        throw new Error(`Unknown entity type for rollback: ${entityType}`);
    }
  }
}
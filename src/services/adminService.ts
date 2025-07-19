import { supabase } from '@/integrations/supabase/client'

export const adminService = {
  /**
   * Securely change user role with enhanced validation
   * For now, uses direct database update with proper validation until types are updated
   */
  async changeUserRole(targetUserId: string, newRole: 'admin' | 'sales_user') {
    try {
      // Get current admin user ID for validation
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      // Use the secure role change function with built-in validation and audit logging
      const { data: result, error: changeError } = await supabase.rpc(
        'execute_role_change' as any,
        {
          p_target_user_id: targetUserId,
          p_new_role: newRole,
          p_admin_user_id: user.id,
        }
      )

      if (changeError) {
        throw new Error(`Database error: ${changeError.message}`)
      }

      const roleResult = result as any
      if (!roleResult?.success) {
        throw new Error(roleResult?.error || 'Role change failed')
      }

      return {
        success: true,
        message: roleResult.message,
        previousRole: roleResult.previous_role,
        newRole: roleResult.new_role
      }
    } catch (error) {
      console.error('Admin service error:', error)
      throw error
    }
  }
}
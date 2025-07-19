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

      // Verify admin permissions
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (adminError || adminUser?.role !== 'admin') {
        throw new Error('Admin privileges required')
      }

      // Prevent self-role modification
      if (targetUserId === user.id) {
        throw new Error('Cannot modify your own role')
      }

      // Get target user info
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('email, role')
        .eq('id', targetUserId)
        .single()

      if (targetError || !targetUser) {
        throw new Error('Target user not found')
      }

      if (targetUser.role === newRole) {
        throw new Error('User already has the specified role')
      }

      // Execute role change with audit logging
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUserId)

      if (updateError) {
        throw new Error(`Failed to update user role: ${updateError.message}`)
      }

      // Log the security event
      await supabase.rpc('log_security_event', {
        p_event_type: 'role_change_completed',
        p_user_id: targetUserId,
        p_details: {
          admin_user_id: user.id,
          previous_role: targetUser.role,
          new_role: newRole,
          target_user_email: targetUser.email,
          success: true
        }
      })

      return {
        success: true,
        message: 'Role changed successfully',
        previousRole: targetUser.role,
        newRole: newRole
      }
    } catch (error) {
      console.error('Admin service error:', error)
      
      // Log failed attempt
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.rpc('log_security_event', {
            p_event_type: 'role_change_failed',
            p_user_id: targetUserId,
            p_details: {
              admin_user_id: user.id,
              new_role: newRole,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }
      } catch (logError) {
        console.error('Failed to log security event:', logError)
      }
      
      throw error
    }
  }
}
// Re-export the single Supabase client instance to avoid multiple client warnings
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export { supabase }

// Helper types for authentication
export type AuthUser = Database['public']['Tables']['users']['Row']
export type InviteToken = Database['public']['Tables']['invites']['Row']

// Auth helper functions (enhanced with password reset support and secure validation)
export const authHelpers = {
  async validateInviteToken(token: string, email: string) {
    try {
      // Use secure validation function instead of direct table access
      const { data: result, error } = await supabase.rpc('validate_invite_token_secure', {
        p_token: token,
        p_email: email
      })

      if (error) {
        console.error('Invite validation error:', error)
        return { valid: false, error: 'Failed to validate invite token' }
      }

      // Type-safe validation result handling
      const validationResult = result as {
        valid: boolean;
        error?: string;
        invite_id?: string;
        requires_password_reset?: boolean;
        existing_user_id?: string;
      };
      
      if (!validationResult?.valid) {
        return { 
          valid: false, 
          error: validationResult?.error || 'Invalid or expired invite token' 
        }
      }
      
      // Handle password reset case
      if (validationResult.requires_password_reset && validationResult.existing_user_id) {
        return { 
          valid: true, 
          invite: { id: validationResult.invite_id },
          requiresPasswordReset: true,
          existingUser: { id: validationResult.existing_user_id }
        }
      }
      
      // Valid invite for new user registration
      return { 
        valid: true, 
        invite: { id: validationResult.invite_id }
      }
    } catch (error) {
      console.error('Invite validation error:', error)
      return { valid: false, error: 'Failed to validate invite token' }
    }
  },

  async markInviteAsUsed(inviteId: string) {
    try {
      // Use secure function instead of direct table access
      const { data: result, error } = await supabase.rpc('mark_invite_as_used_secure', {
        p_invite_id: inviteId
      })

      if (error) {
        console.error('Error marking invite as used:', error)
        return { success: false, error: error.message }
      }

      // Type-safe result handling
      const markResult = result as { success: boolean; error?: string };
      if (!markResult?.success) {
        console.error('Error marking invite as used:', markResult?.error)
        return { success: false, error: markResult?.error || 'Failed to mark invite as used' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking invite as used:', error)
      return { success: false, error: 'Failed to mark invite as used' }
    }
  },

  // Secure password reset token validation (guide rail implementation)
  async validatePasswordResetToken(token: string, email: string) {
    try {
      console.log('Validating password reset token via database');
      
      // Get IP and user agent for security tracking
      const ipAddress = await fetch('https://api.ipify.org?format=text').then(r => r.text()).catch(() => 'unknown');
      const userAgent = navigator.userAgent;
      
      // Use secure database validation function
      const { data: validationResult, error: validationError } = await supabase.rpc(
        'validate_password_reset_token', 
        { 
          p_token: token, 
          p_email: email,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        }
      );
      
      if (validationError) {
        console.error('Password reset token validation error:', validationError);
        return { valid: false, error: 'Failed to validate reset token' };
      }
      
      // Type-safe validation result handling
      const result = validationResult as any;
      if (!result || !result.valid) {
        return { 
          valid: false, 
          error: result?.error || 'Invalid or expired reset token' 
        };
      }
      
      return { valid: true, resetId: result.reset_id };
    } catch (error) {
      console.error('Password reset token validation error:', error);
      return { valid: false, error: 'Failed to validate reset token' };
    }
  }
}

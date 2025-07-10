
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = "https://jtunkyfoadoowpymibjr.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dW5reWZvYWRvb3dweW1pYmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDg3NjEsImV4cCI6MjA2NjU4NDc2MX0.Hjb_P57qg2IKFi7Ox9moiFMUfN73EQgmhGOK7AuUCH4"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Helper types for authentication
export type AuthUser = Database['public']['Tables']['users']['Row']
export type InviteToken = Database['public']['Tables']['invites']['Row']

// Auth helper functions
export const authHelpers = {
  async validateInviteToken(token: string, email: string) {
    try {
      // First, check if invite exists and is valid
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError) {
        console.error('Invite validation error:', inviteError)
        return { valid: false, error: 'Invalid or expired invite token' }
      }

      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        // If user exists with pending_deletion status, allow password reset
        if (existingUser.status === 'pending_deletion') {
          return { 
            valid: true, 
            invite, 
            requiresPasswordReset: true,
            existingUser 
          }
        }
        // If user exists and is active, they shouldn't be using an invite
        return { 
          valid: false, 
          error: 'User already exists and is active. Please log in instead.' 
        }
      }

      // If invite is already used and no existing user with pending_deletion, reject
      if (invite.used_at) {
        return { valid: false, error: 'Invite token has already been used' }
      }

      // Valid invite for new user registration
      return { valid: true, invite }
    } catch (error) {
      console.error('Invite validation error:', error)
      return { valid: false, error: 'Failed to validate invite token' }
    }
  },

  async markInviteAsUsed(inviteId: string) {
    try {
      const { error } = await supabase
        .from('invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', inviteId)

      if (error) {
        console.error('Error marking invite as used:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking invite as used:', error)
      return { success: false, error: 'Failed to mark invite as used' }
    }
  }
}

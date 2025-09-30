
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export type UserRole = 'sales_user' | 'admin'

export interface AuthUser extends User {
  role?: UserRole
}

export const authService = {
  async fetchUserRole(userId: string): Promise<UserRole> {
    try {
      // Query the new user_roles table instead of users table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role', { ascending: true }) // admin comes before sales_user
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user role:', error)
        return 'sales_user'
      }

      return data?.role || 'sales_user'
    } catch (error) {
      console.error('Failed to fetch user role:', error)
      return 'sales_user'
    }
  },

  async enhanceUserWithRole(authUser: User): Promise<AuthUser> {
    const role = await this.fetchUserRole(authUser.id)
    return {
      ...authUser,
      role: role || 'sales_user'
    }
  },

  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }
}

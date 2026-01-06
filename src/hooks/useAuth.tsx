import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { authService, AuthUser, UserRole } from '@/services/authService'
import { AUTH_ROLES, AUTH_MESSAGES, AUTH_CONFIG } from '@/constants/auth'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  isAuthReady: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isSalesUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const enhanceUserWithRoleAsync = async (authUser: User, mounted: boolean) => {
    if (!mounted) return
    
    try {
      // First validate that both auth and public user records exist
      const validationResult = await validateUserConsistency(authUser)
      
      if (!validationResult.isValid) {
        console.warn('User consistency issue detected:', validationResult.issue)
        
        // Attempt auto-repair if possible
        if (validationResult.canRepair) {
          const repairResult = await repairUserRecord(authUser)
          if (repairResult.success) {
            console.log('Successfully repaired user record for:', authUser.email)
          } else {
            console.error('Failed to repair user record:', repairResult.error)
          }
        }
      }

      const enhancedUser = await authService.enhanceUserWithRole(authUser)
      if (mounted) {
        setUser(enhancedUser)
      }
    } catch (error) {
      console.error('Failed to enhance user with role:', error)
    }
  }

  // Validate user consistency between auth and public tables
  const validateUserConsistency = async (authUser: User) => {
    try {
      const { data: publicUser, error } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('id', authUser.id)
        .single()

      if (error || !publicUser) {
        return {
          isValid: false,
          canRepair: true,
          issue: 'Public user record missing'
        }
      }

      if (publicUser.email !== authUser.email) {
        return {
          isValid: false,
          canRepair: false,
          issue: 'Email mismatch between auth and public records'
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error validating user consistency:', error)
      return {
        isValid: false,
        canRepair: false,
        issue: 'Validation check failed'
      }
    }
  }

  // Repair missing public user record
  const repairUserRecord = async (authUser: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          role: 'sales_user',
          status: 'active'
        })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const handleAuthStateChange = (session: Session | null, mounted: boolean) => {
    if (!mounted) return

    setSession(session)

    if (session?.user) {
      // Mark auth as not ready yet during login
      setIsAuthReady(false)
      
      // Update last_login timestamp for this user
      setTimeout(() => {
        updateLastLogin(session.user.id)
      }, 0)

      // Set user with default role immediately
      const userWithDefaultRole: AuthUser = {
        ...session.user,
        role: AUTH_ROLES.SALES_USER as UserRole
      }
      setUser(userWithDefaultRole)

      // Enhance with real role asynchronously
      setTimeout(() => {
        enhanceUserWithRoleAsync(session.user, mounted)
      }, AUTH_CONFIG.ROLE_FETCH_DELAY)
      
      // Mark auth as ready after a short delay to ensure token propagation
      setTimeout(() => {
        if (mounted) {
          setIsAuthReady(true)
        }
      }, AUTH_CONFIG.ROLE_FETCH_DELAY + 200)
    } else {
      setUser(null)
      setIsAuthReady(false)
    }

    setLoading(false)
  }

  // Update last_login timestamp for the user using secure database function
  const updateLastLogin = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_user_last_login', {
        p_user_id: userId
      })
      
      if (error) {
        console.error('Failed to update last_login via RPC:', error)
      } else if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; error?: string }
        if (!result.success) {
          console.error('Last login update failed:', result.error)
        }
      }
    } catch (error) {
      console.error('Failed to update last_login:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Set up auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthStateChange(session, mounted)
      }
    )

    // Handle initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session, mounted)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Get query client to clear cache on sign out
  const queryClient = useQueryClient()
  
  const signOut = useCallback(async () => {
    try {
      const { error } = await authService.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast.error(AUTH_MESSAGES.SIGN_OUT_ERROR)
      } else {
        // Clear all React Query cache to prevent stale data across sessions
        queryClient.clear()
        console.log('Cleared React Query cache on sign out')
        toast.success(AUTH_MESSAGES.SIGN_OUT_SUCCESS)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error(AUTH_MESSAGES.SIGN_OUT_ERROR)
    }
  }, [queryClient])

  const value = {
    user,
    session,
    loading,
    isAuthReady,
    signOut,
    isAdmin: user?.role === AUTH_ROLES.ADMIN,
    isSalesUser: user?.role === AUTH_ROLES.SALES_USER
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

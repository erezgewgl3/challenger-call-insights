
import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { authService, AuthUser, UserRole } from '@/services/authService'
import { AUTH_ROLES, AUTH_MESSAGES, AUTH_CONFIG } from '@/constants/auth'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isSalesUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
    } else {
      setUser(null)
    }

    setLoading(false)
  }

  // Update last_login timestamp for the user
  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
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

  const signOut = async () => {
    try {
      const { error } = await authService.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast.error(AUTH_MESSAGES.SIGN_OUT_ERROR)
      } else {
        toast.success(AUTH_MESSAGES.SIGN_OUT_SUCCESS)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error(AUTH_MESSAGES.SIGN_OUT_ERROR)
    }
  }

  const value = {
    user,
    session,
    loading,
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

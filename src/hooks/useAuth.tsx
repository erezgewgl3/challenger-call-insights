import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService, type UserRole } from '@/services/authService'
import { toast } from 'sonner'

// Demo user type
interface DemoUser {
  id: string
  email: string
  role: UserRole
  created_at: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isSalesUser: boolean
}

interface AuthUser extends User {
  role?: UserRole
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Enhanced user data fetching with role and validation
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
        role: 'sales_user' as UserRole
      }
      setUser(userWithDefaultRole)

      // Enhance with real role asynchronously
      setTimeout(() => {
        enhanceUserWithRoleAsync(session.user, mounted)
      }, 100)
    } else {
      setUser(null)
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

  // Check for demo mode on initialization
  useEffect(() => {
    const checkDemoMode = () => {
      const demoMode = localStorage.getItem('demo_mode')
      const demoUserData = localStorage.getItem('demo_user')
      
      if (demoMode === 'true' && demoUserData) {
        try {
          const demoUser: DemoUser = JSON.parse(demoUserData)
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            role: demoUser.role,
            created_at: demoUser.created_at,
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {}
          } as AuthUser)
          setLoading(false)
          return true
        } catch (error) {
          console.error('Error parsing demo user:', error)
          localStorage.removeItem('demo_mode')
          localStorage.removeItem('demo_user')
        }
      }
      return false
    }

    if (!checkDemoMode()) {
      // Only initialize Supabase auth if not in demo mode
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
    }
  }, [])

  const signOut = async () => {
    try {
      // Check if we're in demo mode
      const demoMode = localStorage.getItem('demo_mode')
      
      if (demoMode === 'true') {
        // Clear demo mode
        localStorage.removeItem('demo_mode')
        localStorage.removeItem('demo_user')
        setUser(null)
        setSession(null)
        toast.success('Demo session ended')
        return
      }

      const { error } = await authService.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast.error('Failed to sign out properly')
      } else {
        toast.success('Signed out successfully')
      }
      
      // Always clear local state regardless of API success
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      
      // Still clear local state on error
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    isAdmin: user?.role === 'admin',
    isSalesUser: user?.role === 'sales_user'
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
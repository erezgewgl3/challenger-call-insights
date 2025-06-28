
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
      const enhancedUser = await authService.enhanceUserWithRole(authUser)
      if (mounted) {
        setUser(enhancedUser)
      }
    } catch (error) {
      console.error('Failed to enhance user with role:', error)
    }
  }

  const handleAuthStateChange = (session: Session | null, mounted: boolean) => {
    if (!mounted) return

    setSession(session)

    if (session?.user) {
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

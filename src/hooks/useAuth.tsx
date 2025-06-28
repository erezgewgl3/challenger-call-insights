
import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type UserRole = 'sales_user' | 'admin'

interface AuthUser extends User {
  role?: UserRole
}

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

  // Separate effect to fetch user role when user changes
  useEffect(() => {
    const fetchUserRole = async (userId: string): Promise<UserRole> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          return 'sales_user' // Default fallback
        }

        return data?.role || 'sales_user'
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        return 'sales_user' // Default fallback
      }
    }

    const enhanceUserWithRole = async (authUser: User) => {
      const role = await fetchUserRole(authUser.id)
      const enhancedUser = {
        ...authUser,
        role: role || 'sales_user'
      }
      setUser(enhancedUser)
    }

    // Only fetch role if we have a user but no role yet
    if (session?.user && (!user || !user.role)) {
      enhanceUserWithRole(session.user)
    }
  }, [session?.user?.id]) // Only depend on user ID changes

  useEffect(() => {
    // Set up auth state listener - MUST be synchronous
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        // Only set basic user state here - role will be fetched separately
        if (session?.user) {
          setUser(session.user as AuthUser)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      
      if (session?.user) {
        setUser(session.user as AuthUser)
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast.error('Failed to sign out')
      } else {
        toast.success('Signed out successfully')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
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

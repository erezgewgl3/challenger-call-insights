
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

  // Fetch user role from database
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
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

  // Enhance user object with role
  const enhanceUserWithRole = async (authUser: User): Promise<AuthUser> => {
    const role = await fetchUserRole(authUser.id)
    return {
      ...authUser,
      role: role || 'sales_user'
    }
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        if (session?.user) {
          const enhancedUser = await enhanceUserWithRole(session.user)
          setUser(enhancedUser)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      
      if (session?.user) {
        const enhancedUser = await enhanceUserWithRole(session.user)
        setUser(enhancedUser)
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

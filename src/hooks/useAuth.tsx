
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

  // Function to fetch user role
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

  useEffect(() => {
    let mounted = true

    // Set up auth state listener - MUST be synchronous to prevent deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (!mounted) return
        
        setSession(session)
        
        if (session?.user) {
          // Set user immediately with default role, then fetch real role asynchronously
          const userWithDefaultRole = {
            ...session.user,
            role: 'sales_user' as UserRole
          }
          setUser(userWithDefaultRole)
          
          // Fetch actual role asynchronously using setTimeout to avoid deadlock
          setTimeout(async () => {
            if (!mounted) return
            
            try {
              const role = await fetchUserRole(session.user.id)
              if (mounted) {
                const enhancedUser = {
                  ...session.user,
                  role: role || 'sales_user'
                }
                setUser(enhancedUser)
                console.log('User role updated:', { email: session.user.email, role })
              }
            } catch (error) {
              console.error('Failed to enhance user with role:', error)
            }
          }, 0)
        } else {
          if (mounted) {
            setUser(null)
          }
        }
        
        if (mounted) {
          setLoading(false)
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setSession(session)
      
      if (session?.user) {
        // Set user immediately with default role
        const userWithDefaultRole = {
          ...session.user,
          role: 'sales_user' as UserRole
        }
        setUser(userWithDefaultRole)
        
        // Fetch actual role asynchronously
        setTimeout(async () => {
          if (!mounted) return
          
          try {
            const role = await fetchUserRole(session.user.id)
            if (mounted) {
              const enhancedUser = {
                ...session.user,
                role: role || 'sales_user'
              }
              setUser(enhancedUser)
              console.log('Initial user role set:', { email: session.user.email, role })
            }
          } catch (error) {
            console.error('Failed to enhance user with role:', error)
          }
        }, 0)
      } else {
        if (mounted) {
          setUser(null)
        }
      }
      
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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

  console.log('Auth context value:', { 
    userEmail: user?.email, 
    role: user?.role, 
    isAdmin: user?.role === 'admin',
    loading 
  })

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

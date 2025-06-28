
export const AUTH_ROLES = {
  SALES_USER: 'sales_user',
  ADMIN: 'admin'
} as const

export const AUTH_MESSAGES = {
  SIGN_OUT_SUCCESS: 'Signed out successfully',
  SIGN_OUT_ERROR: 'Failed to sign out',
  LOADING_DASHBOARD: 'Loading your dashboard...',
  ACCESS_RESTRICTED: 'Access Restricted',
  ADMIN_ONLY: 'This area is restricted to administrators only.',
  GO_BACK: 'Go Back'
} as const

export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  ROLE_FETCH_DELAY: 0 // Immediate async role fetch
} as const

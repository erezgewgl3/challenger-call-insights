import { supabase } from '@/integrations/supabase/client';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export const resetPasswordForUser = async (email: string): Promise<PasswordResetResult> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please wait before trying again.',
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send password reset email. Please try again.',
    };
  }
};
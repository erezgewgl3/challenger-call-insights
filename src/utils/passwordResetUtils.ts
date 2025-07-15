import { supabase } from '@/integrations/supabase/client';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

// Generate a secure token for password reset
const generateResetToken = (): string => {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
};

export const resetPasswordForUser = async (email: string): Promise<PasswordResetResult> => {
  try {
    // Generate custom reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    // Create reset link
    const baseUrl = window.location.origin;
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Store token in localStorage temporarily (could be improved with database storage)
    const resetData = {
      token,
      email,
      expiresAt: expiresAt.toISOString(),
      used: false
    };
    localStorage.setItem(`reset_${token}`, JSON.stringify(resetData));
    
    // Send email using custom send-email function
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'password-reset',
        to: email,
        data: {
          email,
          resetLink,
          expiresIn: '1 hour'
        }
      }
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      // Clean up token if email failed
      localStorage.removeItem(`reset_${token}`);
      
      if (emailError.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please wait before trying again.',
        };
      }
      
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to send password reset email. Please try again.',
    };
  }
};

// Validate reset token
export const validateResetToken = (token: string, email: string): { valid: boolean; error?: string } => {
  try {
    const resetDataStr = localStorage.getItem(`reset_${token}`);
    if (!resetDataStr) {
      return { valid: false, error: 'Invalid or expired reset token.' };
    }
    
    const resetData = JSON.parse(resetDataStr);
    
    // Check if already used
    if (resetData.used) {
      return { valid: false, error: 'This reset token has already been used.' };
    }
    
    // Check if expired
    if (new Date() > new Date(resetData.expiresAt)) {
      localStorage.removeItem(`reset_${token}`);
      return { valid: false, error: 'Reset token has expired. Please request a new password reset.' };
    }
    
    // Check if email matches
    if (resetData.email !== email) {
      return { valid: false, error: 'Invalid reset token for this email address.' };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Invalid reset token format.' };
  }
};

// Mark token as used
export const markTokenAsUsed = (token: string): void => {
  try {
    const resetDataStr = localStorage.getItem(`reset_${token}`);
    if (resetDataStr) {
      const resetData = JSON.parse(resetDataStr);
      resetData.used = true;
      localStorage.setItem(`reset_${token}`, JSON.stringify(resetData));
      
      // Clean up after 5 minutes
      setTimeout(() => {
        localStorage.removeItem(`reset_${token}`);
      }, 5 * 60 * 1000);
    }
  } catch (error) {
    console.error('Error marking token as used:', error);
  }
};
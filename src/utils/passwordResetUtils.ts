
import { supabase } from '@/integrations/supabase/client';
import { getSecureBaseUrl } from './domainUtils';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

// Generate a crypto-strong reset token (guide rail implementation)
const generateResetToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const resetPasswordForUser = async (email: string): Promise<PasswordResetResult> => {
  try {
    console.log('Starting secure password reset for email:', email);
    
    // Generate crypto-strong reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry (guide rail)

    // Create reset link using secure domain utility
    const baseUrl = getSecureBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Get IP and user agent for security tracking (guide rail)
    const ipAddress = await fetch('https://api.ipify.org?format=text').then(r => r.text()).catch(() => 'unknown');
    const userAgent = navigator.userAgent;
    
    console.log('Creating secure database token record');
    
    // Store token securely in database (replacing localStorage)
    const { data: tokenHash, error: tokenError } = await supabase.rpc('hash_token', { token });
    
    if (tokenError) {
      console.error('Token hashing error:', tokenError);
      return {
        success: false,
        error: 'Failed to create secure reset token. Please try again.',
      };
    }

    // Insert reset token record with all guide rails
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return {
        success: false,
        error: 'Failed to initiate password reset. Please try again.',
      };
    }
    
    console.log('Secure token stored in database');
    
    // Dual token support (guide rail): Also store in localStorage for backward compatibility
    const legacyResetData = {
      token,
      email,
      expiresAt: expiresAt.toISOString(),
      used: false
    };
    localStorage.setItem(`reset_${token}`, JSON.stringify(legacyResetData));
    
    // Prepare email payload
    const emailPayload = {
      type: 'password-reset',
      to: email,
      data: {
        email,
        resetLink,
        expiresIn: '1 hour'
      }
    };
    
    console.log('Invoking send-email function with payload:', emailPayload);
    
    // Send email using custom send-email function with error handling (guide rail)
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: emailPayload
    });

    console.log('Send-email function response:', { data: emailData, error: emailError });

    // Comprehensive error handling (guide rail)
    if (emailError) {
      console.error('Email send error:', emailError);
      // Clean up tokens if email failed (guide rail)
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);
      localStorage.removeItem(`reset_${token}`);
      
      if (emailError.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please wait before trying again.',
        };
      }
      
      return {
        success: false,
        error: emailError.message || 'Failed to send password reset email. Please try again.',
      };
    }

    // Validate email function response (guide rail)
    if (!emailData || emailData.error) {
      console.error('Email function returned error or no data:', emailData);
      // Clean up tokens on failure
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);
      localStorage.removeItem(`reset_${token}`);
      return {
        success: false,
        error: emailData?.error || 'Failed to send password reset email. Please try again.',
      };
    }

    // Success validation (guide rail) - Fixed to check for emailId instead of id
    if (!emailData.emailId && !emailData.success) {
      console.error('Email function did not return success indicator:', emailData);
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);
      localStorage.removeItem(`reset_${token}`);
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.',
      };
    }

    console.log('Secure password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to send password reset email. Please try again.',
    };
  }
};

// Secure database-backed token validation (replacing localStorage)
export const validateResetToken = async (token: string, email: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    console.log('Validating reset token via database');
    
    // Get IP and user agent for security tracking (guide rail)
    const ipAddress = await fetch('https://api.ipify.org?format=text').then(r => r.text()).catch(() => 'unknown');
    const userAgent = navigator.userAgent;
    
    // Use secure database validation (primary method)
    const { data: validationResult, error: validationError } = await supabase.rpc(
      'validate_password_reset_token', 
      { 
        p_token: token, 
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      }
    );
    
    if (validationError) {
      console.error('Database validation error:', validationError);
      // Fallback to localStorage validation (graceful degradation guide rail)
      return validateResetTokenLegacy(token, email);
    }
    
    // Type-safe validation result handling
    const result = validationResult as any;
    if (!result || !result.valid) {
      console.error('Token validation failed:', result?.error);
      return { valid: false, error: result?.error || 'Invalid or expired reset token' };
    }
    
    console.log('Token validated successfully via database');
    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    // Fallback to localStorage validation (guide rail)
    return validateResetTokenLegacy(token, email);
  }
};

// Legacy localStorage validation (backward compatibility guide rail)
const validateResetTokenLegacy = (token: string, email: string): { valid: boolean; error?: string } => {
  try {
    console.log('Using legacy localStorage validation as fallback');
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
    console.error('Legacy token validation error:', error);
    return { valid: false, error: 'Invalid reset token format.' };
  }
};

// Mark token as used (dual support for both database and localStorage)
export const markTokenAsUsed = async (token: string): Promise<void> => {
  try {
    console.log('Marking token as used');
    
    // Database method is already handled by the validation function
    // Just clean up localStorage for backward compatibility
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

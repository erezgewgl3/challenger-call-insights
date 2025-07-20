/**
 * File Security Utilities for enhanced file validation
 * Provides client-side security checks for file uploads
 */

// File signature magic bytes for supported formats
const FILE_SIGNATURES = {
  'text/plain': {
    description: 'Plain text file',
    signatures: [], // Text files don't have magic bytes
    maxHeaderCheck: 16
  },
  'text/vtt': {
    description: 'WebVTT subtitle file',
    signatures: [
      [0x57, 0x45, 0x42, 0x56, 0x54, 0x54] // "WEBVTT"
    ],
    maxHeaderCheck: 16
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    description: 'Word document',
    signatures: [
      [0x50, 0x4B, 0x03, 0x04], // ZIP signature (DOCX is ZIP-based)
      [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
      [0x50, 0x4B, 0x07, 0x08]  // Spanned ZIP
    ],
    maxHeaderCheck: 16
  }
};

// Dangerous file patterns to detect
const DANGEROUS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /innerHTML/i,
  /outerHTML/i,
  /document\.write/i
];

/**
 * Validates file signature against declared MIME type
 */
export async function validateFileSignature(file: File): Promise<{
  valid: boolean;
  detectedType?: string;
  confidence: number;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const declaredType = file.type;
    
    // Handle text files specially (no magic bytes)
    if (declaredType === 'text/plain' || declaredType === 'text/vtt') {
      // Check if it doesn't start with binary signatures
      const binarySignatures = [
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0xFF, 0xD8, 0xFF],       // JPEG
        [0x25, 0x50, 0x44, 0x46], // PDF
        [0x4D, 0x5A],             // EXE
        [0x7F, 0x45, 0x4C, 0x46]  // ELF
      ];
      
      for (const signature of binarySignatures) {
        if (bytes.length >= signature.length) {
          const matches = signature.every((byte, index) => bytes[index] === byte);
          if (matches) {
            return {
              valid: false,
              confidence: 0.9,
              error: 'File appears to be binary but declared as text'
            };
          }
        }
      }
      
      return {
        valid: true,
        detectedType: declaredType,
        confidence: 0.8
      };
    }
    
    // Check DOCX signature
    if (declaredType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const docxSignatures = FILE_SIGNATURES[declaredType].signatures;
      
      for (const signature of docxSignatures) {
        if (bytes.length >= signature.length) {
          const matches = signature.every((byte, index) => bytes[index] === byte);
          if (matches) {
            return {
              valid: true,
              detectedType: declaredType,
              confidence: 0.9
            };
          }
        }
      }
      
      return {
        valid: false,
        confidence: 0.8,
        error: 'File signature does not match DOCX format'
      };
    }
    
    return {
      valid: false,
      confidence: 0.5,
      error: 'Unsupported file type for signature validation'
    };
    
  } catch (error) {
    return {
      valid: false,
      confidence: 0,
      error: `Signature validation failed: ${error}`
    };
  }
}

/**
 * Scans file content for suspicious patterns
 */
export function scanFileContent(content: string, fileName: string): {
  safe: boolean;
  threats: Array<{
    type: string;
    pattern?: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  securityScore: number;
} {
  let securityScore = 100;
  const threats: Array<{
    type: string;
    pattern?: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> = [];
  
  const contentLower = content.toLowerCase();
  
  // Check for suspicious script patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      securityScore -= 20;
      threats.push({
        type: 'suspicious_script',
        pattern: pattern.source,
        severity: 'medium',
        description: 'Potentially malicious script pattern detected'
      });
    }
  }
  
  // Check for executable file patterns in filename
  const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const lowerFileName = fileName.toLowerCase();
  
  for (const ext of executableExtensions) {
    if (lowerFileName.includes(ext)) {
      securityScore -= 50;
      threats.push({
        type: 'executable_pattern',
        severity: 'high',
        description: `Filename contains executable extension: ${ext}`
      });
    }
  }
  
  // Check for excessive special characters (obfuscation)
  const specialChars = content.match(/[!@#$%^&*(){}[\]<>/\\|]/g) || [];
  const specialCharRatio = specialChars.length / content.length;
  
  if (specialCharRatio > 0.3) {
    securityScore -= 15;
    threats.push({
      type: 'high_special_char_ratio',
      severity: 'low',
      description: 'High ratio of special characters detected (possible obfuscation)'
    });
  }
  
  // Check for very long lines (obfuscation)
  const lines = content.split('\n');
  const hasVeryLongLine = lines.some(line => line.length > 10000);
  
  if (hasVeryLongLine && lines.length === 1) {
    securityScore -= 10;
    threats.push({
      type: 'single_long_line',
      severity: 'low',
      description: 'File contains a single very long line (possible obfuscation)'
    });
  }
  
  return {
    safe: securityScore >= 70,
    threats,
    securityScore: Math.max(0, securityScore)
  };
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal patterns
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove illegal characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
  
  // Remove path separators
  sanitized = sanitized.replace(/[/\\]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const baseName = sanitized.substring(0, 255 - extension.length);
    sanitized = baseName + extension;
  }
  
  // Ensure it's not empty
  if (!sanitized.trim()) {
    sanitized = 'transcript.txt';
  }
  
  return sanitized;
}

/**
 * Gets client IP address for security logging
 */
export function getClientIP(): string | null {
  // This is limited in browser environment, but we can try some methods
  try {
    // In a real implementation, this would come from server headers
    // For now, return null and let server handle IP detection
    return null;
  } catch {
    return null;
  }
}

/**
 * Performs comprehensive file validation
 */
export async function validateFileSecurely(file: File): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityLevel: 'basic' | 'enhanced';
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validations
  if (file.size > 10 * 1024 * 1024) { // 10MB
    errors.push('File size exceeds 10MB limit');
  }
  
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/vtt'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Unsupported file type. Only .txt, .docx, and .vtt files are allowed');
  }
  
  // Enhanced validations
  try {
    // Signature validation
    const signatureResult = await validateFileSignature(file);
    if (!signatureResult.valid) {
      if (signatureResult.confidence > 0.7) {
        errors.push(signatureResult.error || 'File signature validation failed');
      } else {
        warnings.push(signatureResult.error || 'File signature could not be verified');
      }
    }
    
    // For text files, also check content
    if (file.type === 'text/plain' || file.type === 'text/vtt') {
      const content = await file.text();
      const contentScan = scanFileContent(content, file.name);
      
      if (!contentScan.safe) {
        const highSeverityThreats = contentScan.threats.filter(t => t.severity === 'high');
        if (highSeverityThreats.length > 0) {
          errors.push('File content contains potentially dangerous patterns');
        } else {
          warnings.push('File content has suspicious characteristics');
        }
      }
    }
    
  } catch (error) {
    warnings.push('Could not perform enhanced security validation');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    securityLevel: 'enhanced'
  };
}
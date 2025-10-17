// =============================================================================
// Frontend Encryption Utilities
// =============================================================================
// Secure encryption utilities for sensitive data in frontend storage

// Using Web Crypto API instead of crypto-js for better security and performance

// Configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  iterations: 100000, // Increased for better security
};

// Generate a secure key from password using Web Crypto API
export async function generateKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ENCRYPTION_CONFIG.algorithm, length: ENCRYPTION_CONFIG.keyLength },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate a random salt
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Encrypt data
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const salt = generateSalt();
    const key = await generateKey(password, salt);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Combine salt, iv, and encrypted data
    const result = `${salt}:${Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')}:${Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [salt, ivStr, encryptedStr] = parts;
    const key = await generateKey(password, salt);
    
    // Parse IV and encrypted data from hex strings
    const iv = new Uint8Array(ivStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(encryptedStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);
    if (!result) {
      throw new Error('Decryption failed - invalid password or corrupted data');
    }

    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Secure storage helpers
export const secureStorage = {
  // Store encrypted data in localStorage
  setItem(key: string, value: string, password: string): void {
    try {
      const encrypted = encryptData(value, password);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw error;
    }
  },

  // Retrieve and decrypt data from localStorage
  getItem(key: string, password: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        return null;
      }
      return decryptData(encrypted, password);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  },

  // Remove item from localStorage
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  // Check if encrypted item exists
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },
};

// Hash utilities using Web Crypto API
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate secure random string
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate encryption password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Common password check
  const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('Avoid common passwords');
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}

// Export default object for convenience
export default {
  encryptData,
  decryptData,
  generateKey,
  generateSalt,
  secureStorage,
  hashData,
  generateSecureRandom,
  validatePasswordStrength,
};



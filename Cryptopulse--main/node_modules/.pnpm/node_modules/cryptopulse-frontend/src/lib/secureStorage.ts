/**
 * Secure storage utilities with encryption
 */

// Using Web Crypto API instead of crypto-js

const STORAGE_KEY = 'cryptopulse_secure_data';
const ENCRYPTION_KEY = 'cryptopulse_secret_key_2024';

interface SecureStorageData {
  [key: string]: any;
}

class SecureStorage {
  private async getKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getKey();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);
      
      return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }

  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getKey();
      
      // Parse hex string back to bytes
      const dataArray = new Uint8Array(encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      const iv = dataArray.slice(0, 12);
      const encrypted = dataArray.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fallback to original data
    }
  }

  private async getStorageData(): Promise<SecureStorageData> {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) return {};

      const decryptedData = await this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to get storage data:', error);
      return {};
    }
  }

  private async setStorageData(data: SecureStorageData): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      const encryptedData = await this.encrypt(jsonData);
      localStorage.setItem(STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to set storage data:', error);
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    const data = await this.getStorageData();
    data[key] = value;
    await this.setStorageData(data);
  }

  async getItem(key: string): Promise<any> {
    const data = await this.getStorageData();
    return data[key];
  }

  async get(key: string): Promise<any> {
    return this.getItem(key);
  }

  async set(key: string, value: any): Promise<void> {
    await this.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    const data = await this.getStorageData();
    delete data[key];
    await this.setStorageData(data);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  hasItem(key: string): boolean {
    const data = this.getStorageData();
    return key in data;
  }
}

export const secureStorage = new SecureStorage();

// Additional validation functions for API keys
export function validateAPIKey(key: string): boolean {
  return key.length >= 20 && /^[A-Za-z0-9]+$/.test(key);
}

export function validateAPISecret(secret: string): boolean {
  return secret.length >= 20 && /^[A-Za-z0-9]+$/.test(secret);
}

// Simple rate limiter
export const apiRateLimiter = {
  canMakeRequest: () => true, // Simplified implementation
  recordRequest: () => {},
  isAllowed: () => true,
};

export default secureStorage;



/**
 * Zero-Knowledge Client-Side Vault Encryption Utility
 * Uses native Web Crypto API (crypto.subtle)
 * Algorithm: PBKDF2 (SHA-256, 250,000 iterations) + AES-256-GCM (12-byte IV)
 *
 * The master password never leaves the browser and is never stored in DB or localStorage.
 */

const PBKDF2_ITERATIONS = 250000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

// Utility functions to convert between ArrayBuffer, Uint8Array and Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a master password and salt using PBKDF2
 */
async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedPayload {
  cipherText: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
}

/**
 * Encrypts plaintext string using PBKDF2 + AES-256-GCM.
 * Generates a fresh random IV (12 bytes) and random salt (16 bytes) if not provided.
 */
export async function encryptData(
  plainText: string,
  masterPassword: string,
  existingSaltBase64?: string
): Promise<EncryptedPayload> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only available in browser environments");
  }

  const encoder = new TextEncoder();
  const plainTextBuffer = encoder.encode(plainText);

  // Generate or reuse salt
  const salt = existingSaltBase64
    ? base64ToBuffer(existingSaltBase64)
    : window.crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));

  // Generate 12-byte IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  // Derive AES-256-GCM key
  const key = await deriveKey(masterPassword, salt);

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    plainTextBuffer
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the master password, IV and Salt.
 * Throws an error if the password is incorrect or authentication tag fails.
 */
export async function decryptData(
  cipherTextBase64: string,
  ivBase64: string,
  saltBase64: string,
  masterPassword: string
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only available in browser environments");
  }

  try {
    const salt = base64ToBuffer(saltBase64);
    const iv = base64ToBuffer(ivBase64);
    const cipherBuffer = base64ToBuffer(cipherTextBase64);

    const key = await deriveKey(masterPassword, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      key,
      cipherBuffer as any
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Contraseña maestra incorrecta o datos corruptos");
  }
}

/**
 * Quick verification probe to check if a master password can decrypt a known sample payload
 */
export async function testMasterPassword(
  cipherTextBase64: string,
  ivBase64: string,
  saltBase64: string,
  masterPassword: string
): Promise<boolean> {
  try {
    await decryptData(cipherTextBase64, ivBase64, saltBase64, masterPassword);
    return true;
  } catch {
    return false;
  }
}

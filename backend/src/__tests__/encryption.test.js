import { describe, it, expect } from 'vitest';

// Set env before importing
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests';

import { encrypt, decrypt } from '../utils/encryption.js';

describe('Encryption utils', () => {
  it('encrypts and decrypts roundtrip', () => {
    const plaintext = 'sk-or-v1-abc123';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('different plaintexts produce different ciphertexts', () => {
    const a = encrypt('key-a');
    const b = encrypt('key-b');
    expect(a).not.toBe(b);
  });

  it('same plaintext produces different ciphertexts (random IV)', () => {
    const a = encrypt('same-key');
    const b = encrypt('same-key');
    expect(a).not.toBe(b); // different IVs
    expect(decrypt(a)).toBe('same-key');
    expect(decrypt(b)).toBe('same-key');
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    parts[2] = 'AAAA' + parts[2].slice(4); // tamper with encrypted data
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('throws on malformed input', () => {
    expect(() => decrypt('not-valid')).toThrow();
    expect(() => decrypt('a:b')).toThrow();
  });
});

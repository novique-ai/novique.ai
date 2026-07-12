import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { decryptToken, encryptToken, isEncrypted } from '@/lib/social/tokenCrypto'

describe('tokenCrypto', () => {
  const originalKey = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY

  beforeEach(() => {
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
    else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = originalKey
  })

  it('encrypts and decrypts a token roundtrip', () => {
    const encrypted = encryptToken('access-token-value')

    expect(isEncrypted(encrypted)).toBe(true)
    expect(encrypted).not.toContain('access-token-value')
    expect(decryptToken(encrypted)).toBe('access-token-value')
  })

  it('rejects tampered ciphertext', () => {
    const parts = encryptToken('access-token-value').split(':')
    const ciphertext = Buffer.from(parts[3], 'base64')
    ciphertext[0] ^= 1
    parts[3] = ciphertext.toString('base64')

    expect(() => decryptToken(parts.join(':'))).toThrow(
      'Failed to decrypt social token'
    )
  })

  it('passes legacy plaintext through unchanged', () => {
    delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY

    expect(decryptToken('legacy-plaintext-token')).toBe('legacy-plaintext-token')
  })

  it('fails loudly when encryption key is missing', () => {
    delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY

    expect(() => encryptToken('access-token-value')).toThrow(
      'SOCIAL_TOKEN_ENCRYPTION_KEY is required'
    )
  })
})

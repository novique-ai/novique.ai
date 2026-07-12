import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const encodedKey = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();

  if (!encodedKey) {
    throw new Error(
      'SOCIAL_TOKEN_ENCRYPTION_KEY is required to encrypt or decrypt social tokens'
    );
  }

  if (
    encodedKey.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedKey)
  ) {
    throw new Error(
      'SOCIAL_TOKEN_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key'
    );
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encodedKey) {
    throw new Error(
      'SOCIAL_TOKEN_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key'
    );
  }

  return key;
}

function decodeEnvelopePart(value: string, label: string): Buffer {
  if (
    value.length % 4 !== 0 ||
    (value.length > 0 && !/^[A-Za-z0-9+/]+={0,2}$/.test(value))
  ) {
    throw new Error(`Invalid encrypted social token ${label}`);
  }

  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) {
    throw new Error(`Invalid encrypted social token ${label}`);
  }

  return decoded;
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith(ENCRYPTION_PREFIX);
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    'enc',
    'v1',
    iv.toString('base64'),
    ciphertext.toString('base64'),
    authTag.toString('base64'),
  ].join(':');
}

export function decryptToken(stored: string): string {
  if (!isEncrypted(stored)) {
    return stored;
  }

  const parts = stored.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid encrypted social token envelope');
  }

  const iv = decodeEnvelopePart(parts[2], 'IV');
  const ciphertext = decodeEnvelopePart(parts[3], 'ciphertext');
  const authTag = decodeEnvelopePart(parts[4], 'authentication tag');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted social token envelope');
  }

  const key = getEncryptionKey();

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error(
      'Failed to decrypt social token: the encryption key or token data is invalid'
    );
  }
}

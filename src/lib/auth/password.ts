import crypto from 'crypto';

/**
 * Hash password using crypto scrypt with random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate a secure session token
 */
export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'mars-secret-32-chars').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'mars-secret-32-chars').update(payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data;
  } catch {
    return null;
  }
}

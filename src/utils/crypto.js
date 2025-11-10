// server/src/utils/crypto.js
import crypto from 'crypto';

const KEY_BASE64 = process.env.ENCRYPTION_KEY;
if (!KEY_BASE64) throw new Error('ENCRYPTION_KEY missing in .env');
const KEY = Buffer.from(KEY_BASE64, 'base64');
if (KEY.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64)');

export function encryptText(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptText(payloadB64) {
  if (!payloadB64) return null;
  const data = Buffer.from(payloadB64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

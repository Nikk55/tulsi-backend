import crypto from "crypto";

const KEY_BASE64 = process.env.ENCRYPTION_KEY;

if (!KEY_BASE64) {
  console.error("❌ ENCRYPTION_KEY NOT FOUND — Check Railway Variables");
  throw new Error("ENCRYPTION_KEY missing");
}

const KEY = Buffer.from(KEY_BASE64, "base64");

export function encryptText(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");
  return `${iv.toString("base64")}:${encrypted}:${tag}`;
}

export function decryptText(data) {
  const [ivStr, encrypted, tagStr] = data.split(":");
  const iv = Buffer.from(ivStr, "base64");
  const tag = Buffer.from(tagStr, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

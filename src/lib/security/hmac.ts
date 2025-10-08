import crypto from 'crypto';

/**
 * Generates an HMAC-SHA256 signature for webhook verification
 * @param timestamp - The timestamp from the request header
 * @param rawBody - The raw request body as a string
 * @returns The computed HMAC signature as a hex string
 */
export function generateSignature(timestamp: string, rawBody: string): string {
  const secret = process.env.INGEST_WEBHOOK_SECRET;
  
  if (!secret) {
    throw new Error('INGEST_WEBHOOK_SECRET environment variable is not set');
  }
  
  const message = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  
  return hmac.digest('hex');
}

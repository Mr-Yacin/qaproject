import crypto from 'crypto';

/**
 * Performs a timing-safe comparison of two strings
 * Prevents timing attacks by ensuring comparison takes constant time
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  // Handle length differences safely by padding to same length
  // This prevents timing attacks based on early exit for different lengths
  if (a.length !== b.length) {
    // Create buffers of equal length to ensure constant-time comparison
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.alloc(bufferA.length);
    bufferB.write(b);
    
    // This will always return false for different lengths
    // but takes constant time
    try {
      crypto.timingSafeEqual(bufferA, bufferB);
      return false;
    } catch {
      return false;
    }
  }
  
  // For equal length strings, perform timing-safe comparison
  try {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

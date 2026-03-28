/**
 * Utility for exponential backoff retries.
 * Used to handle 429 (Rate Limit) errors gracefully.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
      
      if (!isRateLimit || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 2s, 4s, 8s...
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

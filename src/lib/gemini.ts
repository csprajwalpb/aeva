import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Safe retry helper on 429 (Rate Limit) and 503 (Overloaded/Service Unavailable)
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000,
  factor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = error.message || '';
    const status = error.status || 
      (errorStr.includes('429') ? 429 : errorStr.includes('503') ? 503 : null);
    
    const isRetryable = 
      status === 429 || 
      status === 503 || 
      errorStr.includes('ResourceExhausted') || 
      errorStr.includes('ServiceUnavailable') ||
      errorStr.includes('overloaded');

    if (retries > 0 && isRetryable) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Gemini API] Retryable error encountered (${errorStr.slice(0, 80)}...). ` +
          `Retrying in ${delay}ms... (${retries} attempts remaining)`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * factor, factor);
    }
    throw error;
  }
}

// Model Initializer Factory
export function getGeminiModel(apiKey: string, systemInstruction?: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  });
}

// Central server-side developer logger
export function logServerError(context: string, error: any) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[AEVA SERVER ERROR] ${context}:`, error);
  }
}

// User-friendly error message compiler
export function getFriendlyErrorMessage(error: any): string {
  const errorStr = error.message || '';
  
  if (errorStr.includes('429') || errorStr.includes('ResourceExhausted')) {
    return 'Aeva is currently receiving too many requests. Please wait a brief moment before sending another message.';
  }
  if (errorStr.includes('503') || errorStr.includes('ServiceUnavailable') || errorStr.includes('overloaded')) {
    return 'Aeva services are temporarily overloaded. We retried connecting 3 times, but the server is still busy. Please try again shortly.';
  }
  if (errorStr.includes('API_KEY') || errorStr.includes('API key not valid') || errorStr.includes('API key')) {
    return 'Configuration Error: The Gemini API Key is missing or invalid. Please check the server environment variables.';
  }
  if (errorStr.includes('safety') || errorStr.includes('blocked') || errorStr.includes('SAFE')) {
    return 'Your request was flagged and blocked by Google safety filters. Please revise your query to proceed.';
  }
  
  return 'An unexpected communication error occurred with the AI core. Please try again.';
}

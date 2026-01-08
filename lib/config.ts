import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Vercel (optional)
  VERCEL: z.string().optional(),
  NEXT_PHASE: z.string().optional(),
});

/**
 * Validated environment variables
 */
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment variable validation failed:', error.errors);
    // In development, allow partial config
    if (process.env.NODE_ENV === 'development') {
      env = process.env as z.infer<typeof envSchema>;
    } else {
      throw new Error('Invalid environment variables');
    }
  } else {
    throw error;
  }
}

/**
 * Application configuration
 */
export const config = {
  /**
   * Environment
   */
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  /**
   * Supabase configuration
   */
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },

  /**
   * NextAuth configuration
   */
  nextAuth: {
    url: env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: env.NEXTAUTH_SECRET,
  },

  /**
   * API configuration
   */
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  /**
   * Pagination defaults
   */
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 1000,
  },

  /**
   * Feature flags
   */
  features: {
    offlineMode: true,
    csvImport: true,
    locationTracking: true,
  },
} as const;

/**
 * Type-safe environment variable access
 */
export function getEnv(key: keyof typeof env): string | undefined {
  return env[key];
}


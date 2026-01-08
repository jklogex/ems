import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found. Using fallback client.');
}

/**
 * Client-side Supabase client (for use in client components)
 * This uses the anon key and relies on RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client with SSR support
 * This properly handles cookies and session management
 * Only use this in Server Components or API routes
 */
export async function getSupabaseServerClient() {
  // Dynamically import cookies only in server context
  const { cookies } = await import('next/headers');
  type ResponseCookie = Parameters<ReturnType<typeof cookies>['set']>[2];
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Partial<ResponseCookie> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Ignore cookie errors during SSR
          // This can happen during static generation
        }
      },
    },
  });
}

/**
 * Server-side Supabase client with service role key
 * Use this for operations that need elevated permissions (bypass RLS)
 * Only use in API routes, never expose to client
 */
export function getSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // During build time on Vercel, allow build to proceed with fallback
    if (process.env.VERCEL && process.env.NEXT_PHASE === 'phase-production-build') {
      return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getSupabaseServiceClient() instead
 */
export const getSupabaseServerClientLegacy = getSupabaseServiceClient;

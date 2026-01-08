import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSupabaseServiceClient } from "./db/client";
import type { UserRole } from "./db/types";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use service role client to bypass RLS for authentication
          const supabase = getSupabaseServiceClient();

          // Get user from database
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            console.error('User not found or error:', error);
            return null;
          }

          // Verify password if password_hash exists
          if (user.password_hash) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              user.password_hash
            );
            
            if (!isValidPassword) {
              console.error('Invalid password for user:', credentials.email);
              return null;
            }
          } else {
            // If no password_hash is set, allow login (for backward compatibility)
            // In production, you should require password_hash for all users
            console.warn(`User ${user.email} has no password_hash set`);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            region: user.region,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.region = user.region;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.region = token.region as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};

// Middleware for role-based access control
export function requireRole(allowedRoles: UserRole[]) {
  return (role: UserRole | undefined): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };
}

// Role hierarchy for access control
export const rolePermissions: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'coordinator_national', 'coordinator_regional', 'technician', 'warehouse', 'auditor'],
  coordinator_national: ['coordinator_national', 'coordinator_regional', 'technician', 'warehouse', 'auditor'],
  coordinator_regional: ['coordinator_regional', 'technician', 'warehouse', 'auditor'],
  technician: ['technician'],
  warehouse: ['warehouse'],
  auditor: ['auditor'],
};


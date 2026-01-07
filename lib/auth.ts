import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./db/client";
import type { UserRole } from "./db/types";

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

        // In production, use proper password hashing and verification
        // For now, this is a placeholder that checks against the database
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          return null;
        }

        // TODO: Implement proper password verification
        // For now, accept any password if user exists
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          region: user.region,
        };
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


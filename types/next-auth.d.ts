import { UserRole } from '@/lib/db/types';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      region: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    region: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    region: string | null;
  }
}


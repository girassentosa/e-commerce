/**
 * NextAuth Type Extensions
 * Extend default NextAuth types dengan custom user properties
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    avatarUrl?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      avatarUrl?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    avatarUrl?: string | null;
  }
}


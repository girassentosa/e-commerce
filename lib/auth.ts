/**
 * NextAuth Configuration
 * Authentication setup dengan Prisma adapter
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return user object (without password hash)
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  callbacks: {
    async signIn({ user }) {
      // Allow sign in
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in - store user data
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName || null;
        token.lastName = user.lastName || null;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl || null;
      }

      // When session is updated (e.g., after profile update)
      // Re-fetch fresh user data from database
      if (trigger === 'update' && token.id) {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              avatarUrl: true,
            },
          });

          if (updatedUser) {
            token.email = updatedUser.email;
            token.firstName = updatedUser.firstName || null;
            token.lastName = updatedUser.lastName || null;
            token.role = updatedUser.role;
            token.avatarUrl = updatedUser.avatarUrl || null;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // After sign in, redirect based on user role
      // Check if redirecting after sign in
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default redirect to base URL
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};


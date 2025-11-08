/**
 * Login Page
 * User login page
 */

import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: `Login | ${APP_NAME}`,
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return (
    <div className="min-h-[100vh] min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <Link href="/" className="flex justify-center">
          <div className="text-4xl font-bold text-indigo-600">
            🛍️
          </div>
        </Link>
        
        {/* Title */}
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back! Please enter your details.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}


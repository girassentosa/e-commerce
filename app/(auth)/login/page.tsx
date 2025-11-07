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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <LoginForm />
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            🔐 Demo Credentials:
          </p>
          <div className="space-y-1 text-xs text-blue-800">
            <p>
              <strong>Customer:</strong> customer@example.com / password123
            </p>
            <p>
              <strong>Admin:</strong> admin@ecommerce.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


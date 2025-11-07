/**
 * Register Form Component
 * Form untuk user registration dengan validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema } from '@/lib/validations/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import axios from 'axios';

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = registerSchema.parse(formData);

      // Call register API
      const response = await axios.post('/api/auth/register', {
        email: validatedData.email,
        password: validatedData.password,
        confirmPassword: validatedData.confirmPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      if (response.data.success) {
        toast.success('Account created successfully! Please sign in.');
        // Redirect to login page
        router.push('/login');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set validation errors
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (axios.isAxiosError(error)) {
        // Handle API errors
        const message = error.response?.data?.error || 'Failed to create account';
        toast.error(message);
        setErrors({ submit: message });
      } else {
        toast.error('An unexpected error occurred');
        setErrors({ submit: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Fields Row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          name="firstName"
          id="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          placeholder="John"
          fullWidth
          disabled={isLoading}
        />

        <Input
          label="Last Name"
          type="text"
          name="lastName"
          id="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          placeholder="Doe"
          fullWidth
          disabled={isLoading}
        />
      </div>

      {/* Email Input */}
      <Input
        label="Email Address"
        type="email"
        name="email"
        id="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="you@example.com"
        required
        fullWidth
        disabled={isLoading}
      />

      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        name="password"
        id="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="••••••••"
        helperText="Must be at least 6 characters"
        required
        fullWidth
        disabled={isLoading}
      />

      {/* Confirm Password Input */}
      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        id="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="••••••••"
        required
        fullWidth
        disabled={isLoading}
      />

      {/* Terms & Conditions */}
      <div className="flex items-start">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
          I agree to the{' '}
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
            Terms and Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </Link>
        </label>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}


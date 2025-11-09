'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSaveAction } from '@/contexts/SaveActionContext';

function PasswordPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const saveAction = useSaveAction();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Set save action for header
  useEffect(() => {
    saveAction.setOnSave(() => handleSave);
    return () => saveAction.setOnSave(null);
  }, [formData, showPasswords, isSaving, errors]);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Password lama harus diisi';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password baru minimal 8 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Ulangi password baru harus diisi';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password baru tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is ready to save
  // Button "Simpan" hanya muncul jika semua field (password lama, password baru, ulangi password baru) sudah terisi
  const isFormReady = () => {
    // Button hanya muncul jika SEMUA field sudah terisi (tidak ada yang kosong)
    // Tidak perlu menunggu validasi, cukup pastikan semua field terisi
    return (
      formData.oldPassword.trim() !== '' &&
      formData.newPassword.trim() !== '' &&
      formData.confirmPassword.trim() !== ''
    );
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password berhasil diubah');
        // Reset form
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});
      } else {
        toast.error(data.error || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Gagal mengubah password');
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/account/password');
    return null;
  }

  return (
    <div className="container mx-auto px-4 pt-0 pb-8">
      <div className="-mt-2">
        {/* Password Form Card - Full Width */}
      <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          {/* Form Fields */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            <div className="space-y-4">
              {/* Masukkan Password Lama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masukkan Password Lama
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.oldPassword ? 'text' : 'password'}
                    value={formData.oldPassword}
                    onChange={(e) => handleInputChange('oldPassword', e.target.value)}
                    placeholder="Masukkan password lama Anda"
                    className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.oldPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('oldPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.oldPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
                )}
              </div>

              {/* Masukkan Password Baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masukkan Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.newPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Masukkan password baru (minimal 8 karakter)"
                    className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.newPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Ulangi Password Baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ulangi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Ulangi password baru"
                    className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <Suspense fallback={null}>
      <PasswordPageContent />
    </Suspense>
  );
}


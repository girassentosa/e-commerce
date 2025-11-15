'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  Settings,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  Mail,
  Search,
  Shield,
  Loader2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

type SettingCategory = 'general' | 'product' | 'order' | 'payment' | 'shipping' | 'email' | 'seo';

interface SettingsData {
  // General
  storeName?: string;
  storeDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  storeAddress?: string;
  currency?: string;
  timezone?: string;
  
  // Product
  defaultLowStockThreshold?: number;
  productsPerPage?: number;
  autoHideOutOfStock?: boolean;
  
  // Order
  autoCancelPendingDays?: number;
  allowOrderCancellation?: boolean;
  minimumOrderAmount?: number;
  
  // Payment
  paymentTimeoutHours?: number;
  
  // Shipping
  freeShippingThreshold?: number;
  defaultShippingCost?: number;
  
  // Email
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  fromEmail?: string;
  fromName?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
}

const tabs: Array<{ id: SettingCategory; label: string; icon: any }> = [
  { id: 'general', label: 'Umum', icon: Store },
  { id: 'product', label: 'Produk', icon: Package },
  { id: 'order', label: 'Pesanan', icon: ShoppingBag },
  { id: 'payment', label: 'Pembayaran', icon: CreditCard },
  { id: 'shipping', label: 'Pengiriman', icon: Truck },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'seo', label: 'SEO', icon: Search },
];

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setHeader } = useAdminHeader();
  const [activeTab, setActiveTab] = useState<SettingCategory>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({});

  useEffect(() => {
    setHeader(Settings, 'Pengaturan');
  }, [setHeader]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/settings');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      const settingsMap = data.data.map || {};
      console.log('[Settings] Fetched settings from API:', settingsMap);
      console.log('[Settings] Currency value:', settingsMap.currency);
      
      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(error.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('[Settings] Saving settings:', settings);
      console.log('[Settings] Currency to save:', settings.currency);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }

      console.log('[Settings] Save response:', data);

      // Verify the save by fetching again
      const verifyResponse = await fetch('/api/admin/settings?category=general');
      const verifyData = await verifyResponse.json();
      console.log('[Settings] Verification - Currency in DB:', verifyData.data?.map?.currency);

      // Clear client-side cache and trigger refresh
      if (typeof window !== 'undefined') {
        // Clear settings cache
        const { clearSettingsCache } = await import('@/lib/settings');
        clearSettingsCache();
        
        // Dispatch custom event to notify all useCurrency hooks to refresh
        window.dispatchEvent(new Event('settingsUpdated'));
        
        // Small delay before reload to ensure cache is cleared
        setTimeout(() => {
          // Trigger page reload to refresh currency in all components
          // This ensures all pages (homepage, products, cart) get the new currency
          window.location.reload();
        }, 100);
      }

      toast.success('Pengaturan berhasil disimpan!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  const ActiveTabIcon = tabs.find((t) => t.id === activeTab)?.icon || Settings;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Pengaturan
          </h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">
            Konfigurasi pengaturan dan preferensi toko Anda
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-card">
        <div className="border-b border-gray-200">
          <div className="admin-settings-tabs-container flex gap-2 p-4 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    admin-no-animation flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-normal text-sm whitespace-nowrap flex-shrink-0
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  style={{ transform: 'none', transition: 'color 0.15s ease, background-color 0.15s ease' }}
                >
                  <TabIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-gray-600" />
                  Informasi Toko
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Toko *
                    </label>
                    <Input
                      type="text"
                      value={settings.storeName || ''}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      placeholder="Nama Toko Saya"
                    />
                    <p className="text-xs text-gray-500 mt-1">Digunakan di judul browser dan meta tag</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mata Uang *
                    </label>
                    <Input
                      type="text"
                      value={settings.currency || 'USD'}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      placeholder="USD, IDR, EUR, dll."
                    />
                    <p className="text-xs text-gray-500 mt-1">Kode mata uang (contoh: USD, IDR, EUR). Mempengaruhi semua harga produk.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi Toko
                    </label>
                    <textarea
                      value={settings.storeDescription || ''}
                      onChange={(e) => handleChange('storeDescription', e.target.value)}
                      placeholder="Jelaskan toko Anda..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Digunakan di meta description untuk SEO</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Settings */}
          {activeTab === 'product' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  Manajemen Produk
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batas Stok Rendah Default
                    </label>
                    <Input
                      type="number"
                      value={settings.defaultLowStockThreshold || 10}
                      onChange={(e) => handleChange('defaultLowStockThreshold', parseInt(e.target.value) || 10)}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Peringatan ketika stok turun di bawah angka ini</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produk Per Halaman
                    </label>
                    <Input
                      type="number"
                      value={settings.productsPerPage || 20}
                      onChange={(e) => handleChange('productsPerPage', parseInt(e.target.value) || 20)}
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Jumlah produk yang ditampilkan per halaman</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoHideOutOfStock || false}
                        onChange={(e) => handleChange('autoHideOutOfStock', e.target.checked)}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Sembunyikan produk yang habis secara otomatis
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Settings */}
          {activeTab === 'order' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  Manajemen Pesanan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batalkan Pesanan Tertunda Otomatis (Hari)
                    </label>
                    <Input
                      type="number"
                      value={settings.autoCancelPendingDays || 7}
                      onChange={(e) => handleChange('autoCancelPendingDays', parseInt(e.target.value) || 7)}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Batalkan pesanan setelah X hari jika belum dibayar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Pesanan Minimum
                    </label>
                    <Input
                      type="number"
                      value={settings.minimumOrderAmount || 0}
                      onChange={(e) => handleChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum jumlah pesanan yang diperbolehkan</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowOrderCancellation || false}
                        onChange={(e) => handleChange('allowOrderCancellation', e.target.checked)}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Izinkan pelanggan membatalkan pesanan
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  Konfigurasi Pembayaran
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batas Waktu Pembayaran (Jam)
                    </label>
                    <Input
                      type="number"
                      value={settings.paymentTimeoutHours || 24}
                      onChange={(e) => handleChange('paymentTimeoutHours', parseInt(e.target.value) || 24)}
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Batalkan pesanan jika pembayaran tidak diterima dalam waktu ini</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  Konfigurasi Pengiriman
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batas Gratis Ongkir
                    </label>
                    <Input
                      type="number"
                      value={settings.freeShippingThreshold || 0}
                      onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Gratis ongkir untuk pesanan di atas jumlah ini</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biaya Pengiriman Default
                    </label>
                    <Input
                      type="number"
                      value={settings.defaultShippingCost || 0}
                      onChange={(e) => handleChange('defaultShippingCost', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Biaya pengiriman standar yang digunakan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600" />
                  Konfigurasi Email
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Host SMTP
                    </label>
                    <Input
                      type="text"
                      value={settings.smtpHost || ''}
                      onChange={(e) => handleChange('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port SMTP
                    </label>
                    <Input
                      type="number"
                      value={settings.smtpPort || 587}
                      onChange={(e) => handleChange('smtpPort', parseInt(e.target.value) || 587)}
                      min="1"
                      max="65535"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username SMTP
                    </label>
                    <Input
                      type="text"
                      value={settings.smtpUser || ''}
                      onChange={(e) => handleChange('smtpUser', e.target.value)}
                      placeholder="email-anda@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Pengirim
                    </label>
                    <Input
                      type="email"
                      value={settings.fromEmail || ''}
                      onChange={(e) => handleChange('fromEmail', e.target.value)}
                      placeholder="noreply@toko.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Pengirim
                    </label>
                    <Input
                      type="text"
                      value={settings.fromName || ''}
                      onChange={(e) => handleChange('fromName', e.target.value)}
                      placeholder="Nama Toko Saya"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-600" />
                  Konfigurasi SEO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title Default
                    </label>
                    <Input
                      type="text"
                      value={settings.metaTitle || ''}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      placeholder="Toko Saya - Produk Terbaik Online"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description Default
                    </label>
                    <textarea
                      value={settings.metaDescription || ''}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      placeholder="Beli produk terbaik secara online..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Google Analytics
                    </label>
                    <Input
                      type="text"
                      value={settings.googleAnalyticsId || ''}
                      onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-normal rounded-lg sm:rounded-xl shadow-md !transition-colors !duration-150 py-2.5 sm:py-3 px-6 sm:px-8"
          style={{ transform: 'none' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              <span className="text-sm sm:text-base">Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Simpan Pengaturan</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


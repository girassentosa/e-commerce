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
  { id: 'general', label: 'General', icon: Store },
  { id: 'product', label: 'Products', icon: Package },
  { id: 'order', label: 'Orders', icon: ShoppingBag },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
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
    setHeader(Settings, 'Settings');
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

      setSettings(data.data.map || {});
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(error.message || 'Failed to load settings');
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
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
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
            Settings
          </h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">
            Configure your store settings and preferences
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
                  Store Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <Input
                      type="text"
                      value={settings.storeName || ''}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      placeholder="My Store"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <Input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder="contact@store.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <Input
                      type="tel"
                      value={settings.contactPhone || ''}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <Input
                      type="text"
                      value={settings.currency || 'IDR'}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      placeholder="IDR"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Description
                    </label>
                    <textarea
                      value={settings.storeDescription || ''}
                      onChange={(e) => handleChange('storeDescription', e.target.value)}
                      placeholder="Describe your store..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Address
                    </label>
                    <textarea
                      value={settings.storeAddress || ''}
                      onChange={(e) => handleChange('storeAddress', e.target.value)}
                      placeholder="Store address..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
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
                  Product Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Low Stock Threshold
                    </label>
                    <Input
                      type="number"
                      value={settings.defaultLowStockThreshold || 10}
                      onChange={(e) => handleChange('defaultLowStockThreshold', parseInt(e.target.value) || 10)}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Products Per Page
                    </label>
                    <Input
                      type="number"
                      value={settings.productsPerPage || 20}
                      onChange={(e) => handleChange('productsPerPage', parseInt(e.target.value) || 20)}
                      min="1"
                      max="100"
                    />
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
                        Automatically hide out of stock products
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
                  Order Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-cancel Pending Orders (Days)
                    </label>
                    <Input
                      type="number"
                      value={settings.autoCancelPendingDays || 7}
                      onChange={(e) => handleChange('autoCancelPendingDays', parseInt(e.target.value) || 7)}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cancel orders after X days if unpaid</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount
                    </label>
                    <Input
                      type="number"
                      value={settings.minimumOrderAmount || 0}
                      onChange={(e) => handleChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
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
                        Allow customers to cancel orders
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
                  Payment Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Timeout (Hours)
                    </label>
                    <Input
                      type="number"
                      value={settings.paymentTimeoutHours || 24}
                      onChange={(e) => handleChange('paymentTimeoutHours', parseInt(e.target.value) || 24)}
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cancel order if payment not received within this time</p>
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
                  Shipping Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Shipping Threshold
                    </label>
                    <Input
                      type="number"
                      value={settings.freeShippingThreshold || 0}
                      onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Free shipping for orders above this amount</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Shipping Cost
                    </label>
                    <Input
                      type="number"
                      value={settings.defaultShippingCost || 0}
                      onChange={(e) => handleChange('defaultShippingCost', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
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
                  Email Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
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
                      SMTP Port
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
                      SMTP Username
                    </label>
                    <Input
                      type="text"
                      value={settings.smtpUser || ''}
                      onChange={(e) => handleChange('smtpUser', e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <Input
                      type="email"
                      value={settings.fromEmail || ''}
                      onChange={(e) => handleChange('fromEmail', e.target.value)}
                      placeholder="noreply@store.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <Input
                      type="text"
                      value={settings.fromName || ''}
                      onChange={(e) => handleChange('fromName', e.target.value)}
                      placeholder="My Store"
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
                  SEO Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Meta Title
                    </label>
                    <Input
                      type="text"
                      value={settings.metaTitle || ''}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      placeholder="My Store - Best Products Online"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Meta Description
                    </label>
                    <textarea
                      value={settings.metaDescription || ''}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      placeholder="Shop the best products online..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Analytics ID
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
              <span className="text-sm sm:text-base">Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Save Settings</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


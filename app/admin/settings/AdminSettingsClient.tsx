'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  Mail,
  Search,
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useNotification } from '@/contexts/NotificationContext';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

type SettingCategory = 'general' | 'product' | 'order' | 'payment' | 'shipping' | 'email' | 'seo';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'COD' | 'CREDIT_CARD';
  fee: number;
  isActive: boolean;
  description?: string;
}

interface SettingsData {
  storeName?: string;
  storeDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency?: string;
  defaultLowStockThreshold?: number;
  productsPerPage?: number;
  autoCancelPendingDays?: number;
  minimumOrderAmount?: number;
  paymentTimeoutHours?: number;
  paymentMethods?: PaymentMethod[];
  freeShippingThreshold?: number;
  defaultShippingCost?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  fromEmail?: string;
  fromName?: string;
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
}

const tabs: Array<{ id: SettingCategory; label: string; icon: React.ComponentType<any> }> = [
  { id: 'general', label: 'Umum', icon: Store },
  { id: 'product', label: 'Produk', icon: Package },
  { id: 'order', label: 'Pesanan', icon: ShoppingBag },
  { id: 'payment', label: 'Pembayaran', icon: CreditCard },
  { id: 'shipping', label: 'Pengiriman', icon: Truck },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'seo', label: 'SEO', icon: Search },
];

export default function AdminSettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const { setHeader } = useAdminHeader();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<SettingCategory>('general');
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentTimeoutUnit, setPaymentTimeoutUnit] = useState<'minutes' | 'hours'>(
    (initialSettings.paymentTimeoutHours ?? 24) >= 24 ? 'hours' : 'minutes'
  );
  const [paymentTimeoutValue, setPaymentTimeoutValue] = useState<number>(
    (initialSettings.paymentTimeoutHours ?? 24) >= 24
      ? initialSettings.paymentTimeoutHours ?? 24
      : (initialSettings.paymentTimeoutHours ?? 24) * 60
  );
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    setHeader(SettingsIcon, 'Pengaturan');
  }, [setHeader]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }
      setSettings(data.data);
    } catch (error: any) {
      console.error(error);
      showError('Gagal', error.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...settings,
        paymentTimeoutHours: paymentTimeoutUnit === 'hours' ? paymentTimeoutValue : paymentTimeoutValue / 60,
      };
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }
      showSuccess('Berhasil', 'Pengaturan berhasil disimpan');
      fetchSettings();
    } catch (error: any) {
      console.error(error);
      showError('Gagal', error.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentMethodModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingPaymentMethod(method);
    } else {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      setEditingPaymentMethod({
        id,
        name: '',
        type: 'VIRTUAL_ACCOUNT',
        fee: 0,
        isActive: true,
      });
    }
    setPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodChange = (field: keyof PaymentMethod, value: any) => {
    setEditingPaymentMethod((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handlePaymentMethodSave = () => {
    if (!editingPaymentMethod) return;
    setSettings((prev) => {
      const methods = [...(prev.paymentMethods || [])];
      const index = methods.findIndex((method) => method.id === editingPaymentMethod.id);
      if (index >= 0) {
        methods[index] = editingPaymentMethod;
      } else {
        methods.push(editingPaymentMethod);
      }
      return { ...prev, paymentMethods: methods };
    });
    setPaymentMethodModalOpen(false);
    setEditingPaymentMethod(null);
  };

  const handlePaymentMethodDelete = (id: string) => {
    updateSetting(
      'paymentMethods',
      (settings.paymentMethods || []).filter((method) => method.id !== id)
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="grid gap-4">
            <Input
              label="Nama Toko"
              value={settings.storeName || ''}
              onChange={(e) => updateSetting('storeName', e.target.value)}
            />
            <Input
              label="Deskripsi Toko"
              value={settings.storeDescription || ''}
              onChange={(e) => updateSetting('storeDescription', e.target.value)}
            />
            <Input
              label="Email Kontak"
              value={settings.contactEmail || ''}
              onChange={(e) => updateSetting('contactEmail', e.target.value)}
            />
            <Input
              label="No. Telepon"
              value={settings.contactPhone || ''}
              onChange={(e) => updateSetting('contactPhone', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.currency || 'IDR'}
                onChange={(e) => updateSetting('currency', e.target.value)}
              >
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="MYR">MYR - Malaysian Ringgit</option>
              </select>
            </div>
          </div>
        );
      case 'product':
        return (
          <div className="grid gap-4">
            <Input
              label="Ambang Stok Rendah"
              type="number"
              value={settings.defaultLowStockThreshold ?? 0}
              onChange={(e) => updateSetting('defaultLowStockThreshold', Number(e.target.value))}
            />
            <Input
              label="Produk per Halaman"
              type="number"
              value={settings.productsPerPage ?? 12}
              onChange={(e) => updateSetting('productsPerPage', Number(e.target.value))}
            />
          </div>
        );
      case 'order':
        return (
          <div className="grid gap-4">
            <Input
              label="Batas Hari Auto-Cancel"
              type="number"
              value={settings.autoCancelPendingDays ?? 3}
              onChange={(e) => updateSetting('autoCancelPendingDays', Number(e.target.value))}
            />
            <Input
              label="Minimum Order"
              type="number"
              value={settings.minimumOrderAmount ?? 0}
              onChange={(e) => updateSetting('minimumOrderAmount', Number(e.target.value))}
            />
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batas Waktu Pembayaran</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={paymentTimeoutValue}
                  onChange={(e) => setPaymentTimeoutValue(Number(e.target.value))}
                />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={paymentTimeoutUnit}
                  onChange={(e) => setPaymentTimeoutUnit(e.target.value as 'minutes' | 'hours')}
                >
                  <option value="minutes">Menit</option>
                  <option value="hours">Jam</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Metode Pembayaran</p>
                <Button type="button" size="sm" onClick={() => openPaymentMethodModal()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Metode
                </Button>
              </div>
              <div className="space-y-3">
                {(settings.paymentMethods || []).map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.type}</p>
                      <p className="text-xs text-gray-500">
                        {method.isActive ? 'Aktif' : 'Tidak aktif'} • Fee: {method.fee}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openPaymentMethodModal(method)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handlePaymentMethodDelete(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="grid gap-4">
            <Input
              label="Gratis Ongkir (di atas)"
              type="number"
              value={settings.freeShippingThreshold ?? 0}
              onChange={(e) => updateSetting('freeShippingThreshold', Number(e.target.value))}
            />
            <Input
              label="Biaya Pengiriman Default"
              type="number"
              value={settings.defaultShippingCost ?? 0}
              onChange={(e) => updateSetting('defaultShippingCost', Number(e.target.value))}
            />
          </div>
        );
      case 'email':
        return (
          <div className="grid gap-4">
            <Input
              label="SMTP Host"
              value={settings.smtpHost || ''}
              onChange={(e) => updateSetting('smtpHost', e.target.value)}
            />
            <Input
              label="SMTP Port"
              type="number"
              value={settings.smtpPort ?? 587}
              onChange={(e) => updateSetting('smtpPort', Number(e.target.value))}
            />
            <Input
              label="SMTP User"
              value={settings.smtpUser || ''}
              onChange={(e) => updateSetting('smtpUser', e.target.value)}
            />
            <Input
              label="Email Pengirim"
              value={settings.fromEmail || ''}
              onChange={(e) => updateSetting('fromEmail', e.target.value)}
            />
            <Input
              label="Nama Pengirim"
              value={settings.fromName || ''}
              onChange={(e) => updateSetting('fromName', e.target.value)}
              placeholder="Contoh: Toko Online"
            />
          </div>
        );
      case 'seo':
        return (
          <div className="grid gap-4">
            <Input
              label="Meta Title"
              value={settings.metaTitle || ''}
              onChange={(e) => updateSetting('metaTitle', e.target.value)}
            />
            <Input
              label="Meta Description"
              value={settings.metaDescription || ''}
              onChange={(e) => updateSetting('metaDescription', e.target.value)}
            />
            <Input
              label="Google Analytics ID"
              value={settings.googleAnalyticsId || ''}
              onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                Pengaturan Toko
              </h1>
              <p className="text-sm text-gray-600">
                Kelola informasi toko, pembayaran, pengiriman, dan pengaturan lainnya.
              </p>
            </div>
            <Button type="button" onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-3 overflow-x-auto pb-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-6">{loading ? <Loader size="lg" /> : renderTabContent()}</div>
        </div>
      </div>

      {paymentMethodModalOpen && editingPaymentMethod && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h2>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setPaymentMethodModalOpen(false);
                  setEditingPaymentMethod(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Input
              label="Nama Metode"
              value={editingPaymentMethod.name}
              onChange={(e) => handlePaymentMethodChange('name', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={editingPaymentMethod.type}
                onChange={(e) =>
                  handlePaymentMethodChange('type', e.target.value as PaymentMethod['type'])
                }
              >
                <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
                <option value="QRIS">QRIS</option>
                <option value="COD">COD</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
              </select>
            </div>
            <Input
              label="Biaya Tambahan"
              type="number"
              value={editingPaymentMethod.fee}
              onChange={(e) => handlePaymentMethodChange('fee', Number(e.target.value))}
            />
            <Input
              label="Deskripsi"
              value={editingPaymentMethod.description || ''}
              onChange={(e) => handlePaymentMethodChange('description', e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editingPaymentMethod.isActive}
                onChange={(e) => handlePaymentMethodChange('isActive', e.target.checked)}
              />
              Aktifkan metode ini
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPaymentMethodModalOpen(false);
                  setEditingPaymentMethod(null);
                }}
              >
                Batal
              </Button>
              <Button type="button" onClick={handlePaymentMethodSave}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


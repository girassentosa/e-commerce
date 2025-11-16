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
  X,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useCurrency } from '@/hooks/useCurrency';

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
  productWarranty?: Record<string, Array<{ title: string; description: string }>>;
  deliveryGuaranteeTitle?: string;
  deliveryGuaranteeDescription?: string;
  
  // Order
  autoCancelPendingDays?: number;
  allowOrderCancellation?: boolean;
  minimumOrderAmount?: number;
  
  // Payment
  paymentTimeoutHours?: number;
  paymentMethods?: Array<{
    id: string;
    name: string;
    type: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'COD' | 'CREDIT_CARD';
    fee: number; // negative = potongan, positive = tambahan
    isActive: boolean;
    description?: string;
    icon?: string;
  }>;
  
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
  const { formatPrice } = useCurrency();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<SettingCategory>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({});
  const [products, setProducts] = useState<Array<{ id: string; name: string; imageUrl: string | null }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [warrantyModalTab, setWarrantyModalTab] = useState<'product' | 'delivery'>('product');
  const [toggledProducts, setToggledProducts] = useState<Set<string>>(new Set());
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<{
    id: string;
    name: string;
    type: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'COD' | 'CREDIT_CARD';
    fee: number;
    isActive: boolean;
    description?: string;
    icon?: string;
  } | null>(null);
  const [shippingProducts, setShippingProducts] = useState<Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    freeShippingThreshold: number | null;
    defaultShippingCost: number | null;
  }>>([]);
  const [loadingShippingProducts, setLoadingShippingProducts] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [editingShippingProduct, setEditingShippingProduct] = useState<{
    id: string;
    name: string;
    freeShippingThreshold: number | null;
    defaultShippingCost: number | null;
  } | null>(null);
  const [shippingToggledProducts, setShippingToggledProducts] = useState<Set<string>>(new Set());
  const [paymentTimeoutUnit, setPaymentTimeoutUnit] = useState<'minutes' | 'hours'>('minutes');
  const [paymentTimeoutValue, setPaymentTimeoutValue] = useState<number>(1440); // Default 1440 menit (24 jam)
  const [gridStyle, setGridStyle] = useState<React.CSSProperties>({
    gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
    gridAutoFlow: 'column',
    gridTemplateRows: 'repeat(3, auto)',
  });

  useEffect(() => {
    setHeader(Settings, 'Pengaturan');
  }, [setHeader]);

  // Set grid style based on screen size
  useEffect(() => {
    const updateGridStyle = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        // Desktop: 3 columns x 2 rows
        setGridStyle({
          gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(2, auto)',
          alignItems: 'start',
        });
      } else if (width >= 640) {
        // Tablet: 3 columns x 3 rows
        setGridStyle({
          gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(3, auto)',
          alignItems: 'start',
        });
      } else {
        // Mobile: 2 columns x 3 rows
        setGridStyle({
          gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(3, auto)',
          alignItems: 'start',
        });
      }
    };

    updateGridStyle();
    window.addEventListener('resize', updateGridStyle);
    return () => window.removeEventListener('resize', updateGridStyle);
  }, []);

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

  useEffect(() => {
    if (status === 'authenticated' && activeTab === 'product') {
      fetchProducts();
    }
  }, [status, activeTab]);

  useEffect(() => {
    if (status === 'authenticated' && activeTab === 'shipping') {
      fetchShippingProducts();
    }
  }, [status, activeTab]);

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
      
      // Parse productWarranty if it exists
      if (settingsMap.productWarranty && typeof settingsMap.productWarranty === 'string') {
        try {
          settingsMap.productWarranty = JSON.parse(settingsMap.productWarranty);
        } catch (e) {
          console.error('Error parsing productWarranty:', e);
          settingsMap.productWarranty = {};
        }
      }
      
      // Parse paymentMethods if it exists
      if (settingsMap.paymentMethods && typeof settingsMap.paymentMethods === 'string') {
        try {
          settingsMap.paymentMethods = JSON.parse(settingsMap.paymentMethods);
        } catch (e) {
          console.error('Error parsing paymentMethods:', e);
          settingsMap.paymentMethods = [];
        }
      }
      
      // Handle paymentTimeoutHours - convert from minutes to display value
      if (settingsMap.paymentTimeoutHours !== undefined) {
        const timeoutMinutes = settingsMap.paymentTimeoutHours; // Value in database is in minutes
        // Default display in minutes
        setPaymentTimeoutUnit('minutes');
        setPaymentTimeoutValue(timeoutMinutes);
      } else {
        // Default: 1440 menit (24 jam)
        setPaymentTimeoutUnit('minutes');
        setPaymentTimeoutValue(1440);
      }
      
      // Initialize default payment methods if empty
      if (!settingsMap.paymentMethods || !Array.isArray(settingsMap.paymentMethods) || settingsMap.paymentMethods.length === 0) {
        const defaultPaymentMethods = [
          {
            id: 'COD',
            name: 'Bayar di Tempat (COD)',
            type: 'COD',
            fee: 0,
            isActive: true,
            description: 'Pembayaran dilakukan saat pesanan diterima',
          },
          {
            id: 'QRIS',
            name: 'QRIS',
            type: 'QRIS',
            fee: 0,
            isActive: true,
            description: 'Scan QR Indonesia Standard untuk pembayaran instan',
          },
          {
            id: 'BCA',
            name: 'BCA Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank BCA',
          },
          {
            id: 'MANDIRI',
            name: 'Mandiri Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank Mandiri',
          },
          {
            id: 'BNI',
            name: 'BNI Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank BNI',
          },
          {
            id: 'BRI',
            name: 'BRI Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank BRI',
          },
          {
            id: 'BSI',
            name: 'BSI Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank BSI',
          },
          {
            id: 'PERMATA',
            name: 'Permata Virtual Account',
            type: 'VIRTUAL_ACCOUNT',
            fee: 0,
            isActive: true,
            description: 'Pembayaran melalui Virtual Account Bank Permata',
          },
        ];
        // Save to state first
        settingsMap.paymentMethods = defaultPaymentMethods;
        setSettings(settingsMap);
        
        // Auto-save to database
        setTimeout(async () => {
          try {
            const settingsToSave: any = { paymentMethods: JSON.stringify(defaultPaymentMethods) };
            await fetch('/api/admin/settings', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ settings: settingsToSave }),
            });
            console.log('Default payment methods auto-saved');
          } catch (error) {
            console.error('Error auto-saving default payment methods:', error);
          }
        }, 500);
      } else {
        setSettings(settingsMap);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      showError('Gagal', error.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/admin/products?limit=1000&status=active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      const productsList = (data.data?.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.images?.[0]?.imageUrl || product.imageUrl || null,
      }));

      setProducts(productsList);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      showError('Gagal', error.message || 'Gagal memuat produk');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchShippingProducts = async () => {
    try {
      setLoadingShippingProducts(true);
      const response = await fetch('/api/admin/products?limit=1000&status=active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      const productsList = (data.data?.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.images?.[0]?.imageUrl || product.imageUrl || null,
        freeShippingThreshold: product.freeShippingThreshold ? parseFloat(product.freeShippingThreshold) : null,
        defaultShippingCost: product.defaultShippingCost ? parseFloat(product.defaultShippingCost) : null,
      }));

      setShippingProducts(productsList);
    } catch (error: any) {
      console.error('Error fetching shipping products:', error);
      showError('Gagal', error.message || 'Gagal memuat produk');
    } finally {
      setLoadingShippingProducts(false);
    }
  };

  const handleChange = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleProductSelection = (productId: string) => {
    const currentWarranty = settings.productWarranty || {};
    const warrantyItems = currentWarranty[productId] || [];
    
    // Jika sudah ada garansi, tidak bisa di-toggle
    if (warrantyItems.length > 0) {
      return;
    }
    
    // Toggle untuk menampilkan/menyembunyikan button "Atur Garansi"
    setToggledProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleShippingProductSelection = (productId: string) => {
    const product = shippingProducts.find(p => p.id === productId);
    const hasShippingSettings = product && (product.freeShippingThreshold !== null || product.defaultShippingCost !== null);
    
    // Jika sudah ada pengaturan, tidak bisa di-toggle
    if (hasShippingSettings) {
      return;
    }
    
    // Toggle untuk menampilkan/menyembunyikan button "Atur Pesanan"
    setShippingToggledProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const openShippingModal = (productId: string) => {
    const product = shippingProducts.find(p => p.id === productId);
    if (product) {
      setEditingShippingProduct({
        id: product.id,
        name: product.name,
        freeShippingThreshold: product.freeShippingThreshold,
        defaultShippingCost: product.defaultShippingCost,
      });
      setShippingModalOpen(true);
    }
  };

  const closeShippingModal = () => {
    setShippingModalOpen(false);
    setEditingShippingProduct(null);
    // Reset toggle state
    if (editingShippingProduct) {
      setShippingToggledProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingShippingProduct.id);
        return newSet;
      });
    }
  };

  const handleSaveShippingSettings = async () => {
    if (!editingShippingProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${editingShippingProduct.id}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freeShippingThreshold: editingShippingProduct.freeShippingThreshold,
          defaultShippingCost: editingShippingProduct.defaultShippingCost,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save shipping settings');
      }

      // Update local state
      setShippingProducts(prev => prev.map(p => 
        p.id === editingShippingProduct.id
          ? {
              ...p,
              freeShippingThreshold: editingShippingProduct.freeShippingThreshold,
              defaultShippingCost: editingShippingProduct.defaultShippingCost,
            }
          : p
      ));

      closeShippingModal();
      showSuccess('Berhasil', 'Pengaturan pengiriman berhasil disimpan');
    } catch (error: any) {
      console.error('Error saving shipping settings:', error);
      showError('Gagal', error.message || 'Gagal menyimpan pengaturan pengiriman');
    }
  };

  const removeProductWarranty = (productId: string) => {
    const currentWarranty = settings.productWarranty || {};
    const newWarranty = { ...currentWarranty };
    delete newWarranty[productId];
    handleChange('productWarranty', newWarranty);
  };

  const openWarrantyModal = (productId: string) => {
    setSelectedProductId(productId);
    setWarrantyModalTab('product');
    setWarrantyModalOpen(true);
  };

  const openDeliveryGuaranteeModal = () => {
    setSelectedProductId(null);
    setWarrantyModalTab('delivery');
    setWarrantyModalOpen(true);
  };

  const closeWarrantyModal = () => {
    // Reset toggle state untuk produk yang sudah ada garansi
    if (selectedProductId) {
      const currentWarranty = settings.productWarranty || {};
      const warrantyItems = currentWarranty[selectedProductId] || [];
      if (warrantyItems.length > 0) {
        setToggledProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedProductId);
          return newSet;
        });
      }
    }
    setSelectedProductId(null);
    setWarrantyModalOpen(false);
  };

  const addWarrantyItem = (productId: string) => {
    const currentWarranty = settings.productWarranty || {};
    const productWarranty = currentWarranty[productId] || [];
    const newWarranty = {
      ...currentWarranty,
      [productId]: [...productWarranty, { title: '', description: '' }],
    };
    handleChange('productWarranty', newWarranty);
  };

  const removeWarrantyItem = (productId: string, index: number) => {
    const currentWarranty = settings.productWarranty || {};
    const productWarranty = currentWarranty[productId] || [];
    const newWarranty = {
      ...currentWarranty,
      [productId]: productWarranty.filter((_: any, i: number) => i !== index),
    };
    handleChange('productWarranty', newWarranty);
  };

  const updateWarrantyItem = (productId: string, index: number, field: 'title' | 'description', value: string) => {
    const currentWarranty = settings.productWarranty || {};
    const productWarranty = currentWarranty[productId] || [];
    const newWarranty = {
      ...currentWarranty,
      [productId]: productWarranty.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    };
    handleChange('productWarranty', newWarranty);
  };

  // Payment Methods functions
  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod({
      id: '',
      name: '',
      type: 'VIRTUAL_ACCOUNT',
      fee: 0,
      isActive: true,
      description: '',
      icon: '',
    });
    setPaymentMethodModalOpen(true);
  };

  const handleEditPaymentMethod = (method: any) => {
    setEditingPaymentMethod({ ...method });
    setPaymentMethodModalOpen(true);
  };

  const handleDeletePaymentMethod = (id: string) => {
    const currentMethods = settings.paymentMethods || [];
    const newMethods = currentMethods.filter((m: any) => m.id !== id);
    handleChange('paymentMethods', newMethods);
    showSuccess('Berhasil', 'Metode pembayaran dihapus');
  };

  const handleSavePaymentMethod = () => {
    if (!editingPaymentMethod) return;

    if (!editingPaymentMethod.name.trim()) {
      showError('Peringatan', 'Nama metode pembayaran harus diisi');
      return;
    }

    if (!editingPaymentMethod.id.trim()) {
      showError('Peringatan', 'ID metode pembayaran harus diisi');
      return;
    }

    const currentMethods = settings.paymentMethods || [];
    const existingIndex = currentMethods.findIndex((m: any) => m.id === editingPaymentMethod.id);

    let newMethods;
    if (existingIndex >= 0) {
      // Update existing
      newMethods = [...currentMethods];
      newMethods[existingIndex] = editingPaymentMethod;
    } else {
      // Add new
      newMethods = [...currentMethods, editingPaymentMethod];
    }

    handleChange('paymentMethods', newMethods);
    setPaymentMethodModalOpen(false);
    setEditingPaymentMethod(null);
    showSuccess('Berhasil', 'Metode pembayaran disimpan');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('[Settings] Saving settings:', settings);
      console.log('[Settings] Currency to save:', settings.currency);
      
      // Prepare settings for save - ensure productWarranty and paymentMethods are properly stringified
      const settingsToSave: any = { ...settings };
      if (settingsToSave.productWarranty && typeof settingsToSave.productWarranty === 'object') {
        settingsToSave.productWarranty = JSON.stringify(settingsToSave.productWarranty);
      }
      if (settingsToSave.paymentMethods && Array.isArray(settingsToSave.paymentMethods)) {
        settingsToSave.paymentMethods = JSON.stringify(settingsToSave.paymentMethods);
      }
      
      // Convert payment timeout to minutes before saving
      let timeoutInMinutes = paymentTimeoutValue;
      if (paymentTimeoutUnit === 'hours') {
        timeoutInMinutes = paymentTimeoutValue * 60;
      }
      settingsToSave.paymentTimeoutHours = timeoutInMinutes;
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToSave }),
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

      showSuccess('Berhasil', 'Pengaturan berhasil disimpan!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError('Gagal', error.message || 'Gagal menyimpan pengaturan');
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
    <div className="app-admin-settings space-y-6 pb-6">
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-600" />
                    Informasi Toko
                  </h3>
                </div>
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    Manajemen Produk
                  </h3>
                </div>
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

              {/* Garansi Per Produk */}
              <div className="mt-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    Garansi Per Produk
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Pilih produk dan atur informasi garansi yang akan ditampilkan di halaman detail produk
                </p>
                
                {loadingProducts ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Tidak ada produk tersedia</p>
                    ) : (
                      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                        <div 
                          className="inline-grid gap-3 min-w-max items-start"
                          style={gridStyle}
                        >
                          {products.map((product) => {
                            const currentWarranty = settings.productWarranty || {};
                            const warrantyItems = currentWarranty[product.id] || [];
                            const hasWarranty = warrantyItems.length > 0;
                            const isToggled = toggledProducts.has(product.id);
                            
                            return (
                              <div
                                key={product.id}
                                className={`
                                  relative border-2 rounded-lg transition-all self-start
                                  ${hasWarranty 
                                    ? 'border-green-600 bg-green-50 shadow-md cursor-default p-4' 
                                    : isToggled
                                    ? 'border-blue-600 bg-blue-50 shadow-md cursor-pointer p-4'
                                    : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer p-3'
                                  }
                                `}
                                onClick={() => !hasWarranty && toggleProductSelection(product.id)}
                              >
                                <div className="flex items-start gap-3">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {product.name}
                                    </p>
                                    {hasWarranty && (
                                      <p className="text-xs text-green-600 mt-1 font-medium">
                                        {warrantyItems.length} item garansi
                                      </p>
                                    )}
                                  </div>
                                  {hasWarranty && (
                                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                {hasWarranty && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openWarrantyModal(product.id);
                                    }}
                                    className="mt-3 w-full text-xs text-green-700 hover:text-green-800 font-medium py-2 px-2 bg-green-100 hover:bg-green-200 rounded transition-colors"
                                  >
                                    Edit Garansi
                                  </button>
                                )}
                                {isToggled && !hasWarranty && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Tambahkan entry kosong ke productWarranty sebelum buka modal
                                      const newWarranty = { ...currentWarranty };
                                      if (!newWarranty[product.id]) {
                                        newWarranty[product.id] = [];
                                        handleChange('productWarranty', newWarranty);
                                      }
                                      openWarrantyModal(product.id);
                                    }}
                                    className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 px-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                                  >
                                    Atur Garansi
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Order Settings */}
          {activeTab === 'order' && (
            <div className="space-y-6">
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-600" />
                    Manajemen Pesanan
                  </h3>
                </div>
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
              {/* Card 1: Konfigurasi Pembayaran */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="bg-gray-50 border-b border-gray-200 rounded-t-lg px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    Konfigurasi Pembayaran
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batas Waktu Pembayaran
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={paymentTimeoutUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value as 'minutes' | 'hours';
                            const oldUnit = paymentTimeoutUnit;
                            setPaymentTimeoutUnit(newUnit);
                            // Convert value when changing unit
                            if (newUnit === 'hours' && oldUnit === 'minutes') {
                              // Convert minutes to hours (round to 1 decimal)
                              setPaymentTimeoutValue(Math.round((paymentTimeoutValue / 60) * 10) / 10);
                            } else if (newUnit === 'minutes' && oldUnit === 'hours') {
                              // Convert hours to minutes
                              setPaymentTimeoutValue(Math.round(paymentTimeoutValue * 60));
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                        >
                          <option value="minutes">Menit</option>
                          <option value="hours">Jam</option>
                        </select>
                        <Input
                          type="number"
                          value={paymentTimeoutValue}
                          onChange={(e) => {
                            const value = paymentTimeoutUnit === 'hours' 
                              ? parseFloat(e.target.value) || 0
                              : parseInt(e.target.value) || 0;
                            setPaymentTimeoutValue(value);
                          }}
                          min="1"
                          step={paymentTimeoutUnit === 'hours' ? '0.1' : '1'}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Batalkan pesanan jika pembayaran tidak diterima dalam waktu ini</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Metode Pembayaran */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="bg-gray-50 border-b border-gray-200 rounded-t-lg px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    Metode Pembayaran
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Kelola metode pembayaran yang tersedia dan atur potongan atau tambahan biaya untuk setiap metode
                  </p>

                  <div className="mb-4">
                    <button
                      onClick={handleAddPaymentMethod}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Metode Pembayaran
                    </button>
                  </div>

                  {/* Scrollable container untuk list metode pembayaran */}
                  <div 
                    className="border border-gray-200 rounded-lg bg-gray-50"
                    style={{ 
                      maxHeight: '400px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {settings.paymentMethods && Array.isArray(settings.paymentMethods) && settings.paymentMethods.length > 0 ? (
                      <div className="p-3 space-y-3">
                        {settings.paymentMethods.map((method: any) => (
                          <div
                            key={method.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-900">{method.name}</span>
                                {!method.isActive && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Nonaktif</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Tipe:</span>
                                  <span>{method.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Biaya:</span>
                                  {method.fee < 0 ? (
                                    <span className="text-green-600 font-semibold">Potongan {formatPrice(Math.abs(method.fee))}</span>
                                  ) : method.fee > 0 ? (
                                    <span className="text-gray-700 font-semibold">Tambahan {formatPrice(method.fee)}</span>
                                  ) : (
                                    <span className="text-gray-500">Tidak ada biaya</span>
                                  )}
                                </div>
                                {method.description && (
                                  <div className="text-gray-500 mt-1 pt-1 border-t border-gray-200">
                                    {method.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => handleEditPaymentMethod(method)}
                                className="admin-no-animation p-2 text-blue-600 rounded-lg"
                                title="Edit"
                                style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePaymentMethod(method.id)}
                                className="admin-no-animation p-2 text-red-600 rounded-lg"
                                title="Hapus"
                                style={{ transition: 'none', transform: 'none', boxShadow: 'none' }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Belum ada metode pembayaran. Klik "Tambah Metode Pembayaran" untuk menambahkan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-600" />
                    Konfigurasi Pengiriman
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Pilih produk untuk mengatur batas gratis ongkir dan biaya pengiriman default
                  </p>
                </div>
                {loadingShippingProducts ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : shippingProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada produk tersedia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {shippingProducts.map((product) => {
                      const isToggled = shippingToggledProducts.has(product.id);
                      const hasShippingSettings = product.freeShippingThreshold !== null || product.defaultShippingCost !== null;
                      
                      return (
                        <div
                          key={product.id}
                          className={`
                            relative border-2 rounded-lg transition-all self-start
                            ${hasShippingSettings 
                              ? 'border-green-600 bg-green-50 shadow-md cursor-default p-4' 
                              : isToggled
                              ? 'border-blue-600 bg-blue-50 shadow-md cursor-pointer p-4'
                              : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer p-3'
                            }
                          `}
                          onClick={() => !hasShippingSettings && toggleShippingProductSelection(product.id)}
                        >
                          <div className="flex items-start gap-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              {hasShippingSettings && (
                                <div className="text-xs text-green-600 mt-1 space-y-0.5">
                                  {product.freeShippingThreshold !== null && (
                                    <p className="font-medium">
                                      Gratis: {formatPrice(product.freeShippingThreshold)}
                                    </p>
                                  )}
                                  {product.defaultShippingCost !== null && (
                                    <p className="font-medium">
                                      Biaya: {formatPrice(product.defaultShippingCost)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            {hasShippingSettings && (
                              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          {hasShippingSettings && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openShippingModal(product.id);
                              }}
                              className="mt-3 w-full text-xs text-green-700 hover:text-green-800 font-medium py-2 px-2 bg-green-100 hover:bg-green-200 rounded transition-colors"
                            >
                              Edit Pengiriman
                            </button>
                          )}
                          {isToggled && !hasShippingSettings && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openShippingModal(product.id);
                              }}
                              className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 px-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                            >
                              Atur Pesanan
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    Konfigurasi Email
                  </h3>
                </div>
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-600" />
                    Konfigurasi SEO
                  </h3>
                </div>
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

      {/* Warranty Modal */}
      {warrantyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {warrantyModalTab === 'product' ? 'Atur Garansi Produk' : 'Atur Garansi Pengiriman'}
                </h2>
                {warrantyModalTab === 'product' && selectedProductId && (
                  <p className="text-sm text-gray-600 mt-1">
                    {products.find(p => p.id === selectedProductId)?.name}
                  </p>
                )}
              </div>
              <button
                onClick={closeWarrantyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  if (!selectedProductId) {
                    showError('Peringatan', 'Pilih produk terlebih dahulu');
                    return;
                  }
                  setWarrantyModalTab('product');
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  warrantyModalTab === 'product'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Atur Garansi Produk
              </button>
              <button
                onClick={() => setWarrantyModalTab('delivery')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  warrantyModalTab === 'delivery'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Garansi Pengiriman
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {warrantyModalTab === 'product' && selectedProductId ? (
                (() => {
                  const warrantyItems = (settings.productWarranty || {})[selectedProductId] || [];
                  
                  return (
                    <div className="space-y-4">
                      {warrantyItems.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          Belum ada item garansi. Klik tombol "Tambah Item" untuk menambahkan.
                        </p>
                      ) : (
                        warrantyItems.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Item {index + 1}
                              </span>
                              <button
                                onClick={() => removeWarrantyItem(selectedProductId, index)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Judul
                              </label>
                              <Input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) =>
                                  updateWarrantyItem(selectedProductId, index, 'title', e.target.value)
                                }
                                placeholder="Contoh: 15 Hari Pengembalian"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi
                              </label>
                              <textarea
                                value={item.description || ''}
                                onChange={(e) =>
                                  updateWarrantyItem(selectedProductId, index, 'description', e.target.value)
                                }
                                placeholder="Contoh: Ajukan retur dalam 15 hari jika produk tidak sesuai ekspektasi Anda."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()
              ) : warrantyModalTab === 'delivery' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul
                    </label>
                    <Input
                      type="text"
                      value={settings.deliveryGuaranteeTitle || ''}
                      onChange={(e) => handleChange('deliveryGuaranteeTitle', e.target.value)}
                      placeholder="Contoh: Garansi tiba 19 - 21 November"
                    />
                    <p className="text-xs text-gray-500 mt-1">Judul yang akan ditampilkan di bagian garansi pengiriman</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      value={settings.deliveryGuaranteeDescription || ''}
                      onChange={(e) => handleChange('deliveryGuaranteeDescription', e.target.value)}
                      placeholder="Contoh: Dapatkan voucher s/d Rp10.000% jika pesanan terlambat"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deskripsi yang akan ditampilkan di bawah judul garansi pengiriman</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              {warrantyModalTab === 'product' && selectedProductId ? (
                <Button
                  onClick={() => addWarrantyItem(selectedProductId)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={closeWarrantyModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    if (warrantyModalTab === 'product' && selectedProductId) {
                      const warrantyItems = (settings.productWarranty || {})[selectedProductId] || [];
                      if (warrantyItems.length === 0) {
                        showError('Peringatan', 'Tambahkan minimal 1 item garansi');
                        return;
                      }
                      // Validasi semua item harus ada title dan description
                      const hasEmptyFields = warrantyItems.some((item: any) => !item.title || !item.description);
                      if (hasEmptyFields) {
                        showError('Peringatan', 'Semua item garansi harus memiliki judul dan deskripsi');
                        return;
                      }
                    }
                    closeWarrantyModal();
                    showSuccess('Berhasil', 'Perubahan garansi tersimpan. Klik "Simpan Pengaturan" untuk menyimpan ke database.');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {paymentMethodModalOpen && editingPaymentMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingPaymentMethod.id ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setPaymentMethodModalOpen(false);
                  setEditingPaymentMethod(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Metode Pembayaran *
                  </label>
                  <Input
                    type="text"
                    value={editingPaymentMethod.id}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, id: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="Contoh: BRI, BCA, QRIS_CUSTOM"
                    disabled={!!editingPaymentMethod.id && settings.paymentMethods?.some((m: any) => m.id === editingPaymentMethod.id)}
                  />
                  <p className="text-xs text-gray-500 mt-1">ID unik untuk metode pembayaran (huruf besar, tanpa spasi)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Metode Pembayaran *
                  </label>
                  <Input
                    type="text"
                    value={editingPaymentMethod.name}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, name: e.target.value })}
                    placeholder="Contoh: BRI Virtual Account"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Pembayaran *
                  </label>
                  <select
                    value={editingPaymentMethod.type}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
                    <option value="QRIS">QRIS</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="CREDIT_CARD">Credit/Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Potongan/Tambahan Biaya *
                  </label>
                  <Input
                    type="number"
                    value={editingPaymentMethod.fee}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    step="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan angka negatif untuk potongan (contoh: -2000) atau positif untuk tambahan biaya (contoh: 2000)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    value={editingPaymentMethod.description || ''}
                    onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, description: e.target.value })}
                    placeholder="Contoh: Pembayaran melalui Virtual Account bank BRI"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPaymentMethod.isActive}
                      onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktifkan metode pembayaran ini</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setPaymentMethodModalOpen(false);
                  setEditingPaymentMethod(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSavePaymentMethod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Settings Modal */}
      {shippingModalOpen && editingShippingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Atur Pengiriman
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  {editingShippingProduct.name}
                </p>
              </div>
              <button
                onClick={closeShippingModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batas Gratis Ongkir
                  </label>
                  <Input
                    type="number"
                    value={editingShippingProduct.freeShippingThreshold || ''}
                    onChange={(e) => setEditingShippingProduct({ 
                      ...editingShippingProduct, 
                      freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gratis ongkir untuk pesanan di atas jumlah ini. Akan menjadi subtotal pengiriman di rincian pembayaran.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biaya Pengiriman Default
                  </label>
                  <Input
                    type="number"
                    value={editingShippingProduct.defaultShippingCost || ''}
                    onChange={(e) => setEditingShippingProduct({ 
                      ...editingShippingProduct, 
                      defaultShippingCost: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Biaya pengiriman standar yang digunakan. Akan menjadi biaya layanan di rincian pembayaran.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeShippingModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveShippingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


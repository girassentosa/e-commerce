'use client';

/**
 * AddressForm Component
 * Form to add/edit shipping address
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Loader2 } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  addressId?: string;
  initialData?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
  onSaveButtonRef?: (props: { disabled: boolean; onClick: () => void; loading: boolean }) => void;
  showSaveButton?: boolean;
}

interface GeocodeResult {
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export function AddressForm({ addressId, initialData, onSuccess, onCancel, onSaveButtonRef, showSaveButton = true }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const isEditMode = !!addressId && !!initialData;
  const formRef = useRef<HTMLFormElement>(null);
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
  });

  const [originalData, setOriginalData] = useState(formData);

  // Initialize form data with initialData if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      const initialFormData = {
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'United States',
        isDefault: initialData.isDefault || false,
      };
      setFormData(initialFormData);
      setOriginalData(JSON.parse(JSON.stringify(initialFormData)));
    }
  }, [isEditMode, initialData]);

  // Check if there are changes
  const hasChanges = () => {
    if (!isEditMode) return true; // Always allow saving for new address
    return (
      formData.fullName !== originalData.fullName ||
      formData.phone !== originalData.phone ||
      formData.addressLine1 !== originalData.addressLine1 ||
      formData.addressLine2 !== originalData.addressLine2 ||
      formData.city !== originalData.city ||
      formData.state !== originalData.state ||
      formData.postalCode !== originalData.postalCode ||
      formData.country !== originalData.country ||
      formData.isDefault !== originalData.isDefault
    );
  };

  // Expose save button props to parent if onSaveButtonRef is provided
  useEffect(() => {
    if (onSaveButtonRef) {
      const hasChangesValue = isEditMode ? (
        formData.fullName !== originalData.fullName ||
        formData.phone !== originalData.phone ||
        formData.addressLine1 !== originalData.addressLine1 ||
        formData.addressLine2 !== originalData.addressLine2 ||
        formData.city !== originalData.city ||
        formData.state !== originalData.state ||
        formData.postalCode !== originalData.postalCode ||
        formData.country !== originalData.country ||
        formData.isDefault !== originalData.isDefault
      ) : true;
      
      onSaveButtonRef({
        disabled: loading || (isEditMode && !hasChangesValue),
        onClick: () => {
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        },
        loading,
      });
    }
  }, [loading, isEditMode, formData, originalData, onSaveButtonRef]);

  /**
   * Reverse geocoding: Convert lat/lng to address using OpenStreetMap Nominatim API
   */
  const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ECommerceApp/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Gagal mengambil data alamat. Silakan coba lagi.');
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('Alamat tidak ditemukan untuk lokasi Anda.');
      }
      
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Timeout saat mengambil alamat. Silakan coba lagi.');
      }
      
      if (error instanceof Error && error.message) {
        throw error;
      }
      
      throw new Error('Gagal mendapatkan alamat dari koordinat.');
    }
  };

  /**
   * Parse address data from geocoding result
   */
  const parseAddressFromGeocode = (addr: GeocodeResult['address']) => {
    const road = addr.road || '';
    const houseNumber = addr.house_number || '';
    const addressLine1 = houseNumber ? `${houseNumber} ${road}`.trim() : road;
    const city = addr.city || addr.town || addr.village || '';
    const state = addr.state || addr.region || '';
    const postalCode = addr.postcode || '';
    const countryCode = addr.country_code?.toUpperCase() || '';
    const country = addr.country || getCountryName(countryCode);

    return {
      addressLine1,
      city,
      state,
      postalCode,
      country,
    };
  };

  /**
   * Get current location and auto-fill address form
   */
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showError('Geolokasi tidak didukung', 'Browser Anda tidak mendukung geolokasi.');
      return;
    }

    setLoadingLocation(true);

    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err: GeolocationPositionError) => {
            reject({
              code: err.code,
              message: err.message,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      // Extract coordinates
      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const geocodeResult = await reverseGeocode(latitude, longitude);
      const addr = geocodeResult.address;

      // Parse address data
      const addressData = parseAddressFromGeocode(addr);

      // Validate address data
      if (!addressData.addressLine1 && !addressData.city && !addressData.state) {
        showError('Gagal mendapatkan alamat', 'Alamat tidak ditemukan untuk lokasi Anda. Silakan masukkan alamat secara manual.');
        return;
      }

      // Auto-fill form
      setFormData((prev) => ({
        ...prev,
        addressLine1: addressData.addressLine1 || prev.addressLine1,
        city: addressData.city || prev.city,
        state: addressData.state || prev.state,
        postalCode: addressData.postalCode || prev.postalCode,
        country: addressData.country || prev.country,
      }));

      // Show success notification
      showSuccess('Alamat terisi otomatis', 'Alamat Anda telah terisi. Silakan periksa dan lengkapi jika diperlukan.');

    } catch (error: any) {
      let errorMessage = 'Gagal mendapatkan lokasi Anda. Silakan masukkan alamat secara manual.';
      
      if (error?.code === 1) {
        errorMessage = 'Akses lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.';
      } else if (error?.code === 2) {
        errorMessage = 'Lokasi tidak tersedia. Silakan pastikan GPS atau lokasi aktif.';
      } else if (error?.code === 3) {
        errorMessage = 'Permintaan lokasi timeout. Silakan coba lagi.';
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      showError('Gagal mendapatkan lokasi', errorMessage);

    } finally {
      setLoadingLocation(false);
    }
  };

  /**
   * Get country name from country code
   */
  const getCountryName = (code: string): string => {
    const countryMap: Record<string, string> = {
      US: 'United States',
      ID: 'Indonesia',
      GB: 'United Kingdom',
      CA: 'Canada',
      AU: 'Australia',
      DE: 'Germany',
      FR: 'France',
      IT: 'Italy',
      ES: 'Spain',
      JP: 'Japan',
      CN: 'China',
      IN: 'India',
      BR: 'Brazil',
      MX: 'Mexico',
      KR: 'South Korea',
      SG: 'Singapore',
      MY: 'Malaysia',
      TH: 'Thailand',
      PH: 'Philippines',
      VN: 'Vietnam',
    };

    return countryMap[code] || code || 'United States';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if no changes in edit mode
    if (isEditMode && !hasChanges()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode ? `/api/addresses/${addressId}` : '/api/addresses';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        if (isEditMode) {
          showSuccess('Alamat diperbarui', 'Alamat berhasil diubah.');
          setOriginalData(JSON.parse(JSON.stringify(formData)));
        } else {
          showSuccess('Alamat ditambahkan', 'Alamat baru berhasil disimpan.');
        }
        onSuccess();
      } else {
        showError(
          'Gagal menyimpan alamat',
          data.error || (isEditMode ? 'Gagal mengubah alamat' : 'Gagal menambahkan alamat')
        );
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} address:`, error);
      showError('Gagal menyimpan alamat', isEditMode ? 'Gagal mengubah alamat' : 'Gagal menambahkan alamat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Use Current Location Button */}
      <div className="mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={loadingLocation}
          className="w-full"
        >
          {loadingLocation ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Gunakan Lokasi Saya Sekarang
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Izinkan akses lokasi untuk mengisi alamat secara otomatis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nama Lengkap"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
        <Input
          label="No HP"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <Input
        label="Alamat Baris 1"
        value={formData.addressLine1}
        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
        required
      />

      <Input
        label="Alamat Baris 2 (Opsional)"
        value={formData.addressLine2}
        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Kota"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          required
        />
        <Input
          label="Provinsi"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          required
        />
        <Input
          label="Kode Pos"
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          required
        />
      </div>

      <Input
        label="Negara"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        required
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="appearance-none w-5 h-5 border-2 border-gray-300 rounded bg-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors relative z-10 cursor-pointer"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          />
          {formData.isDefault && (
            <svg
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none z-20 text-blue-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          Set sebagai alamat default
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        {showSaveButton && (
          <Button 
            type="submit" 
            disabled={loading || (isEditMode && !hasChanges())} 
            className="flex-1"
          >
            {loading ? 'Menyimpan...' : isEditMode ? 'Simpan' : 'Simpan Alamat'}
          </Button>
        )}
        {!isEditMode && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}


'use client';

/**
 * AddressForm Component
 * Form to add/edit shipping address
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
   * Reverse geocoding: Convert lat/lng to address
   * Using OpenStreetMap Nominatim API (free, no API key required)
   */
  const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult | null> => {
    try {
      // OpenStreetMap Nominatim API
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ECommerceApp/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  /**
   * Get current location and auto-fill address
   */
  const handleUseCurrentLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast.error('Geolokasi tidak didukung oleh browser Anda');
      return;
    }

    setLoadingLocation(true);

    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Show loading message
      toast.loading('Mendapatkan lokasi Anda...', { id: 'location' });

      // Reverse geocode to get address
      const geocodeResult = await reverseGeocode(latitude, longitude);

      if (!geocodeResult || !geocodeResult.address) {
        toast.error('Tidak dapat menentukan alamat Anda. Silakan masukkan secara manual.', { id: 'location' });
        setLoadingLocation(false);
        return;
      }

      const addr = geocodeResult.address;

      // Build address line 1
      const road = addr.road || '';
      const houseNumber = addr.house_number || '';
      const addressLine1 = houseNumber ? `${houseNumber} ${road}`.trim() : road;

      // Get city (can be city, town, or village)
      const city = addr.city || addr.town || addr.village || '';

      // Get state/region
      const state = addr.state || addr.region || '';

      // Get postal code
      const postalCode = addr.postcode || '';

      // Get country name
      const countryCode = addr.country_code?.toUpperCase() || '';
      const country = addr.country || getCountryName(countryCode);

      // Auto-fill form
      setFormData((prev) => ({
        ...prev,
        addressLine1: addressLine1 || prev.addressLine1,
        city: city || prev.city,
        state: state || prev.state,
        postalCode: postalCode || prev.postalCode,
        country: country || prev.country,
      }));

      toast.success('Alamat terisi otomatis! Silakan periksa dan lengkapi formulir.', { id: 'location' });
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = 'Gagal mendapatkan lokasi Anda. Silakan masukkan alamat secara manual.';
      
      if (error.code === 1) {
        errorMessage = 'Akses lokasi ditolak. Silakan aktifkan izin lokasi atau masukkan alamat secara manual.';
      } else if (error.code === 2) {
        errorMessage = 'Lokasi tidak tersedia. Silakan masukkan alamat secara manual.';
      } else if (error.code === 3) {
        errorMessage = 'Permintaan lokasi timeout. Silakan coba lagi atau masukkan alamat secara manual.';
      }

      toast.error(errorMessage, { id: 'location' });
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
          toast.success('Alamat berhasil diubah');
          setOriginalData(JSON.parse(JSON.stringify(formData)));
        } else {
          toast.success('Alamat berhasil ditambahkan');
        }
        onSuccess();
      } else {
        toast.error(data.error || (isEditMode ? 'Gagal mengubah alamat' : 'Gagal menambahkan alamat'));
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} address:`, error);
      toast.error(isEditMode ? 'Gagal mengubah alamat' : 'Gagal menambahkan alamat');
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
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Gunakan Lokasi Saya Sekarang
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Allow location access to automatically fill your address
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

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
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


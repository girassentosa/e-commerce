'use client';

/**
 * AddressForm Component
 * Form to add/edit shipping address
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
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

export function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
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
      toast.error('Geolocation is not supported by your browser');
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
      toast.loading('Getting your location...', { id: 'location' });

      // Reverse geocode to get address
      const geocodeResult = await reverseGeocode(latitude, longitude);

      if (!geocodeResult || !geocodeResult.address) {
        toast.error('Could not determine your address. Please enter manually.', { id: 'location' });
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

      toast.success('Address filled automatically! Please review and complete the form.', { id: 'location' });
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = 'Failed to get your location. Please enter address manually.';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions or enter address manually.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please enter address manually.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout. Please try again or enter address manually.';
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
    setLoading(true);

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Address added successfully');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          label="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <Input
        label="Address Line 1"
        value={formData.addressLine1}
        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
        required
      />

      <Input
        label="Address Line 2 (Optional)"
        value={formData.addressLine2}
        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          required
        />
        <Input
          label="State/Province"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          required
        />
        <Input
          label="Postal Code"
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          required
        />
      </div>

      <Input
        label="Country"
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
          Set as default address
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


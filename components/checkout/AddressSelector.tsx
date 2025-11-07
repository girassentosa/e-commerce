'use client';

import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddressForm } from './AddressForm';
import { Loader } from '@/components/ui/Loader';

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

interface AddressSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data || []);
        // Auto-select default address
        const defaultAddr = data.data?.find((a: Address) => a.isDefault);
        if (defaultAddr && !selectedId) {
          onSelect(defaultAddr.id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  if (loading) return <Loader />;

  if (showForm) {
    return (
      <AddressForm
        onSuccess={() => {
          setShowForm(false);
          fetchAddresses();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          onClick={() => onSelect(addr.id)}
          className={`border rounded-lg p-4 cursor-pointer transition ${
            selectedId === addr.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{addr.fullName}</h4>
                {addr.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
              <p className="text-sm text-gray-700 mt-2">
                {addr.addressLine1}
                {addr.addressLine2 && `, ${addr.addressLine2}`}
              </p>
              <p className="text-sm text-gray-700">
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p className="text-sm text-gray-700">{addr.country}</p>
            </div>
            {selectedId === addr.id && (
              <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowForm(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Address
      </Button>
    </div>
  );
}


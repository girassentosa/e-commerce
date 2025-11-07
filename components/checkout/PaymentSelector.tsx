'use client';

import { CreditCard, Wallet, Building } from 'lucide-react';

interface PaymentSelectorProps {
  selected: 'COD' | 'CREDIT_CARD' | 'BANK_TRANSFER' | null;
  onSelect: (method: 'COD' | 'CREDIT_CARD' | 'BANK_TRANSFER') => void;
}

export function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  const methods = [
    {
      id: 'COD' as const,
      name: 'Cash on Delivery',
      description: 'Pay when you receive',
      icon: Wallet,
    },
    {
      id: 'CREDIT_CARD' as const,
      name: 'Credit/Debit Card',
      description: 'Secure payment (Mock)',
      icon: CreditCard,
    },
    {
      id: 'BANK_TRANSFER' as const,
      name: 'Bank Transfer',
      description: 'Direct bank payment',
      icon: Building,
    },
  ];

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const Icon = method.icon;
        return (
          <div
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`border rounded-lg p-4 cursor-pointer transition ${
              selected === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === method.id
                    ? 'border-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selected === method.id && (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </div>
              <Icon className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-semibold">{method.name}</p>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


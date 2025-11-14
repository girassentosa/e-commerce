/**
 * Helper khusus order
 * Utilitas agar tampilan order admin & user konsisten
 */

import { ShippingAddress } from '@/types';

// Type untuk shipping address yang lebih fleksibel (untuk order)
type ShippingAddressInput = {
  id?: string;
  orderId?: string | null;
  userId?: string | null;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

type VariantInfo = {
  name: string;
  value: string;
} | null;

const colorLabelMap: Record<string, string> = {
  hitam: 'Hitam',
  putih: 'Putih',
  'biru-navy': 'Biru Navy',
  'merah-maroon': 'Merah Maroon',
};

const localeCurrencyMap: Record<string, string> = {
  IDR: 'id-ID',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

type PaymentLocale = 'id' | 'en';

type PaymentDetail = {
  label: string;
  description: string;
};

const paymentMethodDetails: Record<string, Record<PaymentLocale, PaymentDetail>> = {
  COD: {
    id: {
      label: 'Bayar di Tempat (COD)',
      description: 'Pembayaran dilakukan saat pesanan diterima.',
    },
    en: {
      label: 'Cash on Delivery (COD)',
      description: 'Payment is collected when the order is delivered.',
    },
  },
  VIRTUAL_ACCOUNT: {
    id: {
      label: 'Virtual Account',
      description: 'Pembayaran melalui Virtual Account bank yang tersedia.',
    },
    en: {
      label: 'Virtual Account',
      description: 'Pay via the available bank virtual account.',
    },
  },
  QRIS: {
    id: {
      label: 'QRIS',
      description: 'Pembayaran instan menggunakan QR Indonesia Standard.',
    },
    en: {
      label: 'QRIS',
      description: 'Instant payment using the Indonesian QR standard.',
    },
  },
} as const;

const toTitleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function getVariantLabels(
  variant: VariantInfo,
  selectedColor?: string | null,
  selectedSize?: string | null
) {
  let colorLabel: string | null = null;
  let sizeLabel: string | null = null;

  if (selectedColor) {
    const colorValue = selectedColor.toLowerCase();
    colorLabel = colorLabelMap[colorValue] ?? toTitleCase(selectedColor);
  }

  if (selectedSize) {
    sizeLabel = selectedSize.toUpperCase();
  }

  if (!colorLabel && !sizeLabel && variant) {
    if (variant.name.toLowerCase() === 'color') {
      const colorValue = variant.value.toLowerCase();
      colorLabel = colorLabelMap[colorValue] ?? toTitleCase(variant.value);
    } else if (variant.name.toLowerCase() === 'size') {
      sizeLabel = variant.value.toUpperCase();
    }
  }

  return { colorLabel, sizeLabel };
}

export function formatPhoneDisplay(phone?: string | null) {
  if (!phone) return '';

  const trimmed = phone.trim();
  if (trimmed.startsWith('+62')) {
    const digits = trimmed.substring(3).replace(/\s+/g, '');
    return `(+62) ${digits}`;
  }

  return trimmed;
}

export function formatShippingAddress(address?: ShippingAddressInput | null) {
  if (!address) return '';
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter((part) => !!part && part.toString().trim().length > 0);

  return parts.join(', ');
}

type LocaleOption = 'id-ID' | 'en-US';

export function getPaymentMethodDisplay(
  paymentMethod?: string | null,
  locale: LocaleOption = 'id-ID'
) {
  if (!paymentMethod) {
    return {
      label: locale === 'en-US' ? 'Unknown' : 'Tidak diketahui',
      description: '',
    };
  }

  const normalized = paymentMethod.toUpperCase();
  const localeKey: PaymentLocale = locale === 'en-US' ? 'en' : 'id';
  const detail = paymentMethodDetails[normalized]?.[localeKey];

  if (detail) {
    return detail;
  }

  return {
    label: paymentMethod,
    description: '',
  };
}

export function getCurrencyLocale(currency?: string | null): LocaleOption {
  if (!currency) return 'en-US';
  const normalized = currency.toUpperCase();
  return (localeCurrencyMap[normalized] ?? 'en-US') as LocaleOption;
}


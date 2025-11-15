import { PaymentStatus } from '@prisma/client';

export type MidtransSupportedMethod = 'VIRTUAL_ACCOUNT' | 'QRIS';

export interface PaymentCustomerInfo {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
}

export interface PaymentItemInfo {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentShippingInfo {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface MidtransChargeInput {
  orderNumber: string;
  amount: number;
  method: MidtransSupportedMethod;
  channel?: string | null;
  customer: PaymentCustomerInfo;
  items: PaymentItemInfo[];
  shipping: PaymentShippingInfo;
}

export interface PaymentInstructionResult {
  provider: 'MIDTRANS';
  paymentType: string;
  channel?: string | null;
  status: PaymentStatus;
  transactionId?: string | null;
  amount: number;
  vaNumber?: string | null;
  vaBank?: string | null;
  qrString?: string | null;
  qrImageUrl?: string | null;
  paymentUrl?: string | null;
  instructions?: string | null;
  expiresAt?: string | null;
  rawResponse?: any;
}

const MIDTRANS_SANDBOX_BASE = 'https://api.sandbox.midtrans.com';

const bankMap: Record<string, string> = {
  BCA: 'bca',
  MANDIRI: 'mandiri',
  BNI: 'bni',
  BRI: 'bri',
  BSI: 'bsi',
  PERMATA: 'permata',
};

function getMidtransServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }
  // Trim whitespace and log first/last few characters for debugging (without exposing full key)
  const trimmedKey = key.trim();
  if (trimmedKey.length < 10) {
    console.error('MIDTRANS_SERVER_KEY appears to be too short. Make sure you copied the full Server Key.');
  }
  // Log first 4 and last 4 characters for debugging (safe to log)
  console.log('Midtrans Server Key loaded:', trimmedKey.substring(0, 4) + '...' + trimmedKey.substring(trimmedKey.length - 4));
  return trimmedKey;
}

export function isMidtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

function getMidtransBaseUrl() {
  // Default to sandbox if MIDTRANS_BASE_URL is not set
  const baseUrl = process.env.MIDTRANS_BASE_URL || MIDTRANS_SANDBOX_BASE;
  console.log('Midtrans Base URL:', baseUrl, baseUrl.includes('sandbox') ? '(SANDBOX MODE)' : '(PRODUCTION MODE)');
  return baseUrl;
}

function getAppBaseUrl() {
  // Priority: NEXTAUTH_URL > APP_URL > SITE_URL > fallback to localhost
  const baseUrl = 
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  
  // Remove trailing slash
  const cleanUrl = baseUrl.replace(/\/$/, '');
  console.log('App Base URL for webhook:', cleanUrl);
  return cleanUrl;
}

// Helper functions for data validation and formatting
function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 6) {
    throw new Error('Phone number must be at least 6 digits');
  }
  return digitsOnly;
}

function validateEmail(email: string): string {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email.trim();
}

function validateName(name: string | null | undefined, fieldName: string): string {
  if (!name || !name.trim()) {
    throw new Error(`${fieldName} is required`);
  }
  const trimmed = name.trim();
  if (trimmed.length > 50) {
    return trimmed.substring(0, 50);
  }
  return trimmed;
}

function validateAddress(address: string): string {
  if (!address || !address.trim()) {
    throw new Error('Address is required');
  }
  const trimmed = address.trim();
  if (trimmed.length > 200) {
    return trimmed.substring(0, 200);
  }
  return trimmed;
}

function validatePostalCode(postalCode: string): string {
  if (!postalCode || !postalCode.trim()) {
    throw new Error('Postal code is required');
  }
  return postalCode.trim().substring(0, 10);
}

export async function createMidtransCharge(
  input: MidtransChargeInput
): Promise<PaymentInstructionResult> {
  // Validate and format input data
  const email = validateEmail(input.customer.email);
  const phone = formatPhoneNumber(input.customer.phone || input.shipping.phone);
  const shippingPhone = formatPhoneNumber(input.shipping.phone);
  
  const customerFirstName = validateName(
    input.customer.firstName || input.shipping.fullName.split(' ')[0],
    'First name'
  );
  const customerLastName = input.customer.lastName || input.shipping.fullName.split(' ').slice(1).join(' ') || '';
  const shippingFirstName = validateName(input.shipping.fullName.split(' ')[0], 'Shipping first name');
  const shippingLastName = input.shipping.fullName.split(' ').slice(1).join(' ') || '';
  
  const billingAddress = validateAddress(
    `${input.shipping.addressLine1}${input.shipping.addressLine2 ? `, ${input.shipping.addressLine2}` : ''}`
  );
  const shippingAddress = validateAddress(
    `${input.shipping.addressLine1}${input.shipping.addressLine2 ? `, ${input.shipping.addressLine2}` : ''}`
  );
  
  const city = validateName(input.shipping.city, 'City');
  const state = validateName(input.shipping.state, 'State');
  const postalCode = validatePostalCode(input.shipping.postalCode);
  
  // Midtrans requires 3-character country code (ISO 3166-1 alpha-3)
  let countryCode = (input.shipping.country || 'IDN').toUpperCase();
  // Convert 2-character codes to 3-character
  const countryCodeMap: Record<string, string> = {
    'ID': 'IDN',
    'US': 'USA',
    'MY': 'MYS',
    'SG': 'SGP',
  };
  if (countryCode.length === 2) {
    countryCode = countryCodeMap[countryCode] || 'IDN';
  }
  if (countryCode.length !== 3) {
    countryCode = 'IDN'; // Default to Indonesia
  }

  // Validate items
  if (!input.items || input.items.length === 0) {
    throw new Error('At least one item is required');
  }

  const itemDetails = input.items.map((item) => {
    if (!item.id || !item.name) {
      throw new Error('Item ID and name are required');
    }
    // Round price to nearest integer (Midtrans expects integer for Rupiah)
    const price = Math.round(item.price);
    if (price <= 0) {
      throw new Error(`Invalid price for item ${item.name}: ${item.price}`);
    }
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity for item ${item.name}: ${item.quantity}`);
    }
    return {
      id: item.id.substring(0, 50),
      price,
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    };
  });

  // Calculate total from items - Midtrans requires gross_amount to equal sum of item_details
  const itemsTotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grossAmount = Math.round(itemsTotal); // Use itemsTotal to ensure exact match
  
  // Validate that input amount matches items total (allow small rounding difference)
  if (Math.abs(itemsTotal - input.amount) > 1) {
    console.warn(`Items total (${itemsTotal}) doesn't match input amount (${input.amount}). Using items total for gross_amount.`);
  }

  // Validate order_id format (Midtrans: max 50 chars, alphanumeric and dash/underscore only)
  const orderId = input.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  if (!orderId || orderId.length < 3) {
    throw new Error('Invalid order number format. Order number must be at least 3 characters and contain only alphanumeric characters, dashes, or underscores.');
  }

  const serverKey = getMidtransServerKey();
  const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
  const baseUrl = getMidtransBaseUrl();
  const url = `${baseUrl}/v2/charge`;

  const paymentType = mapPaymentType(input);

  // Get app base URL for webhook notification
  const appBaseUrl = getAppBaseUrl();
  const notificationUrl = `${appBaseUrl}/api/payments/midtrans`;

  // Build payload - ensure no null/undefined values that Midtrans doesn't accept
  const payload: Record<string, any> = {
    payment_type: paymentType,
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    // Add notification URL for webhook
    notification_url: notificationUrl,
    customer_details: {
      first_name: customerFirstName,
      last_name: customerLastName || '',
      email,
      phone,
      billing_address: {
        first_name: customerFirstName,
        last_name: customerLastName || '',
        email,
        phone,
        address: billingAddress,
        city,
        postal_code: postalCode,
        country_code: countryCode,
      },
      shipping_address: {
        first_name: shippingFirstName,
        last_name: shippingLastName || '',
        phone: shippingPhone,
        address: shippingAddress,
        city,
        postal_code: postalCode,
        country_code: countryCode,
      },
    },
  };

  // Remove any null/undefined values from nested objects
  const cleanPayload = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanPayload);
    }
    if (obj !== null && typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined) {
          cleaned[key] = cleanPayload(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  if (paymentType === 'bank_transfer') {
    const bank = mapBank(input.channel);
    payload.bank_transfer = { bank };
  }
  // For QRIS, Midtrans only needs payment_type: 'qris'
  // No additional qris object is required for production
  // The payment_type field is sufficient to trigger QRIS payment

  // Remove any null/undefined values from nested objects before sending
  const cleanedPayload = cleanPayload(payload);

  // Log payload for debugging (remove sensitive data in production)
  console.log('Midtrans payload:', JSON.stringify(cleanedPayload, null, 2));
  console.log('Items total:', itemsTotal, 'Gross amount:', grossAmount);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(cleanedPayload),
  });

  const data = await response.json();

  // Log full response for debugging
  console.log('Midtrans API response:', {
    httpStatus: response.status,
    statusCode: data.status_code,
    statusMessage: data.status_message,
    hasTransactionId: !!data.transaction_id,
    fraudStatus: data.fraud_status,
    responseKeys: Object.keys(data),
  });

  // Check for actual errors
  // Midtrans returns HTTP 200 even on errors, but includes status_code in body
  // Success responses have status_code 200 or 201, OR have transaction_id with valid fraud_status
  const hasTransactionId = !!(data.transaction_id || data.id);
  const statusCode = data.status_code;
  const statusMessage = (data.status_message || '').toLowerCase();
  const fraudStatus = data.fraud_status;
  
  // Check if this is actually an error
  // If we have transaction_id, it's likely a success even if status_code is not 200/201
  // Some Midtrans responses return status_code like 201 with message "Qris transaction is created" which is success
  const isActualError = !response.ok || (
    !hasTransactionId && 
    statusCode && 
    statusCode !== 200 && 
    statusCode !== 201
  );

  // Check for specific error indicators
  const hasErrorIndicators = 
    statusMessage.includes('server_key') ||
    statusMessage.includes('unknown merchant') ||
    statusMessage.includes('not activated') ||
    statusMessage.includes('payment channel is not activated') ||
    (fraudStatus && fraudStatus === 'deny') ||
    (data.error_messages && data.error_messages.length > 0);

  if (isActualError || (hasErrorIndicators && !hasTransactionId)) {
    console.error('Midtrans charge error response:', JSON.stringify(data, null, 2));
    console.error('Request payload was:', JSON.stringify(cleanedPayload, null, 2));
    
    // Handle specific error cases
    if (statusMessage.includes('server_key') || statusMessage.includes('unknown merchant')) {
      const baseUrl = getMidtransBaseUrl();
      const isSandbox = baseUrl.includes('sandbox');
      const mode = isSandbox ? 'Sandbox' : 'Production';
      throw new Error(`Invalid Midtrans Server Key. Please check your MIDTRANS_SERVER_KEY in .env file. Make sure you are using the correct ${mode} Server Key (not Client Key). Current mode: ${mode}`);
    }
    
    // Handle payment channel not activated
    if (statusMessage.includes('not activated') || statusMessage.includes('payment channel is not activated')) {
      const channelName = paymentType === 'qris' ? 'QRIS' : paymentType === 'bank_transfer' ? `Virtual Account (${input.channel || 'Bank Transfer'})` : paymentType;
      throw new Error(`Metode pembayaran ${channelName} belum diaktifkan di Midtrans Dashboard. Silakan aktifkan metode pembayaran ini di https://dashboard.midtrans.com/settings/payment_methods`);
    }
    
    // Provide more detailed error message
    const errorDetails = data.error_messages || [];
    const errorMessage = data.status_message || errorDetails[0] || 'Failed to create payment transaction';
    const fullErrorMessage = errorDetails.length > 0 
      ? `${errorMessage}. Details: ${errorDetails.join(', ')}`
      : errorMessage;
    
    throw new Error(fullErrorMessage);
  }

  // Only proceed if we have a successful response (has transaction_id)
  if (!hasTransactionId) {
    console.error('Midtrans response missing transaction_id:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Midtrans: missing transaction ID');
  }

  return mapInstructionFromMidtrans(data, paymentType, input.channel || null);
}

function mapPaymentType(input: MidtransChargeInput) {
  if (input.method === 'VIRTUAL_ACCOUNT') {
    return 'bank_transfer';
  }
  if (input.method === 'QRIS') {
    return 'qris';
  }
  throw new Error(`Unsupported payment method ${input.method} for Midtrans`);
}

function mapBank(channel?: string | null) {
  if (!channel) {
    throw new Error('Virtual account bank is required');
  }
  const normalized = channel.toUpperCase();
  const bank = bankMap[normalized];
  if (!bank) {
    throw new Error(`Unsupported virtual account bank: ${channel}`);
  }
  return bank;
}

function mapInstructionFromMidtrans(
  response: any,
  paymentType: string,
  channel: string | null
): PaymentInstructionResult {
  console.log('mapInstructionFromMidtrans called:', {
    paymentType,
    channel,
    responseKeys: Object.keys(response),
    transactionId: response.transaction_id,
  });

  const baseResult: PaymentInstructionResult = {
    provider: 'MIDTRANS',
    paymentType,
    channel,
    status: PaymentStatus.PENDING,
    transactionId: response.transaction_id ?? null,
    amount: Number(response.gross_amount || 0),
    rawResponse: response,
  };

  if (paymentType === 'bank_transfer') {
    const vaInfo = response.va_numbers?.[0];
    const instructions = response.permata_va_number
      ? 'Gunakan nomor VA Permata untuk menyelesaikan pembayaran.'
      : undefined;

    const vaNumber = vaInfo?.va_number || response.permata_va_number || null;
    const vaBank = (vaInfo?.bank || channel || '').toUpperCase() || null;

    console.log('Bank transfer mapping:', {
      vaInfo,
      vaNumber,
      vaBank,
      va_numbers: response.va_numbers,
      permata_va_number: response.permata_va_number,
    });

    return {
      ...baseResult,
      vaNumber,
      vaBank,
      instructions,
      expiresAt: response.expiry_time || null,
    };
  }

  if (paymentType === 'qris') {
    // Extract QR string - try all possible field names and locations
    let qrString = null;
    
    // Direct fields
    qrString = response.qr_string 
      || response.qr_code 
      || response.qrString
      || response.qrStringValue
      || null;
    
    // From actions array
    if (!qrString && Array.isArray(response.actions)) {
      const qrAction = response.actions.find((action: any) => 
        action.name === 'generate-qr-code' || 
        action.name === 'qr-code' ||
        action.name === 'qr_code' ||
        action.name === 'qris'
      );
      qrString = qrAction?.qr_string 
        || qrAction?.qrString 
        || qrAction?.qr_code
        || qrAction?.value
        || null;
    }
    
    // From nested objects
    if (!qrString && response.qris) {
      qrString = response.qris.qr_string 
        || response.qris.qr_code 
        || response.qris.qrString
        || null;
    }

    // Extract QR image URL - try all possible field names and locations
    let qrImageUrl = null;
    
    // Check actions array for generate-qr-code
    if (Array.isArray(response.actions)) {
      const qrAction = response.actions.find((action: any) => 
        action.name === 'generate-qr-code' || 
        action.name === 'qr-code' ||
        action.name === 'qr_code' ||
        action.name === 'qris' ||
        action.method === 'GET' && action.url?.includes('qr')
      );
      if (qrAction) {
        qrImageUrl = qrAction.url 
          || qrAction.qr_url 
          || qrAction.qrImageUrl
          || qrAction.image_url
          || null;
      }
    }
    
    // Direct response fields
    if (!qrImageUrl) {
      qrImageUrl = response.qr_url 
        || response.qrUrl 
        || response.qr_image_url
        || response.qrImageUrl
        || response.qr_code_url
        || null;
    }
    
    // From nested objects
    if (!qrImageUrl && response.qris) {
      qrImageUrl = response.qris.qr_url 
        || response.qris.qrImageUrl 
        || response.qris.image_url
        || null;
    }

    // Extract payment URL
    const paymentUrl = response.actions?.find((action: any) => 
      action.name === 'deeplink-redirect' || 
      action.name === 'deeplink_redirect' ||
      action.name === 'redirect'
    )?.url || null;

    // Extract expiry time
    const expiresAt = response.expiry_time 
      || response.expiryTime 
      || response.expires_at
      || response.expiresAt
      || null;

    console.log('QRIS mapping result:', {
      qrString: qrString ? `${qrString.substring(0, 30)}...` : null,
      qrImageUrl: qrImageUrl ? 'EXISTS' : null,
      paymentUrl: paymentUrl ? 'EXISTS' : null,
      expiresAt,
      actions: response.actions?.map((a: any) => ({ name: a.name, url: a.url ? 'EXISTS' : null })),
    });

    return {
      ...baseResult,
      qrString,
      qrImageUrl,
      paymentUrl,
      expiresAt,
    };
  }

  return baseResult;
}


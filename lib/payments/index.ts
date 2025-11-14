import { PaymentStatus } from '@prisma/client';
import {
  MidtransChargeInput,
  PaymentInstructionResult as MidtransInstruction,
  createMidtransCharge,
  isMidtransConfigured,
} from './midtrans';

export type SupportedPaymentMethod = 'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS';

export interface CreatePaymentIntentParams extends Omit<MidtransChargeInput, 'method'> {
  method: SupportedPaymentMethod;
}

export interface PaymentInstruction
  extends Omit<MidtransInstruction, 'provider'> {
  provider: 'MIDTRANS' | 'OFFLINE';
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentInstruction> {
  if (params.method === 'COD') {
    return createOfflineInstruction(params);
  }

  if (!isMidtransConfigured()) {
    throw new Error('Midtrans is not configured');
  }

  if (params.method === 'VIRTUAL_ACCOUNT' || params.method === 'QRIS') {
    const midtransInstruction = await createMidtransCharge({
      ...params,
      method: params.method,
    });

    return {
      ...midtransInstruction,
      provider: 'MIDTRANS',
    };
  }

  throw new Error(`Unsupported payment method ${params.method}`);
}

function createOfflineInstruction(params: CreatePaymentIntentParams): PaymentInstruction {
  return {
    provider: 'OFFLINE',
    paymentType: 'cod',
    channel: 'COD',
    status: PaymentStatus.PENDING,
    amount: params.amount,
    instructions: 'Bayar langsung kepada kurir saat pesanan diterima.',
  };
}


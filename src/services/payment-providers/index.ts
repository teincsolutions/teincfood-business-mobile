import type { PaymentProvider } from './types';
import { paystackProvider } from './paystack.provider';

export type { PaymentProvider, ProviderPaymentResult, InitiatePaymentFn } from './types';

const registry = new Map<string, PaymentProvider>();
let activeProviderId = 'paystack';

export function registerProvider(provider: PaymentProvider): void {
  registry.set(provider.id, provider);
}

export function setActiveProvider(id: string): void {
  if (!registry.has(id)) {
    throw new Error(`Payment provider "${id}" is not registered.`);
  }
  activeProviderId = id;
}

export function getActiveProvider(): PaymentProvider {
  const provider = registry.get(activeProviderId);
  if (!provider) {
    throw new Error(`Active payment provider "${activeProviderId}" is not registered.`);
  }
  return provider;
}

export function getProvider(id: string): PaymentProvider {
  const provider = registry.get(id);
  if (!provider) {
    throw new Error(`Payment provider "${id}" is not registered.`);
  }
  return provider;
}

registerProvider(paystackProvider);

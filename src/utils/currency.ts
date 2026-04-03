/**
 * Currency Utility
 * Provides currency formatting and conversion utilities
 */

import { useLocationStore } from '@/stores/location.store';
import { getRegionConfig } from '@/services/region-pricing.service';

/**
 * Default currency code (Ghana Cedis)
 */
export const DEFAULT_CURRENCY = 'GHS';

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  'GHS': 'GH₵',
  'USD': '$',
  'NGN': '₦',
  'KES': 'KSh',
  'EUR': '€',
  'GBP': '£',
};

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code (e.g., 'GHS', 'USD')
 * @returns Currency symbol (e.g., 'GH₵', '$')
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format a price with currency symbol
 * @param amount - Amount in major units (e.g., 25.50)
 * @param currency - Currency code (defaults to DEFAULT_CURRENCY)
 * @returns Formatted price string (e.g., 'GH₵25.50')
 */
export function formatPrice(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
}

/**
 * Format a price in minor units (cents/pesewas) to major units
 * @param amountMinor - Amount in minor units (e.g., 2550 for GH₵25.50)
 * @param currency - Currency code (defaults to DEFAULT_CURRENCY)
 * @returns Formatted price string (e.g., 'GH₵25.50')
 */
export function formatPriceFromMinor(amountMinor: number, currency: string = DEFAULT_CURRENCY): string {
  const amount = amountMinor / 100;
  return formatPrice(amount, currency);
}

/**
 * React hook to get the current currency based on user's location
 * @returns Current currency code
 */
export function useCurrency(): string {
  const location = useLocationStore((state) => state.currentLocation);
  if (location?.countryCode) {
    const config = getRegionConfig(location.countryCode);
    return config.currencyCode;
  }
  return DEFAULT_CURRENCY;
}

/**
 * React hook to get the current currency symbol
 * @returns Current currency symbol
 */
export function useCurrencySymbol(): string {
  const currency = useCurrency();
  return getCurrencySymbol(currency);
}
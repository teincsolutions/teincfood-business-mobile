/**
 * Format a number as a currency string.
 * @param amount - The numeric amount
 * @param currency - ISO currency code (default: 'USD')
 * @returns Formatted currency string, e.g. "$15.99"
 * Now supports region-based formatting
 */
import { getRegionConfig, formatCurrencyByRegion } from '@/services/region-pricing.service';
import { useLocationStore } from '@/stores/location.store';

export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  const location = useLocationStore.getState().currentLocation;
  const config = getRegionConfig(location?.countryCode);
  
  // Convert to minor units (cents/pesewas)
  const amountMinor = Math.round(amount * 100);
  
  return formatCurrencyByRegion(amountMinor, config);
}

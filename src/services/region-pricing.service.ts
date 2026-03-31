/**
 * Region Pricing Service
 * Provides full region pricing strategy with currency/locale formatting
 */

export interface RegionConfig {
  countryCode: string;
  currencyCode: string;
  timezone: string;
  locale: string;
  currencySymbol: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  apiPrefix: string;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  GH: {
    countryCode: 'GH',
    currencyCode: 'GHS',
    timezone: 'Africa/Accra',
    locale: 'en-GH',
    currencySymbol: 'GH₵',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    apiPrefix: '/v1/gh',
  },
  US: {
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US',
    currencySymbol: '$',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    apiPrefix: '/v1/us',
  },
  NG: {
    countryCode: 'NG',
    currencyCode: 'NGN',
    timezone: 'Africa/Lagos',
    locale: 'en-NG',
    currencySymbol: '₦',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    apiPrefix: '/v1/ng',
  },
  KE: {
    countryCode: 'KE',
    currencyCode: 'KES',
    timezone: 'Africa/Nairobi',
    locale: 'en-KE',
    currencySymbol: 'KSh',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    apiPrefix: '/v1/ke',
  },
};

const DEFAULT_CONFIG: RegionConfig = REGION_CONFIGS.GH;

export function getRegionConfig(countryCode?: string): RegionConfig {
  if (!countryCode) return DEFAULT_CONFIG;
  return REGION_CONFIGS[countryCode.toUpperCase()] || DEFAULT_CONFIG;
}

export function formatCurrencyByRegion(
  amountMinor: number,
  config: RegionConfig
): string {
  const amount = amountMinor / 100;
  const formatted = amount.toFixed(config.decimalPlaces);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    config.thousandsSeparator
  );
  const decimalPart = parts[1] || '';
  
  return `${config.currencySymbol}${integerPart}${config.decimalSeparator}${decimalPart}`;
}

export function getApiEndpoint(
  path: string,
  config: RegionConfig
): string {
  return `${config.apiPrefix}${path}`;
}

export function getDateLocale(config: RegionConfig): string {
  return config.locale;
}
import Constants from 'expo-constants';

export function getPaystackCurrency(): string {
  return (
    process.env.EXPO_PUBLIC_PAYSTACK_CURRENCY ||
    Constants.expoConfig?.extra?.paystackCurrency ||
    'GHS'
  );
}

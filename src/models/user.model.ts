export interface User {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  businessLogoUrl?: string; // For sellers
  role: 'seller' | 'rider' | 'buyer';
  businessName?: string; // For sellers
  businessType?: string; // For sellers: Restaurant, Cafe, Bakery, etc.
  businessAddress?: string; // For sellers
  vehicleType?: 'bicycle' | 'motorcycle' | 'car'; // For riders
  vehiclePlateNumber?: string; // For riders
  isOnline?: boolean; // For riders - availability status
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  label: 'home' | 'work' | 'business' | 'other';
  street: string;
  apartment?: string;
  postCode: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'bank_account' | 'mobile_money';
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  isDefault: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SellerSignupRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
}

export interface RiderSignupRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  vehiclePlateNumber?: string;
  dateOfBirth: string;
  nationalIdNumber: string;
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
  sessionId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
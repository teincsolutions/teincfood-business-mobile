// ─── Auth Requests ───

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPRequest {
  phone: string;
  purpose?: 'login' | 'register';
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
  type?: 'login' | 'register';
}

export interface OIDCRequest {
  provider: 'google' | 'apple' | 'facebook';
  id_token: string;
}

// ─── Auth Responses ───

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  phone?: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

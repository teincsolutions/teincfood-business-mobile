import { api } from './api';

export interface PromoValidationRequest {
  code: string;
  subtotal: number;
}

export interface PromoValidationResponse {
  valid: boolean;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  message: string;
}

export const promoService = {
  validatePromo(request: PromoValidationRequest): Promise<PromoValidationResponse> {
    return api.post<{ data: PromoValidationResponse }>('/promo/validate', request).then(res => res.data);
  },
};

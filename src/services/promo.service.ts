import { useMutation } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

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

export function useValidatePromoMutation() {
  return useMutation({
    mutationFn: (request: PromoValidationRequest) => mockBackend.validatePromoCode(request),
  });
}
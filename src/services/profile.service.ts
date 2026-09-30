import { api } from './api';

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export const profileService = {
  async getProfile(): Promise<any> {
    return api.get<any>('/users/me');
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<any> {
    return api.put<any>('/users/me', { user: payload });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return api.post('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async setPassword(newPassword: string): Promise<any> {
    return api.put('/users/me/password/set', { new_password: newPassword });
  },

  async getUser(userId: string): Promise<any> {
    return api.get(`/users/${userId}`);
  },

  async updateEmail(email: string): Promise<any> {
    return api.post('/users/me/email', { email });
  },

  async verifyEmailChange(code: string): Promise<any> {
    return api.post('/users/me/email/verify', { code });
  },

  async updatePhone(phone: string): Promise<any> {
    return api.post('/users/me/phone', { phone });
  },

  async verifyPhoneChange(code: string): Promise<any> {
    return api.post('/users/me/phone/verify', { code });
  },

  /**
   * Permanently delete the authenticated user's account.
   * Backend (DELETE /users/me/delete) anonymizes PII, marks status :deleted
   * and revokes all sessions. Responds 204 with no body. Accounts with a
   * password set must supply `currentPassword` for verification.
   */
  async deleteAccount(currentPassword?: string): Promise<void> {
    await api.delete('/users/me/delete', currentPassword ? { current_password: currentPassword } : undefined);
  },
};

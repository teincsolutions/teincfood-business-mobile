// @ts-nocheck
import { api } from './api';

export interface UploadAvatarResponse {
  avatarUrl: string;
  message: string;
}

export const profileService = {
  /**
   * Upload profile avatar image
   * @param imageUri - Local image URI from image picker
   * @returns Promise with the uploaded avatar URL
   */
  async uploadAvatar(imageUri: string): Promise<UploadAvatarResponse> {
    // Create form data for file upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    
    // Determine file type
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await api.post('/v1/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Delete profile avatar
   */
  async deleteAvatar(): Promise<{ message: string }> {
    const response = await api.delete('/v1/users/me/avatar');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    bio?: string;
  }): Promise<{ user: any; message: string }> {
    const response = await api.patch('/v1/users/me', data);
    return response.data;
  },
};
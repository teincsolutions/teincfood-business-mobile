import type { User, Address } from '@/models/user.model';

export const MOCK_CURRENT_USER: User = {
  id: 'user-1',
  username: 'vishal',
  fullName: 'Vishal Khadok',
  email: 'vishal@teincfoods.com',
  phone: '+1 234 567 8900',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  role: 'buyer',
  bio: 'Food lover & home cook enthusiast',
  createdAt: '2025-11-01T10:00:00Z',
  updatedAt: '2026-03-15T14:30:00Z',
};

export const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    label: 'home',
    street: 'Hason Nagar',
    apartment: '345',
    postCode: '45463',
    fullAddress: '2464 Royal Ln. Mesa, New Jersey 45463',
    latitude: 40.7128,
    longitude: -74.0060,
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'work',
    street: 'Ranchview Dr.',
    apartment: '',
    postCode: '62639',
    fullAddress: '3891 Ranchview Dr. Richardson, California 62639',
    latitude: 34.0522,
    longitude: -118.2437,
    isDefault: false,
  },
];

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'chef-1',
    username: 'rosegarden',
    fullName: 'Rose Garden',
    email: 'roseg@teincfoods.com',
    phone: '+1 500 000 0000',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop',
    role: 'seller',
    bio: 'Specialist in Western fusion',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'chef-2',
    username: 'lorimac',
    fullName: 'Lori Mac',
    email: 'lorimac@teincfoods.com',
    phone: '+1 500 000 0001',
    avatarUrl: 'https://images.unsplash.com/photo-1544168190-79c154273140?w=200&h=200&fit=crop',
    role: 'seller',
    bio: 'Pizza and fast food legend',
    createdAt: '2025-01-02T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  },
  {
    id: 'support-1',
    username: 'teincsupport',
    fullName: 'Teinc Support',
    email: 'support@teincfoods.com',
    phone: '+1 800 000 0000',
    avatarUrl: 'https://images.unsplash.com/photo-1549923746-c50264f33a1e?w=200&h=200&fit=crop',
    role: 'seller', // reused for support chat
    bio: 'Dedicated 24/7 customer support agent',
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
  }
];

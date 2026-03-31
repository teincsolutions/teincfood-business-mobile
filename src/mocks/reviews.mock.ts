import type { Review, ReviewSummary } from '@/models/review.model';

export const MOCK_REVIEW_SUMMARY: ReviewSummary = {
  averageRating: 4.9,
  totalReviews: 20,
  ratingDistribution: {
    5: 14,
    4: 4,
    3: 1,
    2: 1,
    1: 0,
  },
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-1',
    userId: 'user-10',
    userName: 'James Wilson',
    userAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    foodId: 'food-1',
    rating: 5,
    title: 'Great Food and Service',
    comment: "This Food so tasty & delicious. Breakfast so fast Delivered in my place. Chef is very friendly. I'm really like chef for Home Food Order. Thanks.",
    createdAt: '2025-12-20T10:00:00Z',
  },
  {
    id: 'review-2',
    userId: 'user-11',
    userName: 'David Chen',
    userAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    foodId: 'food-1',
    rating: 4,
    title: 'Awesome and Nice',
    comment: 'This Food so tasty & delicious. Breakfast so fast Delivered in my place.',
    createdAt: '2025-12-20T11:00:00Z',
  },
  {
    id: 'review-3',
    userId: 'user-12',
    userName: 'Michael Torres',
    userAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    foodId: 'food-1',
    rating: 4,
    title: 'Awesome and Nice',
    comment: 'This Food so tasty & delicious.',
    createdAt: '2025-12-20T12:00:00Z',
  },
  {
    id: 'review-4',
    userId: 'user-13',
    userName: 'Robert Anderson',
    userAvatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    foodId: 'food-1',
    rating: 4,
    title: 'Awesome and Nice',
    comment: 'This Food so tasty & delicious. Breakfast so fast Delivered in my place.',
    createdAt: '2025-12-20T13:00:00Z',
  },
];

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  foodId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

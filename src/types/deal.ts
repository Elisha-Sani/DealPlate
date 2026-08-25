export interface Deal {
  id: string;
  title: string;
  vendor: string;
  campus: string;
  originalPrice: number;
  dealPrice: number;
  image: string;
  discountPercentage: number;
  timeStart: string;
  timeEnd: string;
  category: string;
  tags: string[];
  description: string;
  briefDescription?: string;
  detailedDescription?: string;
  stockCount: number;
  isPublished?: boolean;
  expiresAt: string; // ISO timestamp — the deal auto-unpublishes once this passes
}

export type DealCategory =
  | 'Bakery'
  | 'Pizza'
  | 'Sushi'
  | 'Burgers'
  | 'Beverages'
  | 'Desserts'
  | 'Other';


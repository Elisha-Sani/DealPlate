/**
 * Seconds remaining until an absolute ISO timestamp, floored at 0. Always
 * computed fresh from wall-clock time rather than stored/decremented state,
 * so it's correct immediately after a reload — never "resets".
 */
export function secondsUntil(isoTimestamp: string): number {
  const remainingMs = new Date(isoTimestamp).getTime() - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Format total seconds into a display string "mm:ss" or "hh:mm:ss".
 */
export function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Generate a random 6-digit numeric pickup code.
 */
export function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generate a random order ID like "order-dp-482917".
 */
export function generateOrderId(): string {
  return `order-dp-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

import { z } from 'zod';

const DealSchema = z.object({
  id: z.string(),
  title: z.string().default('Untitled Deal'),
  vendor: z.string().default('Unknown Vendor'),
  campus: z.string().default('All Campuses'),
  original_price: z.coerce.number().default(0),
  deal_price: z.coerce.number().default(0),
  image: z.string().default(''),
  discount_percentage: z.coerce.number().default(0),
  time_start: z.string().default('00:00'),
  time_end: z.string().default('23:59'),
  category: z.string().default('Other'),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  brief_description: z.string().optional(),
  detailed_description: z.string().optional(),
  stock_count: z.coerce.number().default(0),
  is_published: z.boolean().default(true),
  expires_at: z.string().default(() => new Date().toISOString()),
}).passthrough();

/**
 * Map a Supabase deal row to the frontend Deal type.
 */
export function mapSupabaseDeal(d: Record<string, unknown>) {
  const parsed = DealSchema.safeParse(d);
  if (!parsed.success) {
    console.error('Invalid deal schema:', parsed.error);
    // fallback or throw depending on strictness. Returning partial mapping to prevent crashing.
  }
  const data = parsed.success ? parsed.data : (d as any);

  return {
    id: data.id,
    title: data.title,
    vendor: data.vendor,
    campus: data.campus,
    originalPrice: data.original_price,
    dealPrice: data.deal_price,
    image: data.image,
    discountPercentage: data.discount_percentage,
    timeStart: data.time_start,
    timeEnd: data.time_end,
    category: data.category,
    tags: data.tags,
    description: data.description || data.brief_description || '',
    briefDescription: data.brief_description,
    detailedDescription: data.detailed_description,
    stockCount: data.stock_count,
    isPublished: data.is_published !== false,
    expiresAt: data.expires_at,
  };
}


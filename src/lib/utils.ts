/**
 * Parse a duration string "hh:mm:ss" into total seconds.
 */
export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 3600; // default 1 hour
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

/**
 * Map a Supabase deal row to the frontend Deal type.
 */
export function mapSupabaseDeal(d: Record<string, unknown>) {
  return {
    id: d.id as string,
    title: d.title as string,
    vendor: d.vendor as string,
    campus: d.campus as string,
    originalPrice: d.original_price as number,
    dealPrice: d.deal_price as number,
    image: d.image as string,
    discountPercentage: d.discount_percentage as number,
    timeStart: d.time_start as string,
    timeEnd: d.time_end as string,
    category: d.category as string,
    tags: (d.tags as string[]) || [],
    description: (d.description as string) || (d.brief_description as string) || '',
    briefDescription: d.brief_description as string | undefined,
    detailedDescription: d.detailed_description as string | undefined,
    stockCount: d.stock_count as number,
    durationRemaining: (d.duration_remaining as string) || '00:00:00',
  };
}

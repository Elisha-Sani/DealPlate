// Brand colors
export const COLORS = {
  primary: '#FF6B00',
  primaryHover: '#e66000',
  accent: '#E11D48',
  textPrimary: '#111827',
  textSecondary: '#5a4136',
  bgWarm: '#FFF8F6',
  border: '#F3F4F6',
  mpesaGreen: '#26B24B',
  vendorDark: '#1E293B',
  vendorBorder: '#E2E8F0',
} as const;

// Supported universities
export const UNIVERSITIES = [
  'Technical University of Kenya',
  'University of Nairobi',
  'Kenyatta University',
  'Jomo Kenyatta University (JKUAT)',
  'Strathmore University',
  'Multimedia University of Kenya',
  'Daystar University',
  'USIU Africa',
] as const;

// Campus locations for deal filtering
export const CAMPUSES = [
  { value: 'all', label: 'All Campuses' },
  { value: 'Main Campus', label: 'Main Campus' },
  { value: 'Lower Kabete', label: 'Lower Kabete' },
  { value: 'Chiromo', label: 'Chiromo' },
  { value: 'Parklands', label: 'Parklands' },
] as const;

// Service fee charged on each order (KES)
export const SERVICE_FEE = 20;

// Pickup window duration in seconds (15 minutes)
export const PICKUP_WINDOW_SECONDS = 900;

// Default avatar URL
export const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCvM9To3E1snhhIaUyvYK--vVdgJPDYXEXqt3wlV-t24DuJWjJD0btsklmPbN4ahTRJpUzp51b_fa68_qXZeSgMlX7EdPkqCq4y4c0rlR_f2T1xKqhkpSCXcPmiC69WrdAnm7U0mHrl3hItLZHLCAXtJBhZ9Bm57r-CNs2znXGoymmEJzcqikWqzIRqDGuYGUi1bQlFr39ED3hPpU2z-mZ-_YQhRetaWZw9QyPPXF1_c4Wl0nhfRmC5zFQ0z4e97wpOvgWv2ehl6H8';

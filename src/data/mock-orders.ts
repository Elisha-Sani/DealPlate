import type { Order } from '@/types';
import { mockDeals } from './mock-deals';

export const mockPastOrders: Order[] = [
  {
    id: 'ord-101',
    deal: mockDeals[0], // Morning Bakery Mystery Bag
    date: 'Oct 12, 2026',
    time: '2:15 PM',
    status: 'Active',
    totalPaid: 320, // 300 deal + 20 fee
    pickupCode: '849201',
    pickupDeadline: '4:00 PM',
  },
  {
    id: 'ord-100',
    deal: mockDeals[1], // Late Night Pizza Surplus
    date: 'Oct 10, 2026',
    time: '8:45 PM',
    status: 'Completed',
    totalPaid: 470,
  },
  {
    id: 'ord-099',
    deal: mockDeals[5], // KFC
    date: 'Oct 08, 2026',
    time: '7:10 PM',
    status: 'Completed',
    totalPaid: 400,
  },
  {
    id: 'ord-098',
    deal: mockDeals[6], // Pilau
    date: 'Oct 05, 2026',
    time: '2:40 PM',
    status: 'Cancelled',
    totalPaid: 170,
  },
  {
    id: 'ord-097',
    deal: mockDeals[8], // Dessert Box
    date: 'Oct 01, 2026',
    time: '9:00 PM',
    status: 'Completed',
    totalPaid: 420,
  }
];

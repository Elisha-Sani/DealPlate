import type { Deal } from './deal';

export type OrderStatus = 'Completed' | 'Pending' | 'Cancelled' | 'Active';

export interface Order {
  id: string;
  deal: Deal;
  date: string;
  time: string;
  status: OrderStatus;
  totalPaid: number;
  pickupCode?: string;
  pickupDeadline?: string;
}

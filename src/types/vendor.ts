export interface VendorItem {
  id: string;
  title: string;
  originalPrice: number;
  dealPrice: number;
  stock: number;
}

export type VendorOrderStatus = 'Awaiting Pickup' | 'Collected';

export interface VendorOrder {
  id: string;
  studentName: string;
  studentPhone: string;
  institution: string;
  mpesaRef: string;
  status: VendorOrderStatus;
  dealTitle: string;
}

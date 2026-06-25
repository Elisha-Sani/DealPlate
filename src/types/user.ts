export interface User {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  university: string;
  regNumber: string;
  isVerified: boolean;
  avatar: string;
  totalSaved: number;
  mealsEnjoyed: number;
}

export interface SignUpFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface VerifyFormData {
  university: string;
  regNumber: string;
}

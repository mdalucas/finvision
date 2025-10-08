export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string; // uuid
  title: string;
  value: number;
  date: string; // ISO
  category?: string;
  type: TransactionType;
  showOnDashboard: boolean; // flag
  installmentId?: string | null; // if generated from a parcelado
  createdAt?: string;
  updatedAt?: string;
}

export interface InstallmentPlan {
  id: string;
  title: string;
  totalValue: number;
  installmentValue?: number; // optional if totalValue and count given
  count: number;
  startDate: string; // date of first installment
  category?: string;
  showOnDashboard: boolean; // default false (spec says not show)
  createdAt?: string;
}

export interface MonthlyFilter {
  month: number; // 1-12
  year: number;
}

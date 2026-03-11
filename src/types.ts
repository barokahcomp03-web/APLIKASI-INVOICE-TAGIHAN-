export interface User {
  id: number;
  username: string;
  role: 'admin' | 'technician';
}

export interface CompanyInfo {
  id: number;
  name: string;
  address: string;
  logo_url: string;
  signature_url: string;
  npwp: string;
  phone: string;
  email: string;
  website: string;
  signatory_name: string;
  signatory_role: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
}

export interface StockItem {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  min_stock: number;
  price: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface SubmissionItem {
  id?: number;
  submission_id?: number;
  item_name: string;
  description: string;
  quantity: number;
  price: number;
  is_from_stock: boolean;
  stock_id?: number;
}

export interface Submission {
  id: number;
  technician_id: number;
  technician_name?: string;
  type: 'invoice' | 'receipt';
  status: 'pending' | 'validated' | 'rejected';
  client_name: string;
  client_address: string;
  due_date: string;
  payment_status: 'unpaid' | 'paid';
  other_costs: number;
  other_costs_description: string;
  ppn: number;
  down_payment: number;
  total_amount: number;
  created_at: string;
  items?: SubmissionItem[];
}

export interface Document {
  id: number;
  name: string;
  file_url: string;
  uploaded_at: string;
}

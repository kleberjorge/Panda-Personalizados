export enum Unit { UN = 'UN', KG = 'KG', L = 'L', M = 'M', M2 = 'M2' }
export enum Role { ADMIN = 'ADMIN', EMPLOYEE = 'EMPLOYEE' }
export enum PaymentMethod { PIX = 'PIX', CARD = 'CARD', CASH = 'CASH' }

export interface SystemConfig {
  dailyMessage: string;
}

export interface PayrollConfig {
  salaryType: 'FIXED' | 'PROFIT_SHARE';
  baseValue: number; // Fixed salary amount OR Percentage
  cutoffDay: number; // Day of month to generate slip
  wastePenaltyPercent?: number; // New: Percentage of cost to deduct for excess waste
}

export interface PayrollTransaction {
  id: string;
  userId: string;
  userName: string;
  type: 'ADVANCE' | 'SALARY_SLIP'; 
  amount: number;
  date: string;
  status: 'PENDING' | 'PAID';
  description?: string;
  details?: {
    base: number;
    bonus: number;
    advances: number;
    wastePenalty?: number; // New: Track deduction
  };
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  payrollConfig?: PayrollConfig;
}

export interface Material {
  id: string;
  name: string;
  unit: Unit;
  costPerUnit: number;
  currentStock: number;
  minStock: number;
  lossPercentage: number;
}

export interface Product {
  id: string;
  name: string;
  isKit: boolean;
  materials: { materialId: string; quantity: number }[];
  sellingPrice: number;
  laborCost: number;
}

export interface Marketplace {
  id: string;
  name: string;
  fixedFee: number;
  variableFeePercent: number;
  adsFeePercent: number;
  shippingCost: number;
  taxPercent: number;
}

export interface Sale {
  id: string;
  date: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  marketplaceId: string;
  platform: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  netRevenue: number;
  costSnapshot?: number; 
  feeSnapshot?: number; 
  customerName?: string;
  status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string; 
}

export interface OperationalTarget {
  id: string;
  metricName: string;
  targetDaily: number;
  unitRate: number;
}

export interface OperationalLog {
  id: string;
  date: string;
  metricName: string;
  value: number;
}

export interface InventoryTransaction {
  id: string;
  date: string;
  materialId: string;
  materialName: string;
  type: 'ADD' | 'LOSS';
  quantity: number;
  userName?: string;
  userId?: string; // New: Track who made the transaction for penalty calculation
}
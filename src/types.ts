export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  driverId: string;
  passengerName: string;
  fare: number;
  observation: string;
  isPaid: boolean;
  createdAt: string;
}

export type ExpenseCategory = 'dulces' | 'agua' | 'bebida' | 'comida' | 'otros';

export interface Expense {
  id: string;
  driverId: string;
  category: ExpenseCategory;
  amount: number;
  observation: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  driverId: string;
  oilChangeKm: number;
  oilChangeDurationKm: number;
  currentKm: number;
  observation: string;
  createdAt: string;
}

export interface GasLoad {
  id: string;
  driverId: string;
  liters: number;
  price: number;
  currentKm: number;
  observation: string;
  createdAt: string;
}

export interface MockState {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
  } | null;
  trips: Trip[];
  expenses: Expense[];
  maintenances: Maintenance[];
  gasLoads: GasLoad[];
}

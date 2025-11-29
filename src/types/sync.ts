export interface SyncResult {
  success: boolean;
  productsUpdated: number;
  customersUpdated: number;
  employeesUpdated: number;
  banksUpdated: number;
  errors: string[];
}

export interface SendResult {
  success: boolean;
  transactionsSent: number;
  errors: string[];
}

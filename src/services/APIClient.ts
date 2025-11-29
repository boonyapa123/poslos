import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiProduct,
  ApiCustomer,
  ApiEmployee,
  ApiBankAccount,
  ApiTransaction,
  ApiResponse,
} from '../types/api';

class APIClient {
  private static instance: APIClient;
  private axiosInstance: AxiosInstance;
  private baseURL: string = '';
  private apiKey: string = '';
  private terminalId: string = '';

  private constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        if (this.terminalId) {
          config.headers['X-Terminal-ID'] = this.terminalId;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Network Error:', error.message);
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  public configure(baseURL: string, apiKey: string, terminalId: string): void {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.terminalId = terminalId;
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<any>>('/health');
      return response.data.success === true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  public async fetchProducts(): Promise<ApiProduct[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ApiProduct[]>>('/products');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  public async fetchCustomers(): Promise<ApiCustomer[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ApiCustomer[]>>('/customers');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch customers');
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  public async fetchEmployees(): Promise<ApiEmployee[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ApiEmployee[]>>('/employees');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch employees');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  public async fetchBankAccounts(): Promise<ApiBankAccount[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ApiBankAccount[]>>('/bank-accounts');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch bank accounts');
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  }

  public async sendTransactions(transactions: ApiTransaction[]): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>(
        '/transactions',
        { transactions }
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send transactions');
      }
    } catch (error) {
      console.error('Error sending transactions:', error);
      throw error;
    }
  }

  // Send transactions in DOCINFO + SKUMOVE format (ตามโครงสร้าง Excel ชีท 14-15)
  public async sendTransactionsExcelFormat(docInfos: any[], skuMoves: any[]): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>(
        '/sync/sales',
        {
          docInfo: docInfos,
          skuMove: skuMoves,
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send transactions');
      }
    } catch (error) {
      console.error('Error sending transactions (Excel format):', error);
      throw error;
    }
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public isConfigured(): boolean {
    return this.baseURL !== '' && this.apiKey !== '';
  }
}

export default APIClient;

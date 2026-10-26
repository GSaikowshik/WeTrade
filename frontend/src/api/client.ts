import {
  User,
  Asset,
  Bar,
  Quote,
  PortfolioSummary,
  Order,
  LedgerEntry,
  Execution,
  JournalEntry,
  AnalyticsSummary,
  OrderSide,
  OrderType,
  CryptoTicker
} from '../types';

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE = RAW_API_URL
  ? RAW_API_URL.endsWith('/api/v1')
    ? RAW_API_URL
    : `${RAW_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('wetrade_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('wetrade_token', token);
    } else {
      localStorage.removeItem('wetrade_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (response.status === 405) {
        throw new Error('405 Method Not Allowed: The frontend is hitting a static route instead of the backend. Make sure VITE_API_URL is configured in your Vercel project settings.');
      }
      throw new Error(`API returned non-JSON response (${response.status} ${response.statusText}). Verify that VITE_API_URL points to your active Render backend.`);
    }

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMsg = errorData.detail;
          } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
            errorMsg = errorData.detail[0].msg;
          } else {
            errorMsg = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, fullName?: string) {
    const res = await this.request<{ access_token: string; email: string; full_name?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; email: string; full_name?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  logout() {
    this.setToken(null);
  }

  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }

  // Assets
  async getAssets(query?: string): Promise<Asset[]> {
    const url = query ? `/assets?query=${encodeURIComponent(query)}` : '/assets';
    return this.request<Asset[]>(url);
  }

  async getAsset(assetId: number): Promise<Asset> {
    return this.request<Asset>(`/assets/${assetId}`);
  }

  async getAssetQuotes(assetId: number): Promise<Quote[]> {
    return this.request<Quote[]>(`/assets/${assetId}/quotes`);
  }

  async getAssetBars(assetId: number, interval = '1D'): Promise<Bar[]> {
    return this.request<Bar[]>(`/assets/${assetId}/bars?interval=${interval}`);
  }

  // Crypto Market Data (Binance Public Spot)
  async getCryptoTickers(): Promise<CryptoTicker[]> {
    return this.request<CryptoTicker[]>('/crypto/tickers');
  }

  async getCryptoTicker(symbol: string): Promise<CryptoTicker> {
    return this.request<CryptoTicker>(`/crypto/ticker?symbol=${encodeURIComponent(symbol)}`);
  }

  // Watchlist
  async getWatchlist(): Promise<{ id: number; asset_id: number; asset: Asset; created_at: string }[]> {
    return this.request('/watchlist');
  }

  async addToWatchlist(assetId: number) {
    return this.request('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ asset_id: assetId }),
    });
  }

  async removeFromWatchlist(assetId: number) {
    return this.request(`/watchlist/${assetId}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async submitOrder(data: {
    asset_id: number;
    side: OrderSide;
    order_type: OrderType;
    quantity: number;
    limit_price?: number;
    idempotency_key?: string;
  }): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(statusFilter?: string): Promise<Order[]> {
    const url = statusFilter ? `/orders?status=${statusFilter}` : '/orders';
    return this.request<Order[]>(url);
  }

  async cancelOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  // Portfolio & History
  async getPortfolio(): Promise<PortfolioSummary> {
    return this.request<PortfolioSummary>('/portfolio');
  }

  async getLedger(): Promise<LedgerEntry[]> {
    return this.request<LedgerEntry[]>('/ledger');
  }

  async getExecutions(): Promise<Execution[]> {
    return this.request<Execution[]>('/executions');
  }

  // Journal
  async getJournal(assetId?: number): Promise<JournalEntry[]> {
    const url = assetId ? `/journal?asset_id=${assetId}` : '/journal';
    return this.request<JournalEntry[]>(url);
  }

  async createJournal(data: {
    thesis: string;
    asset_id?: number;
    order_id?: number;
    planned_entry?: number;
    planned_stop?: number;
    planned_target?: number;
    exit_reason?: string;
    lesson_learned?: string;
  }): Promise<JournalEntry> {
    return this.request<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJournal(id: number, data: Partial<JournalEntry>): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteJournal(id: number): Promise<void> {
    return this.request<void>(`/journal/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics/summary');
  }
}

export const api = new ApiClient();


import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type { PortfolioItem } from '@store/portfolioStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://navish-arc.site/api/v1';

export async function getPublicPortfolio(category?: string): Promise<PortfolioItem[]> {
  const timestamp = Date.now();
  const baseUrl = category
    ? `${BASE_URL}/portfolio?category=${encodeURIComponent(category)}`
    : `${BASE_URL}/portfolio`;
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_t=${timestamp}`;

  // Do NOT pass Bearer Token here; it's a public request
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch public portfolio: ${response.status}`);
  }
  const data = await response.json();
  const items = data.items || data.portfolio || data.data || data;
  return (Array.isArray(items) ? items : []) as PortfolioItem[];
}

export async function getPublicPortfolioItem(id: string): Promise<PortfolioItem> {
  const timestamp = Date.now();
  const url = `${BASE_URL}/portfolio/${id}?_t=${timestamp}`;

  // Do NOT pass Bearer Token here; it's a public request
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch public portfolio item: ${response.status}`);
  }
  const data = await response.json();
  const item = data.data || data.portfolio || data;
  return item as PortfolioItem;
}

export async function createPortfolioItem(
  itemData: Omit<PortfolioItem, 'id' | 'createdAt'>,
): Promise<PortfolioItem> {
  try {
    const res = await apiClient.post<ApiEnvelope<PortfolioItem>>('/portfolio', itemData);
    const data = res.data?.data ?? res.data;
    if (data && typeof data === 'object' && (data as PortfolioItem).id) {
      return data as PortfolioItem;
    }
  } catch (err) {
    console.warn('Backend portfolio creation call failed, fallback to store:', err);
  }
  return {
    ...itemData,
    id: `port_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}

export async function updatePortfolioItem(
  id: string,
  updates: Partial<PortfolioItem>,
): Promise<PortfolioItem> {
  try {
    const res = await apiClient.put<ApiEnvelope<PortfolioItem>>(`/portfolio/${id}`, updates);
    const data = res.data?.data ?? res.data;
    if (data && typeof data === 'object') {
      return data as PortfolioItem;
    }
  } catch (err) {
    console.warn('Backend portfolio update call failed, fallback to store:', err);
  }
  return { id, ...updates } as PortfolioItem;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  try {
    await apiClient.delete(`/portfolio/${id}`);
  } catch (err) {
    console.warn('Backend portfolio deletion call failed:', err);
  }
}

export const portfolioApi = {
  list: (category?: string) => getPublicPortfolio(category),

  get: (id: string) =>
    getPublicPortfolioItem(id).catch(() =>
      apiClient
        .get<ApiEnvelope<PortfolioItem>>(`/portfolio/${id}`)
        .then((res) => (res.data?.data ?? res.data) as PortfolioItem),
    ),

  create: (itemData: Omit<PortfolioItem, 'id' | 'createdAt'>) => createPortfolioItem(itemData),

  update: (id: string, updates: Partial<PortfolioItem>) => updatePortfolioItem(id, updates),

  remove: (id: string) => deletePortfolioItem(id),
};



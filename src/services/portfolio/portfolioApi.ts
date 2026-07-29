import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type { PortfolioItem } from '@store/portfolioStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://navish-arc.site/api/v1';

export async function getPublicPortfolio(category?: string): Promise<PortfolioItem[]> {
  const url = category
    ? `${BASE_URL}/portfolio?category=${encodeURIComponent(category)}`
    : `${BASE_URL}/portfolio`;

  // Do NOT pass Bearer Token here; it's a public request
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch public portfolio: ${response.status}`);
  }
  const data = await response.json();
  const items = data.items || data.portfolio || data.data || data;
  return (Array.isArray(items) ? items : []) as PortfolioItem[];
}

export const portfolioApi = {
  list: (category?: string) => getPublicPortfolio(category),

  get: (id: string) =>
    apiClient
      .get<ApiEnvelope<PortfolioItem>>(`/portfolio/${id}`)
      .then((res) => (res.data?.data ?? res.data) as PortfolioItem),
};


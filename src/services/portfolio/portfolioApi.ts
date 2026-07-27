import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type { PortfolioItem } from '@store/portfolioStore';

export const portfolioApi = {
  list: () =>
    apiClient
      .get<ApiEnvelope<PortfolioItem[]>>('/portfolio')
      .then((res) => {
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []) as PortfolioItem[];
      }),

  get: (id: string) =>
    apiClient
      .get<ApiEnvelope<PortfolioItem>>(`/portfolio/${id}`)
      .then((res) => (res.data?.data ?? res.data) as PortfolioItem),
};

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://navish-arc.site/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

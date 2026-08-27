import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  modelUrl?: string;
  vrUrl?: string;
  thumbnailUrl?: string;
  sizeBytes?: number;
  format?: string;
  isPublic: boolean;
  createdAt: string;
}

interface PortfolioState {
  items: PortfolioItem[];
  addItem: (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => PortfolioItem;
  updateItem: (id: string, updates: Partial<PortfolioItem>) => void;
  removeItem: (id: string) => void;
}

const INITIAL_PORTFOLIO_ITEMS: PortfolioItem[] = [];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      items: INITIAL_PORTFOLIO_ITEMS,
      addItem: (itemData) => {
        const newItem: PortfolioItem = {
          ...itemData,
          id: `port_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ items: [newItem, ...state.items] }));
        return newItem;
      },
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: 'navish-arc-portfolio-store' },
  ),
);

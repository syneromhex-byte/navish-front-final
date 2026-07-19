import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '@app-types/project.types';

// crypto.randomUUID() only exists in secure contexts (https:// or localhost)
// — this app is also opened over plain http:// on phones during testing, so
// it needs an id generator that works everywhere.
function generateClientId(): string {
  return `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface ContactInquiry {
  name: string;
  email: string;
  company?: string;
  projectType?: string;
  message: string;
}

export interface ClientRegistration {
  name: string;
  email: string;
}

interface ClientState {
  clients: Client[];
  addClientFromContact: (inquiry: ContactInquiry) => void;
  addClientFromRegistration: (registration: ClientRegistration) => void;
}

// Persisted so clients an admin has already seen (via Contact or
// registration) survive a page reload — no backend/database exists yet to
// hold this durably otherwise.
export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      clients: [],
      addClientFromContact: (inquiry) =>
        set((state) => {
          const existing = state.clients.find(
            (client) => client.email.toLowerCase() === inquiry.email.toLowerCase(),
          );

          if (existing) {
            const updated: Client = {
              ...existing,
              name: inquiry.name,
              company: inquiry.company || existing.company,
              projectType: inquiry.projectType || existing.projectType,
              message: inquiry.message,
              createdAt: new Date().toISOString(),
            };
            return {
              clients: state.clients.map((client) =>
                client.id === existing.id ? updated : client,
              ),
            };
          }

          const newClient: Client = {
            id: generateClientId(),
            name: inquiry.name,
            email: inquiry.email,
            company: inquiry.company,
            projectType: inquiry.projectType,
            message: inquiry.message,
            projectCount: 0,
            createdAt: new Date().toISOString(),
          };
          return { clients: [newClient, ...state.clients] };
        }),
      // Every visitor who signs up (or signs in for the first time) becomes
      // a client the studio can see and share models with, even if they
      // never used the Contact form.
      addClientFromRegistration: (registration) =>
        set((state) => {
          const existing = state.clients.find(
            (client) => client.email.toLowerCase() === registration.email.toLowerCase(),
          );
          if (existing) return state;

          const newClient: Client = {
            id: generateClientId(),
            name: registration.name,
            email: registration.email,
            projectCount: 0,
            createdAt: new Date().toISOString(),
          };
          return { clients: [newClient, ...state.clients] };
        }),
    }),
    { name: 'navish-arc-clients' },
  ),
);

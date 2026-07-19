import type { User } from '@app-types/user.types';

/**
 * There's no backend yet, so these are the two accounts used to demo the
 * admin/client split — one owner-side login, one client-side login. Any
 * project whose `clientEmail` matches DEMO_CLIENT.email shows up on that
 * client's "My Models" page.
 */
export const DEMO_ADMIN: User = {
  id: 'demo-admin',
  name: 'Navish',
  email: 'navishstudioarchitects@gmail.com',
  role: 'admin',
};

/**
 * Placeholder only — NOT the studio's real password. A real password check
 * requires a backend that hashes and verifies it server-side; anything
 * written here ships in the public JS bundle and is readable by anyone who
 * opens dev tools. Swap this whole gate out once a real auth API exists.
 */
export const DEMO_ADMIN_PASSWORD = 'studio-demo-2026';

export const DEMO_CLIENT: User = {
  id: 'demo-client',
  name: 'Aarav Mehta',
  email: 'client@navisharc.com',
  role: 'client',
};

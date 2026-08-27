import type { User } from '@app-types/user.types';

/**
 * @deprecated — These demo accounts are retained ONLY for backward
 * compatibility with any code that may still import them. Real authentication
 * now happens entirely through the backend API. Do NOT use these constants for
 * any authentication logic — passwords are never validated client-side.
 *
 * The plaintext password has been removed for security: shipping a password
 * in the JS bundle is a vulnerability even when it's just a demo credential.
 */
export const DEMO_ADMIN: User = {
  id: 'demo-admin',
  firstName: 'Navish',
  lastName: 'Studio',
  name: 'Navish',
  email: 'navishstudioarchitects@gmail.com',
  role: 'admin',
};

/** @deprecated — Password checking is now handled by the backend via bcrypt. */
export const DEMO_ADMIN_PASSWORD = '';

export const DEMO_CLIENT: User = {
  id: 'demo-client',
  firstName: 'Aarav',
  lastName: 'Mehta',
  name: 'Aarav Mehta',
  email: 'client@navisharc.com',
  role: 'client',
};

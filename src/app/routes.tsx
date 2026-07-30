/* eslint-disable react-refresh/only-export-components -- route config file, exports `router` only, not a component boundary */
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@app/layouts/PublicLayout';
import { DashboardLayout } from '@app/layouts/DashboardLayout';
import { ClientLayout } from '@app/layouts/ClientLayout';
import { ViewerLayout } from '@app/layouts/ViewerLayout';
import { ProtectedRoute } from '@app/ProtectedRoute';
import { Loader } from '@components/common';
import { lazyWithRetry } from '@utils/lazyWithRetry';

// ─── Route Error Fallback (Fix 3: React Router errorElement UX Improvement) ──

const RouteErrorElement = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-0 px-6 text-center">
    <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-surface-50 p-8 shadow-xl dark:border-surface-800 dark:bg-surface-900">
      <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
        A new version is available!
      </h2>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        The application updated or encountered a loading error. Please refresh the page to load the latest version.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-xl bg-brand-primary px-5 py-2.5 font-medium text-white shadow-md transition-all hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// ─── Public pages (Fix 1: Auto-Reload on Chunk Failure in React) ─────────────

const Home = lazyWithRetry(() => import('@pages/Home'));
const Portfolio = lazyWithRetry(() => import('@pages/Portfolio'));
const Projects = lazyWithRetry(() => import('@pages/Projects'));
const Services = lazyWithRetry(() => import('@pages/Services'));
const Contact = lazyWithRetry(() => import('@pages/Contact'));

// ─── Auth pages ───────────────────────────────────────────────────────────────

const Login = lazyWithRetry(() => import('@pages/Auth/Login'));
const Register = lazyWithRetry(() => import('@pages/Auth/Register'));
const ForgotPassword = lazyWithRetry(() => import('@pages/Auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('@pages/Auth/ResetPassword'));

// ─── Dashboard pages (admin / architect) ─────────────────────────────────────

const DashboardOverview = lazyWithRetry(() => import('@pages/Dashboard/Overview'));
const DashboardProjects = lazyWithRetry(() => import('@pages/Dashboard/Projects'));
const DashboardPortfolio = lazyWithRetry(() => import('@pages/Dashboard/Portfolio'));
const DashboardClients = lazyWithRetry(() => import('@pages/Dashboard/Clients'));
const DashboardSettings = lazyWithRetry(() => import('@pages/Dashboard/Settings'));

// ─── Client pages ─────────────────────────────────────────────────────────────

const MyModels = lazyWithRetry(() => import('@pages/Client/MyModels'));

// ─── Viewer pages ─────────────────────────────────────────────────────────────

const ViewerPage = lazyWithRetry(() => import('@pages/Viewer/ViewerPage'));
const VRPage = lazyWithRetry(() => import('@pages/Viewer/VRPage'));
const ShareViewer = lazyWithRetry(() => import('@pages/Viewer/ShareViewer'));

// ─── Fallback ─────────────────────────────────────────────────────────────────

const NotFound = lazyWithRetry(() => import('@pages/NotFound'));

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-0">
          <Loader size="lg" />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // ─── Marketing / public ───────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { path: '/', element: withSuspense(<Home />) },
      { path: '/portfolio', element: withSuspense(<Portfolio />) },
      { path: '/projects', element: withSuspense(<Projects />) },
      { path: '/services', element: withSuspense(<Services />) },
      { path: '/contact', element: withSuspense(<Contact />) },
    ],
  },

  // ─── Auth pages (guest-accessible) ───────────────────────────────────────
  { path: '/login', element: withSuspense(<Login />), errorElement: <RouteErrorElement /> },
  { path: '/register', element: withSuspense(<Register />), errorElement: <RouteErrorElement /> },
  { path: '/forgot-password', element: withSuspense(<ForgotPassword />), errorElement: <RouteErrorElement /> },
  { path: '/reset-password', element: withSuspense(<ResetPassword />), errorElement: <RouteErrorElement /> },

  // ─── Admin / architect dashboard ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin', 'architect']} />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(<DashboardOverview />) },
          { path: 'projects', element: withSuspense(<DashboardProjects />) },
          { path: 'portfolio', element: withSuspense(<DashboardPortfolio />) },
          { path: 'clients', element: withSuspense(<DashboardClients />) },
          { path: 'settings', element: withSuspense(<DashboardSettings />) },
        ],
      },
    ],
  },

  // ─── Client portal ────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['client', 'viewer']} />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        element: <ClientLayout />,
        children: [{ path: '/my-models', element: withSuspense(<MyModels />) }],
      },
    ],
  },

  // ─── Viewer (publicly accessible) ────────────────────────────────────────
  {
    element: <ViewerLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { path: '/viewer/:projectId', element: withSuspense(<ViewerPage />) },
      { path: '/viewer/:projectId/vr', element: withSuspense(<VRPage />) },
    ],
  },

  // ─── Public share link (no auth required) ────────────────────────────────
  {
    element: <ViewerLayout />,
    errorElement: <RouteErrorElement />,
    children: [{ path: '/share/:shareToken', element: withSuspense(<ShareViewer />) }],
  },

  // ─── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: withSuspense(<NotFound />), errorElement: <RouteErrorElement /> },
]);

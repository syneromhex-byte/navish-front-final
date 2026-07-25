/* eslint-disable react-refresh/only-export-components -- route config file, exports `router` only, not a component boundary */
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@app/layouts/PublicLayout';
import { DashboardLayout } from '@app/layouts/DashboardLayout';
import { ClientLayout } from '@app/layouts/ClientLayout';
import { ViewerLayout } from '@app/layouts/ViewerLayout';
import { ProtectedRoute } from '@app/ProtectedRoute';
import { Loader } from '@components/common';

// ─── Public pages ─────────────────────────────────────────────────────────────

const Home = lazy(() => import('@pages/Home'));
const Portfolio = lazy(() => import('@pages/Portfolio'));
const Projects = lazy(() => import('@pages/Projects'));
const Services = lazy(() => import('@pages/Services'));
const Contact = lazy(() => import('@pages/Contact'));

// ─── Auth pages ───────────────────────────────────────────────────────────────

const Login = lazy(() => import('@pages/Auth/Login'));
const Register = lazy(() => import('@pages/Auth/Register'));
const ForgotPassword = lazy(() => import('@pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@pages/Auth/ResetPassword'));

// ─── Dashboard pages (admin / architect) ─────────────────────────────────────

const DashboardOverview = lazy(() => import('@pages/Dashboard/Overview'));
const DashboardProjects = lazy(() => import('@pages/Dashboard/Projects'));
const DashboardPortfolio = lazy(() => import('@pages/Dashboard/Portfolio'));
const DashboardClients = lazy(() => import('@pages/Dashboard/Clients'));
const DashboardSettings = lazy(() => import('@pages/Dashboard/Settings'));

// ─── Client pages ─────────────────────────────────────────────────────────────

const MyModels = lazy(() => import('@pages/Client/MyModels'));

// ─── Viewer pages ─────────────────────────────────────────────────────────────

const ViewerPage = lazy(() => import('@pages/Viewer/ViewerPage'));
const VRPage = lazy(() => import('@pages/Viewer/VRPage'));
const ShareViewer = lazy(() => import('@pages/Viewer/ShareViewer'));

// ─── Fallback ─────────────────────────────────────────────────────────────────

const NotFound = lazy(() => import('@pages/NotFound'));

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
    children: [
      { path: '/', element: withSuspense(<Home />) },
      { path: '/portfolio', element: withSuspense(<Portfolio />) },
      { path: '/projects', element: withSuspense(<Projects />) },
      { path: '/services', element: withSuspense(<Services />) },
      { path: '/contact', element: withSuspense(<Contact />) },
    ],
  },

  // ─── Auth pages (guest-accessible) ───────────────────────────────────────
  { path: '/login', element: withSuspense(<Login />) },
  { path: '/register', element: withSuspense(<Register />) },
  { path: '/forgot-password', element: withSuspense(<ForgotPassword />) },
  { path: '/reset-password', element: withSuspense(<ResetPassword />) },

  // ─── Admin / architect dashboard ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin', 'architect']} />,
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
    children: [
      {
        element: <ClientLayout />,
        children: [{ path: '/my-models', element: withSuspense(<MyModels />) }],
      },
    ],
  },

  // ─── Viewer (any authenticated user) ─────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ViewerLayout />,
        children: [
          { path: '/viewer/:projectId', element: withSuspense(<ViewerPage />) },
          { path: '/viewer/:projectId/vr', element: withSuspense(<VRPage />) },
        ],
      },
    ],
  },

  // ─── Public share link (no auth required) ────────────────────────────────
  {
    element: <ViewerLayout />,
    children: [{ path: '/share/:shareToken', element: withSuspense(<ShareViewer />) }],
  },

  // ─── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: withSuspense(<NotFound />) },
]);

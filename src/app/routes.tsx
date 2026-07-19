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

const Home = lazy(() => import('@pages/Home'));
const Portfolio = lazy(() => import('@pages/Portfolio'));
const Projects = lazy(() => import('@pages/Projects'));
const Services = lazy(() => import('@pages/Services'));
const Contact = lazy(() => import('@pages/Contact'));

const Login = lazy(() => import('@pages/Auth/Login'));
const Register = lazy(() => import('@pages/Auth/Register'));

const DashboardOverview = lazy(() => import('@pages/Dashboard/Overview'));
const DashboardProjects = lazy(() => import('@pages/Dashboard/Projects'));
const DashboardClients = lazy(() => import('@pages/Dashboard/Clients'));
const DashboardSettings = lazy(() => import('@pages/Dashboard/Settings'));

const MyModels = lazy(() => import('@pages/Client/MyModels'));

const ViewerPage = lazy(() => import('@pages/Viewer/ViewerPage'));
const VRPage = lazy(() => import('@pages/Viewer/VRPage'));
const ShareViewer = lazy(() => import('@pages/Viewer/ShareViewer'));

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
  { path: '/login', element: withSuspense(<Login />) },
  { path: '/register', element: withSuspense(<Register />) },
  {
    element: <ProtectedRoute allowedRoles={['admin', 'architect']} />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(<DashboardOverview />) },
          { path: 'projects', element: withSuspense(<DashboardProjects />) },
          { path: 'clients', element: withSuspense(<DashboardClients />) },
          { path: 'settings', element: withSuspense(<DashboardSettings />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['client']} />,
    children: [
      {
        element: <ClientLayout />,
        children: [{ path: '/my-models', element: withSuspense(<MyModels />) }],
      },
    ],
  },
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
  {
    element: <ViewerLayout />,
    children: [{ path: '/share/:shareToken', element: withSuspense(<ShareViewer />) }],
  },
  { path: '*', element: withSuspense(<NotFound />) },
]);

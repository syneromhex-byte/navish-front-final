export const ROUTES = {
  home: '/',
  portfolio: '/portfolio',
  projects: '/projects',
  services: '/services',
  contact: '/contact',

  login: '/login',
  register: '/register',

  dashboard: '/dashboard',
  dashboardOverview: '/dashboard',
  dashboardProjects: '/dashboard/projects',
  dashboardClients: '/dashboard/clients',
  dashboardSettings: '/dashboard/settings',

  myModels: '/my-models',

  viewer: (projectId: string) => `/viewer/${projectId}`,
  viewerVr: (projectId: string) => `/viewer/${projectId}/vr`,
  share: (shareToken: string) => `/share/${shareToken}`,
} as const;

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query keys factory for consistency
export const queryKeys = {
  // Platform data
  platformMembers: (params?: any) => ['platformMembers', params] as const,
  communityMembers: (params?: any) => ['communityMembers', params] as const,
  platformProjects: (params?: any) => ['platformProjects', params] as const,
  platformApplications: (params?: any) => ['platformApplications', params] as const,
  researchCohort: () => ['researchCohort'] as const,
  educationCohort: () => ['educationCohort'] as const,
  
  // Analytics
  analyticsOverview: () => ['analyticsOverview'] as const,
  userAnalytics: () => ['userAnalytics'] as const,
  projectAnalytics: () => ['projectAnalytics'] as const,
  emailAnalytics: () => ['emailAnalytics'] as const,
  
  // User
  currentUser: () => ['currentUser'] as const,
  
  // Emails
  emailTemplates: () => ['emailTemplates'] as const,
  emailCampaigns: () => ['emailCampaigns'] as const,
  emailLogs: () => ['emailLogs'] as const,
};

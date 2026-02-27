'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { api, AnalyticsOverview, UserAnalytics, ProjectAnalytics } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { BarChart3, TrendingUp, Users, Calendar, Mail, FolderOpen, UserCheck, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  // Use React Query for data fetching
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.platformMembers({ page: 1 }),
    queryFn: () => api.getPlatformMembers({ page: 1 }),
    select: (response) => response.data,
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.platformProjects({ page: 1 }),
    queryFn: () => api.getPlatformProjects({ page: 1 }),
    select: (response) => response.data,
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: queryKeys.platformApplications({ page: 1 }),
    queryFn: () => api.getPlatformApplications({ page: 1 }),
    select: (response) => response.data,
  });

  const loading = membersLoading && projectsLoading && appsLoading;

  // Build analytics overview from platform data
  const overview: AnalyticsOverview | null = membersData || projectsData || applicationsData ? {
    total_users: membersData?.count || 0,
    approved_users: membersData?.count || 0,
    pending_users: 0,
    total_projects: projectsData?.count || 0,
    active_projects: projectsData?.results?.filter((p: any) => {
      const status = (p.status || '').toLowerCase();
      return status === 'active';
    }).length || 0,
    total_applications: applicationsData?.count || 0,
    pending_applications: applicationsData?.results?.filter((a: any) => a.status === 'pending').length || 0,
    total_emails_sent: 0,
  } : null;

  // Build user analytics
  const userAnalytics: UserAnalytics | null = membersData ? {
    total_approved_users: membersData.count || 0,
    total_pending_users: 0,
    new_registrations_this_month: Math.floor((membersData.count || 0) * 0.1),
    user_growth_rate: 15.5,
    recent_registrations: membersData.results?.slice(0, 5).map((m: any) => ({
      id: m.id,
      email: m.email || `${m.name}@mansa.com`,
      first_name: m.first_name || m.name?.split(' ')[0] || 'User',
      last_name: m.last_name || m.name?.split(' ')[1] || '',
      role: 'user' as const,
      approval_status: 'approved',
      date_joined: m.created_at,
    })) || [],
  } : null;

  // Build project analytics
  const projectAnalytics: ProjectAnalytics | null = projectsData && applicationsData ? {
    total_projects: projectsData.count || 0,
    pending_projects: projectsData.results?.filter((p: any) => p.approval_status === 'pending').length || 0,
    approved_projects: projectsData.results?.filter((p: any) => p.approval_status === 'approved').length || 0,
    total_applications: applicationsData.count || 0,
    application_approval_rate: applicationsData.count ? ((applicationsData.results?.filter((a: any) => a.status === 'approved').length || 0) / applicationsData.count * 100) : 0,
    recent_projects: projectsData.results?.slice(0, 5) || [],
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 text-white shadow-sm sm:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">Analytics Dashboard</h1>
            <p className="text-slate-200 text-xs sm:text-sm lg:text-base">Comprehensive insights and metrics</p>
          </div>
          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white/30" />
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Card hover className="border-l-2 border-l-slate-600">
            <CardContent className="p-2 sm:p-2.5 lg:p-3">
              <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-slate-700 rounded-lg shadow-sm flex-shrink-0">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Users</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mt-0.5">{overview.total_users || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-green-600 font-medium mt-0.5">
                  {overview.approved_users || 0} approved
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover className="border-l-2 border-l-green-700">
            <CardContent className="p-2 sm:p-2.5 lg:p-3">
              <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-green-700 rounded-lg shadow-sm flex-shrink-0">
                  <FolderOpen className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Projects</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mt-0.5">{overview.total_projects || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-green-600 font-medium mt-0.5">
                  {overview.active_projects || 0} active
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover className="border-l-2 border-l-stone-600">
            <CardContent className="p-2 sm:p-2.5 lg:p-3">
              <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-stone-700 rounded-lg shadow-sm flex-shrink-0">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <TrendingUp className="h-3 w-3 text-amber-500 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Apps</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mt-0.5">{overview.total_applications || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-amber-600 font-medium mt-0.5">
                  {overview.pending_applications || 0} pending
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover className="border-l-2 border-l-orange-700">
            <CardContent className="p-2 sm:p-2.5 lg:p-3">
              <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-orange-700 rounded-lg shadow-sm flex-shrink-0">
                  <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Emails</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mt-0.5">{overview.total_emails_sent || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium mt-0.5">
                  All time
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Analytics */}
      {userAnalytics && (
        <Card hover>
          <CardHeader gradient>
            <CardTitle className="flex items-center text-xl">
              <Users className="h-6 w-6 mr-3 text-blue-600" />
              User Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                  {userAnalytics.new_registrations_this_month || 0}
                </div>
                <div className="text-sm text-gray-700 font-medium mt-2">New Registrations This Month</div>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {userAnalytics.total_approved_users || 0}
                </div>
                <div className="text-sm text-gray-700 font-medium mt-2">Approved Users</div>
              </div>
              <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {userAnalytics.total_pending_users || 0}
                </div>
                <div className="text-sm text-gray-700 font-medium mt-2">Pending Approval</div>
              </div>
              <div className="text-center p-6 bg-stone-50 dark:bg-stone-900/20 rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="text-3xl font-bold text-stone-700 dark:text-stone-400">
                  {userAnalytics.user_growth_rate ? userAnalytics.user_growth_rate.toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-gray-700 font-medium mt-2">Growth Rate</div>
              </div>
            </div>

            {userAnalytics.recent_registrations && userAnalytics.recent_registrations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Registrations
                </h3>
                <div className="space-y-3">
                  {userAnalytics.recent_registrations.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {user.first_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.approval_status === 'approved' ? 'bg-green-100 text-green-700 border border-green-300' :
                          user.approval_status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                          'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                          {user.approval_status || 'pending'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Analytics */}
      {projectAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Project Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {projectAnalytics.total_projects}
                </div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {projectAnalytics.pending_projects}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {projectAnalytics.approved_projects}
                </div>
                <div className="text-sm text-gray-600">Approved Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {projectAnalytics.application_approval_rate?.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Approval Rate</div>
              </div>
            </div>

            {projectAnalytics.recent_projects && projectAnalytics.recent_projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Projects</h3>
                <div className="space-y-2">
                  {projectAnalytics.recent_projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-md">
                          {project.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          project.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

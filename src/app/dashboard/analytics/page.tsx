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
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const userAnalytics: UserAnalytics | null = membersData ? {
    total_approved_users: membersData.count || 0,
    total_pending_users: 0,
    new_registrations_this_month: membersData.results?.filter(
      (m: any) => m.created_at && new Date(m.created_at) >= currentMonthStart
    ).length || 0,
    user_growth_rate: 0,
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Analytics Dashboard</h1>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Users</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{overview.total_users || 0}</p>
              <p className="text-[10px] text-green-600 font-medium mt-0.5">{overview.approved_users || 0} approved</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Projects</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{overview.total_projects || 0}</p>
              <p className="text-[10px] text-green-600 font-medium mt-0.5">{overview.active_projects || 0} active</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Apps</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{overview.total_applications || 0}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">{overview.pending_applications || 0} pending</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Emails</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{overview.total_emails_sent || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">All time</p>
            </div>
          </div>
        </div>
      )}

      {/* User Analytics */}
      {userAnalytics && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              User Analytics
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-3xl font-bold text-gray-700">
                  {userAnalytics.new_registrations_this_month || 0}
                </div>
                <div className="text-[13px] text-gray-600 font-medium mt-2">New Registrations This Month</div>
              </div>
              <div className="text-center p-5 bg-green-50 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-700">
                  {userAnalytics.total_approved_users || 0}
                </div>
                <div className="text-[13px] text-gray-600 font-medium mt-2">Approved Users</div>
              </div>
              <div className="text-center p-5 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-3xl font-bold text-amber-700">
                  {userAnalytics.total_pending_users || 0}
                </div>
                <div className="text-[13px] text-gray-600 font-medium mt-2">Pending Approval</div>
              </div>
              <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-3xl font-bold text-gray-700">
                  {userAnalytics.user_growth_rate ? userAnalytics.user_growth_rate.toFixed(1) : '0.0'}%
                </div>
                <div className="text-[13px] text-gray-600 font-medium mt-2">Growth Rate</div>
              </div>
            </div>

            {userAnalytics.recent_registrations && userAnalytics.recent_registrations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Recent Registrations
                </h3>
                <div className="space-y-2">
                  {userAnalytics.recent_registrations.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                          {user.first_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-[13px]">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          user.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                          user.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
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
          </div>
        </div>
      )}

      {/* Project Analytics */}
      {projectAnalytics && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              Project Analytics
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{projectAnalytics.total_projects}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{projectAnalytics.pending_projects}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Approved</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{projectAnalytics.approved_projects}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{projectAnalytics.application_approval_rate?.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {projectAnalytics.recent_projects && projectAnalytics.recent_projects.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[13px] font-bold text-gray-800 mb-3 uppercase tracking-wide">Recent Projects</h3>
                <div className="space-y-2">
                  {projectAnalytics.recent_projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-[13px] text-gray-900">{project.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-md">
                          {project.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' :
                          project.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                          project.status === 'closed' ? 'bg-blue-100 text-blue-700' :
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
          </div>
        </div>
      )}
    </div>
  );
}

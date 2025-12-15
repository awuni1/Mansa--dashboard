'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { api, Member, ProjectApplication, Project, AnalyticsOverview, CohortApplication } from '@/lib/api';
import { Users, FolderOpen, Mail, TrendingUp, MessageSquare, FileText, UserCheck, Clock, GraduationCap, FlaskConical, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for WorldMap to avoid SSR issues
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), {
  ssr: false,
  loading: () => (
    <Card className="h-[700px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading world map...</p>
      </div>
    </Card>
  ),
});

// Dynamic import for GlobalStatistics
const GlobalStatistics = dynamic(() => import('@/components/dashboard/GlobalStatistics'), {
  ssr: false,
  loading: () => (
    <Card className="h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading statistics...</p>
      </div>
    </Card>
  ),
});

interface DashboardStats {
  totalMembers: number;
  communityMembers: number;
  pendingApplications: number;
  totalApplications: number;
  totalProjects: number;
  activeProjects: number;
  researchCohort: number;
  educationCohort: number;
  recentSubmissions: number;
  pendingUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    communityMembers: 0,
    pendingApplications: 0,
    totalApplications: 0,
    totalProjects: 0,
    activeProjects: 0,
    researchCohort: 0,
    educationCohort: 0,
    recentSubmissions: 0,
    pendingUsers: 0,
  });
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [recentApplications, setRecentApplications] = useState<ProjectApplication[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        membersResult, 
        communityResult,
        applicationsResult,
        projectsResult,
        researchResult,
        educationResult,
        overviewResult,
        locationsResult
      ] = await Promise.all([
        api.getPlatformMembers(),
        api.getCommunityMembers(),
        api.getPlatformApplications(),
        api.getPlatformProjects(),
        api.getResearchCohort(),
        api.getEducationCohort(),
        api.getAnalyticsOverview(),
        api.getMemberLocations(), // Get ALL members for map/statistics
      ]);

      // Get total counts from paginated responses
      const totalMembers = membersResult.data?.count || 0;
      const totalCommunity = communityResult.data?.count || 0;
      const totalApplications = applicationsResult.data?.count || 0;
      const totalProjects = projectsResult.data?.count || 0;
      const totalResearch = researchResult.data?.count || 0;
      const totalEducation = educationResult.data?.count || 0;

      const members = membersResult.data?.results || [];
      const community = communityResult.data?.results || [];
      const applications = applicationsResult.data?.results || [];
      const projects = projectsResult.data?.results || [];

      setStats({
        totalMembers: totalMembers,
        communityMembers: totalCommunity,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        totalApplications: totalApplications,
        totalProjects: totalProjects,
        activeProjects: projects.filter(p => p.status === 'active').length,
        researchCohort: totalResearch,
        educationCohort: totalEducation,
        recentSubmissions: members.filter(member =>
          new Date(member.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        pendingUsers: overviewResult.data?.pending_users || 0,
      });

      if (overviewResult.data) setOverview(overviewResult.data);

      // Set recent data (last 5)
      setRecentMembers(members.slice(0, 5));
      setRecentApplications(applications.slice(0, 5));
      setRecentProjects(projects.slice(0, 5));
      
      // Use locations endpoint data for world map and statistics (includes ALL members)
      const allMembersData: Member[] = [];
      if (locationsResult.data?.locations) {
        locationsResult.data.locations.forEach((location: any) => {
          location.members.forEach((member: any) => {
            allMembersData.push({
              id: member.id,
              name: member.name,
              email: member.email,
              country: location.country,
              city: member.city || '',
              membershiptype: member.membershipType || '',
              gender: member.gender || '',
              occupation: member.occupation || '',
              industry: member.industry || '',
              created_at: member.created_at || new Date().toISOString(),
            } as Member);
          });
        });
      }
      
      setAllMembers(allMembersData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400 opacity-20"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 rounded-b-2xl sm:rounded-b-3xl shadow-lg sm:shadow-xl">
        <div className="text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 tracking-tight">Dashboard Overview</h1>
          <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Complete control center for Mansa to Mansa platform</p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-white text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Members */}
        <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Platform Members</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 mb-0.5">{stats.totalMembers.toLocaleString()}</p>
                <div className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-blue-600">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{stats.recentSubmissions} this week</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Members */}
        <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-0.5">Community</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900 mb-0.5">{stats.communityMembers.toLocaleString()}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">Active members</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-emerald-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Projects */}
        <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Total Projects</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 mb-0.5">{stats.totalProjects}</p>
                <p className="text-[9px] sm:text-[10px] text-purple-600 font-medium">{stats.activeProjects} active</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-orange-700 uppercase tracking-wide mb-0.5">Applications</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900 mb-0.5">{stats.totalApplications}</p>
                <p className="text-[9px] sm:text-[10px] text-orange-600 font-medium">{stats.pendingApplications} pending</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Users */}
        <Card className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Pending Users</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-900 mb-0.5">{stats.pendingUsers}</p>
                <p className="text-[9px] sm:text-[10px] text-amber-600 font-medium">Awaiting approval</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-amber-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Cohort */}
        <Card className="bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-cyan-700 uppercase tracking-wide mb-0.5">Research Cohort</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-900 mb-0.5">{stats.researchCohort}</p>
                <p className="text-[9px] sm:text-[10px] text-cyan-600 font-medium">Participants</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-cyan-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education Cohort */}
        <Card className="bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold text-pink-700 uppercase tracking-wide mb-0.5">Education Cohort</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-900 mb-0.5">{stats.educationCohort}</p>
                <p className="text-[9px] sm:text-[10px] text-pink-600 font-medium">Participants</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-pink-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Stats */}
        {overview && overview.total_emails_sent !== undefined && (
          <Card className="bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-2.5 sm:p-3 lg:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-0.5">Emails Sent</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-900 mb-0.5">{(overview.total_emails_sent || 0).toLocaleString()}</p>
                  <p className="text-[9px] sm:text-[10px] text-indigo-600 font-medium">Total campaigns</p>
                </div>
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Members */}
        <Card className="border-none shadow-md sm:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Recent Members</span>
              </div>
              <a 
                href="/dashboard/members"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {recentMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No members yet</p>
                  <p className="text-sm text-gray-400 mt-1">Members will appear here once they register</p>
                </div>
              ) : (
                recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all duration-200 border border-gray-100 hover:border-blue-200 group">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-base leading-none">
                          {(member.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {member.name || 'N/A'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{member.email || 'N/A'}</p>
                        {(member.country || member.city) && (
                          <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              {member.city && member.country ? `${member.city}, ${member.country}` : member.country || member.city}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {member.membershiptype && (
                        <span className="inline-block mt-1 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                          {member.membershiptype}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-none shadow-md sm:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Recent Applications</span>
              </div>
              <a 
                href="/dashboard/applications"
                className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Applications will appear here once submitted</p>
                </div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg sm:rounded-xl hover:from-gray-100 hover:to-orange-100 transition-all duration-200 border border-gray-100 hover:border-orange-200 group">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-md flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                          {app.applicant_name || 'Unknown Applicant'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{app.applicant_email || 'No email'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                          Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-full shadow-sm whitespace-nowrap ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        app.status === 'denied' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="border-none shadow-md sm:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Recent Projects</span>
            </div>
            <a 
              href="/dashboard/projects"
              className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">View</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentProjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No projects yet</p>
                <p className="text-sm text-gray-400 mt-1">Projects will appear here once created</p>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-white to-purple-50 rounded-lg sm:rounded-xl border border-purple-200 sm:border-2 sm:border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
                      <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {(project.status || 'draft').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {project.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                    {project.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Statistics - Pie Charts and Analytics */}
      <GlobalStatistics 
        members={allMembers.map(m => ({
          id: m.id,
          name: m.name,
          country: m.country,
          city: m.city,
          membershipType: m.membershiptype,
          gender: m.gender,
          occupation: m.occupation,
          industry: m.industry
        }))} 
        className="w-full"
      />

      {/* World Map - Global Member Distribution */}
      <WorldMap 
        members={allMembers.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          country: m.country,
          city: m.city,
          membershipType: m.membershiptype
        }))} 
        className="w-full" 
      />

      {/* Quick Actions */}
      <Card className="border-none shadow-md sm:shadow-lg bg-gradient-to-br from-slate-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <a
              href="/dashboard/members"
              className="group p-3 sm:p-4 lg:p-6 text-center bg-white hover:bg-blue-50 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 cursor-pointer border border-gray-200 sm:border-2 border-transparent hover:border-blue-300 shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">View Members</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{stats.totalMembers} total</p>
            </a>
            <a
              href="/dashboard/projects"
              className="group p-3 sm:p-4 lg:p-6 text-center bg-white hover:bg-purple-50 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 cursor-pointer border border-gray-200 sm:border-2 border-transparent hover:border-purple-300 shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Manage Projects</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{stats.totalProjects} projects</p>
            </a>
            <a
              href="/dashboard/applications"
              className="group p-3 sm:p-4 lg:p-6 text-center bg-white hover:bg-orange-50 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 cursor-pointer border border-gray-200 sm:border-2 border-transparent hover:border-orange-300 shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Applications</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{stats.pendingApplications} pending</p>
            </a>
            <a
              href="/dashboard/analytics"
              className="group p-3 sm:p-4 lg:p-6 text-center bg-white hover:bg-green-50 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 cursor-pointer border border-gray-200 sm:border-2 border-transparent hover:border-green-300 shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">Analytics</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">View insights</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
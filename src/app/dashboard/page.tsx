'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { api, Member, ProjectApplication, Project, AnalyticsOverview } from '@/lib/api';
import { Users, FolderOpen, Mail, TrendingUp, FileText, Clock, GraduationCap, FlaskConical, Globe, Rocket, Star, RefreshCw, Plus, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), {
  ssr: false,
  loading: () => (
    <Card className="h-[700px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">Loading world map...</p>
      </div>
    </Card>
  ),
});

const GlobalStatistics = dynamic(() => import('@/components/dashboard/GlobalStatistics'), {
  ssr: false,
  loading: () => (
    <Card className="h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">Loading statistics...</p>
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
  const [emailsCopied, setEmailsCopied] = useState(false);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!emailDropdownOpen) return;
    const close = () => setEmailDropdownOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [emailDropdownOpen]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        membersResult,
        communityResult,
        applicationsResult,
        projectsResult,
        researchResult,
        educationResult,
        overviewResult,
      ] = await Promise.all([
        api.getPlatformMembers({ page: 1 }),
        api.getCommunityMembers({ page: 1 }),
        api.getPlatformApplications({ page: 1 }),
        api.getPlatformProjects({ page: 1 }),
        api.getResearchCohort({ page: 1 }),
        api.getEducationCohort({ page: 1 }),
        api.getAnalyticsOverview(),
      ]);

      const totalMembers = membersResult.data?.count || 0;
      const totalCommunity = communityResult.data?.count || 0;
      const totalApplications = applicationsResult.data?.count || 0;
      const totalProjects = projectsResult.data?.count || 0;
      const totalResearch = researchResult.data?.count || 0;
      const totalEducation = educationResult.data?.count || 0;

      const members = membersResult.data?.results || [];
      const applications = applicationsResult.data?.results || [];
      const projects = projectsResult.data?.results || [];

      setStats({
        totalMembers,
        communityMembers: totalCommunity,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        totalApplications,
        totalProjects,
        activeProjects: projects.filter(p => p.status === 'active').length,
        researchCohort: totalResearch,
        educationCohort: totalEducation,
        recentSubmissions: members.filter(m =>
          new Date(m.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        pendingUsers: overviewResult.data?.pending_users || 0,
      });

      if (overviewResult.data) setOverview(overviewResult.data);

      setRecentMembers(members.slice(0, 5));
      setRecentApplications(applications.slice(0, 5));
      setRecentProjects(projects.slice(0, 5));

      // Fetch all members for map
      const allMembersData: Member[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      while (hasMorePages && currentPage <= 50) {
        const pageResponse = await api.getPlatformMembers({ page: currentPage });
        if (pageResponse.data?.results && pageResponse.data.results.length > 0) {
          allMembersData.push(...pageResponse.data.results);
          const totalCount = pageResponse.data.count || 0;
          hasMorePages = allMembersData.length < totalCount;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }
      setAllMembers(allMembersData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyEmails = async (filter: 'all' | 'mentors' | 'mentees' | 'others') => {
    let filtered = allMembers;
    if (filter === 'mentors') filtered = allMembers.filter(m => m.membershiptype?.toLowerCase() === 'mentor');
    else if (filter === 'mentees') filtered = allMembers.filter(m => m.membershiptype?.toLowerCase() === 'mentee');
    else if (filter === 'others') filtered = allMembers.filter(m => {
      const t = m.membershiptype?.toLowerCase();
      return t !== 'mentor' && t !== 'mentee';
    });
    const emails = filtered.map(m => (m.email || '').trim()).filter(e => e.includes('@'));
    const unique = [...new Set(emails)];
    await navigator.clipboard.writeText(unique.join(', '));
    setEmailDropdownOpen(false);
    setEmailsCopied(true);
    setTimeout(() => setEmailsCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600" />
        </div>
        <p className="mt-4 text-gray-500 text-sm font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ── Page title row ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {/* System status badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy emails dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmailDropdownOpen(o => !o)}
              disabled={allMembers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailsCopied ? (
                <><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Copied!</span></>
              ) : (
                <><Mail className="w-3.5 h-3.5" />Copy Emails<svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
              )}
            </button>
            {emailDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                {(['all', 'mentors', 'mentees', 'others'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => copyEmails(v)}
                    className="w-full text-left px-3 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors capitalize">
                    {v === 'all' ? 'All Members' : v === 'mentors' ? 'Mentors Only' : v === 'mentees' ? 'Mentees Only' : 'Others'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>

          <a
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </a>
        </div>
      </div>

      {/* ── 3 large stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Community Members */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Community Members</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{stats.communityMembers.toLocaleString()}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded">ACTIVE</span>
          </div>
        </div>

        {/* Platform Members */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Platform Members</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{stats.totalMembers.toLocaleString()}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded">ACTIVE</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{stats.activeProjects}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ── 4 smaller stat boxes ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pending Users</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.pendingUsers}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            <Clock className="w-2.5 h-2.5" />
            {stats.pendingUsers} PENDING
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Applications</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalApplications}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
            {stats.pendingApplications} PENDING
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Research Cohort</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.researchCohort}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
            <FlaskConical className="w-2.5 h-2.5" />
            PARTICIPANTS
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Education Cohort</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.educationCohort}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
            <GraduationCap className="w-2.5 h-2.5" />
            PARTICIPANTS
          </span>
        </div>
      </div>

      {/* ── Two-column: Recent Members + Queue Applications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Members — table style */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Recent Members
            </h2>
            <a href="/dashboard/members" className="text-[12px] text-blue-600 hover:underline font-semibold">
              See All Members →
            </a>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-3 px-5 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Name</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {recentMembers.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No members yet</p>
              </div>
            ) : (
              recentMembers.map((member) => (
                <div key={member.id} className="grid grid-cols-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                      {(member.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{member.name || 'N/A'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{member.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    {(member.city || member.country) && (
                      <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                    <span className="text-[12px] text-gray-500 truncate">
                      {member.city && member.country
                        ? `${member.city}, ${member.country}`
                        : member.country || member.city || '—'}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                      member.membershiptype
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {member.membershiptype || 'Member'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue: Applications */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Queue: Applications
            </h2>
            <a href="/dashboard/applications" className="text-[12px] text-blue-600 hover:underline font-semibold">
              See All Applications →
            </a>
          </div>

          <div className="divide-y divide-gray-50">
            {recentApplications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No applications yet</p>
              </div>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-orange-600">
                        {(app.applicant_name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">
                        {app.applicant_name || 'Unknown Applicant'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{app.applicant_email || ''}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${
                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                    app.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                    app.status === 'denied'   ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {(app.status || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* System Analytics mini-section */}
          <div className="mx-5 mb-4 mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">System Analytics</p>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              Platform data is synced in real-time. Member locations, membership types, and application statuses are updated automatically from the backend.
            </p>
            <a
              href="/dashboard/members"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Manage Users
            </a>
          </div>
        </div>
      </div>

      {/* ── Recent Projects ─────────────────────────────────── */}
      {recentProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              Recent Projects
            </h2>
            <a href="/dashboard/projects" className="text-[12px] text-blue-600 hover:underline font-semibold">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {recentProjects.map((project) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    project.status === 'active'    ? 'bg-green-100 text-green-700' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {(project.status || 'DRAFT').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-[13px] font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-[12px] text-gray-500 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description available'}
                </p>
                <p className="text-[11px] text-gray-400 mt-2">
                  {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Global Statistics ────────────────────────────────── */}
      <GlobalStatistics
        members={allMembers.map(m => ({
          id: m.id,
          name: m.name,
          country: m.country,
          city: m.city,
          membershipType: m.membershiptype,
          gender: m.gender,
          occupation: m.occupation,
          industry: m.industry,
        }))}
        className="w-full"
      />

      {/* ── World Map ─────────────────────────────────────────── */}
      <WorldMap
        members={allMembers.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          country: m.country,
          city: m.city,
          membershipType: m.membershiptype,
        }))}
        className="w-full"
      />

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5">
          {[
            { href: '/dashboard/members',     icon: Users,      label: 'View Members',    sub: `${stats.totalMembers} total`,          color: 'bg-blue-100 text-blue-600' },
            { href: '/dashboard/projects',    icon: FolderOpen, label: 'Manage Projects', sub: `${stats.totalProjects} projects`,      color: 'bg-blue-100 text-blue-600' },
            { href: '/dashboard/applications',icon: FileText,   label: 'Applications',    sub: `${stats.pendingApplications} pending`, color: 'bg-orange-100 text-orange-600' },
            { href: '/dashboard/analytics',   icon: TrendingUp, label: 'Analytics',       sub: 'View insights',                        color: 'bg-green-100 text-green-600' },
          ].map(({ href, icon: Icon, label, sub, color }) => (
            <a
              key={href}
              href={href}
              className="group flex flex-col items-center text-center p-4 bg-gray-50 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}

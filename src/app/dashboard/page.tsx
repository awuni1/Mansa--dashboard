'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { supabase, Member, ProjectApplication } from '@/lib/supabase';
import { Users, FolderOpen, Mail, TrendingUp, MessageSquare } from 'lucide-react';

interface DashboardStats {
  totalMembers: number;
  pendingApplications: number;
  totalApplications: number;
  recentSubmissions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    pendingApplications: 0,
    totalApplications: 0,
    recentSubmissions: 0,
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [recentApplications, setRecentApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [membersResult, applicationsResult] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: false }),
        supabase.from('project_applications').select('*').order('created_at', { ascending: false }),
      ]);

      const members = membersResult.data || [];
      const applications = applicationsResult.data || [];

      setStats({
        totalMembers: members.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        totalApplications: applications.length,
        recentSubmissions: members.filter(member => 
          new Date(member.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      });

      setRecentMembers(members.slice(0, 5));
      setRecentApplications(applications.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Welcome to the Mansa to Mansa admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mr-4">
              <FolderOpen className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900">{stats.recentSubmissions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>WhatsApp Community Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">6</p>
              <p className="text-sm text-gray-600">Active Groups</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">2,491</p>
              <p className="text-sm text-gray-600">Total WhatsApp Members</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">Messages Sent Today</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <a 
              href="/dashboard/whatsapp"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Manage WhatsApp Groups
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMembers.length > 0 ? (
                recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.full_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {member.email || 'N/A'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No members found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <FolderOpen className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {application.project_title || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {application.full_name || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          application.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No applications found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
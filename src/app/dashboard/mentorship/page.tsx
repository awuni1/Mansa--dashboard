'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Users,
  Calendar,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  UserCheck,
  XCircle,
  Activity,
  Zap,
  UserPlus,
  Shield,
  BarChart3,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface MentorshipStats {
  totalMentors: number;
  approvedMentors: number;
  pendingMentors: number;
  totalMentees: number;
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingApprovalBookings: number;
  averageRating: number;
  totalSessions: number;
  activeSessions: number;
  completionRate: number;
  totalRevenue?: number;
  popularExpertise: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'booking' | 'approval' | 'cancellation' | 'completion' | 'promotion';
    message: string;
    timestamp: string;
  }>;
  systemHealth: {
    apiStatus: 'healthy' | 'degraded' | 'down';
    databaseStatus: 'healthy' | 'degraded' | 'down';
    emailService: 'healthy' | 'degraded' | 'down';
    lastBackup: string;
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function MentorshipDashboardPage() {
  const [stats, setStats] = useState<MentorshipStats>({
    totalMentors: 0,
    approvedMentors: 0,
    pendingMentors: 0,
    totalMentees: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingApprovalBookings: 0,
    averageRating: 0,
    totalSessions: 0,
    activeSessions: 0,
    completionRate: 0,
    totalRevenue: 0,
    popularExpertise: [],
    recentActivity: [],
    systemHealth: {
      apiStatus: 'healthy',
      databaseStatus: 'healthy',
      emailService: 'healthy',
      lastBackup: new Date().toISOString(),
    },
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMentorshipStats();
    fetchSystemAlerts();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchMentorshipStats();
      fetchSystemAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMentorshipStats = async (isPolling = false) => {
    try {
      // Only show loading spinner on initial load, not polling refreshes
      if (!isPolling) setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/stats/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch mentorship statistics');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching mentorship stats:', err);
      const errorMessage = err.message || 'Failed to load mentorship data';
      setError(errorMessage);
      // Show error to admins - don't hide problems with mock data
      if (!isPolling) {
        // Only alert on initial load, not during polling
        console.warn('Dashboard API Error:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/alerts/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4" />;
      case 'approval':
        return <UserCheck className="w-4 h-4" />;
      case 'cancellation':
        return <XCircle className="w-4 h-4" />;
      case 'completion':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Activity className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && stats.totalMentors === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mentorship dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Mentorship</h1>
          <p className="text-[12px] text-gray-500 mt-1">Complete oversight and control of the Mansa Mentorship Platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
            Live Updates
          </div>
          <button
            type="button"
            onClick={() => {
              fetchMentorshipStats();
              fetchSystemAlerts();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">System Alerts ({alerts.filter(a => !a.resolved).length})</span>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(alert.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mentors Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Mentors</p>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalMentors}</p>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <CheckCircle className="w-3 h-3" />
              {stats.approvedMentors} Active
            </span>
            {stats.pendingMentors > 0 && (
              <span className="flex items-center gap-1 text-yellow-600 font-medium">
                <Clock className="w-3 h-3" />
                {stats.pendingMentors} Pending
              </span>
            )}
          </div>
          <Link
            href="/dashboard/mentorship/mentors"
            className="text-[12px] font-semibold text-blue-600 hover:underline"
          >
            Manage Mentors →
          </Link>
        </div>

        {/* Mentees Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Active Mentees</p>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalMentees}</p>
          <p className="text-xs text-gray-500 mb-3">
            Registered users seeking mentorship
          </p>
          <Link
            href="/dashboard/mentorship/mentees"
            className="text-[12px] font-semibold text-blue-600 hover:underline"
          >
            View All Mentees →
          </Link>
        </div>

        {/* Sessions Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Sessions</p>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalBookings}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
            <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              <Clock className="w-3 h-3" />
              {stats.upcomingBookings} upcoming
            </span>
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              {stats.completedBookings} done
            </span>
          </div>
          <Link
            href="/dashboard/mentorship/sessions"
            className="text-[12px] font-semibold text-blue-600 hover:underline"
          >
            View All Sessions →
          </Link>
        </div>

        {/* Rating Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Platform Performance</p>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {stats.averageRating.toFixed(1)}
            <span className="text-lg text-gray-500">/5.0</span>
          </p>
          <div className="flex items-center gap-2 text-xs mb-3">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              {stats.completionRate.toFixed(1)}% completion
            </span>
          </div>
          <Link
            href="/dashboard/mentorship/analytics"
            className="text-[12px] font-semibold text-blue-600 hover:underline"
          >
            View Analytics →
          </Link>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Expertise Areas */}
        <Card>
          <CardHeader className="border-b border-gray-100 pb-3 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Popular Expertise Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularExpertise.map((expertise, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {expertise.name}
                    </span>
                    <span className="text-gray-500">{expertise.count} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      ref={(el) => { if (el) el.style.width = `${(expertise.count / stats.popularExpertise[0].count) * 100}%`; }}
                      className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b border-gray-100 pb-3 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-3 mb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-blue-600" />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Manage Mentors */}
            <Link
              href="/dashboard/mentorship/mentors"
              className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                {stats.pendingMentors > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {stats.pendingMentors}
                  </span>
                )}
              </div>
              <h3 className="text-[13px] font-bold text-gray-800 mb-1">Manage Mentors</h3>
              <p className="text-[11px] text-gray-500">
                Approve, review, edit mentor profiles and permissions
              </p>
            </Link>

            {/* View Sessions */}
            <Link
              href="/dashboard/mentorship/sessions"
              className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                {stats.pendingApprovalBookings > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {stats.pendingApprovalBookings}
                  </span>
                )}
              </div>
              <h3 className="text-[13px] font-bold text-gray-800 mb-1">All Sessions</h3>
              <p className="text-[11px] text-gray-500">
                Monitor all bookings, sessions, and meeting links
              </p>
            </Link>

            {/* Manage Mentees */}
            <Link
              href="/dashboard/mentorship/mentees"
              className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
            >
              <div className="mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h3 className="text-[13px] font-bold text-gray-800 mb-1">Manage Mentees</h3>
              <p className="text-[11px] text-gray-500">
                View mentees, promote to mentor, manage accounts
              </p>
            </Link>

            {/* Analytics */}
            <Link
              href="/dashboard/mentorship/analytics"
              className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
            >
              <div className="mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h3 className="text-[13px] font-bold text-gray-800 mb-1">Analytics & Reports</h3>
              <p className="text-[11px] text-gray-500">
                Detailed metrics, performance insights, and exports
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

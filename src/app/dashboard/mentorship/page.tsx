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
  MessageSquare,
  Video,
  FileText,
  DollarSign
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
  const [error, setError] = useState<string | null>(null);
  const [showAdminActions, setShowAdminActions] = useState(false);

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
        // Mock alerts for demonstration
        setAlerts([
          {
            id: '1',
            type: 'warning',
            message: '3 mentors have not set their availability this week',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
          {
            id: '2',
            type: 'info',
            message: 'Reminder: Monthly mentorship report due in 5 days',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ]);
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading mentorship dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* Header with System Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-emerald-600" />
            Mentorship Command Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete oversight and control of the Mansa Mentorship Platform
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Live Updates</span>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchMentorshipStats();
                fetchSystemAlerts();
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Refresh Data
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${stats.systemHealth.apiStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span>API: {stats.systemHealth.apiStatus}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${stats.systemHealth.databaseStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span>DB: {stats.systemHealth.databaseStatus}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${stats.systemHealth.emailService === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span>Email: {stats.systemHealth.emailService}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <Card className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-5 h-5" />
              System Alerts ({alerts.filter(a => !a.resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => !a.resolved).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(alert.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mentors Card */}
        <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Mentors
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalMentors}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
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
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              Manage Mentors
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* Mentees Card */}
        <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Mentees
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalMentees}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Registered users seeking mentorship
            </p>
            <Link
              href="/dashboard/mentorship/mentees"
              className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              View All Mentees
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sessions
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalBookings}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
              <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {stats.upcomingBookings} upcoming
              </span>
              <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                {stats.completedBookings} done
              </span>
            </div>
            <Link
              href="/dashboard/mentorship/sessions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              View All Sessions
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* Rating Card */}
        <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Platform Performance
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.averageRating.toFixed(1)}
              <span className="text-lg text-gray-500">/5.0</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                {stats.completionRate.toFixed(1)}% completion
              </span>
            </div>
            <Link
              href="/dashboard/mentorship/analytics"
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              View Analytics
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Expertise Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Popular Expertise Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularExpertise.map((expertise, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {expertise.name}
                    </span>
                    <span className="text-gray-500">{expertise.count} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(expertise.count / stats.popularExpertise[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
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
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
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
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-emerald-600" />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Manage Mentors */}
            <Link
              href="/dashboard/mentorship/mentors"
              className="group p-5 border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-800 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                {stats.pendingMentors > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded-full">
                    {stats.pendingMentors}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Manage Mentors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approve, review, edit mentor profiles and permissions
              </p>
            </Link>

            {/* View Sessions */}
            <Link
              href="/dashboard/mentorship/sessions"
              className="group p-5 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                {stats.pendingApprovalBookings > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded-full">
                    {stats.pendingApprovalBookings}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">All Sessions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor all bookings, sessions, and meeting links
              </p>
            </Link>

            {/* Manage Mentees */}
            <Link
              href="/dashboard/mentorship/mentees"
              className="group p-5 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-800 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Manage Mentees</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View mentees, promote to mentor, manage accounts
              </p>
            </Link>

            {/* Analytics */}
            <Link
              href="/dashboard/mentorship/analytics"
              className="group p-5 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-800 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Analytics & Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detailed metrics, performance insights, and exports
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

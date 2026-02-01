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
  Zap
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
  averageRating: number;
  totalSessions: number;
  activeSessions: number;
  completionRate: number;
  popularExpertise: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'booking' | 'approval' | 'cancellation' | 'completion';
    message: string;
    timestamp: string;
  }>;
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
    averageRating: 0,
    totalSessions: 0,
    activeSessions: 0,
    completionRate: 0,
    popularExpertise: [],
    recentActivity: [],
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchMentorshipStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mentorship/stats/`,
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
    } catch (err) {
      console.error('Error fetching mentorship stats:', err);
      setError('Unable to load mentorship statistics. Using mock data for demonstration.');

      // Mock data for demonstration
      setStats({
        totalMentors: 11,
        approvedMentors: 11,
        pendingMentors: 0,
        totalMentees: 45,
        totalBookings: 128,
        upcomingBookings: 23,
        completedBookings: 95,
        cancelledBookings: 10,
        averageRating: 4.8,
        totalSessions: 95,
        activeSessions: 23,
        completionRate: 88.1,
        popularExpertise: [
          { name: 'Web Development', count: 25 },
          { name: 'Career Guidance', count: 22 },
          { name: 'AI & Machine Learning', count: 18 },
          { name: 'Data Science', count: 15 },
          { name: 'Product Management', count: 12 },
        ],
        recentActivity: [
          {
            id: '1',
            type: 'booking',
            message: 'New booking: John Doe with Mentor Sarah',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: '2',
            type: 'completion',
            message: 'Session completed: Emily Chen with Mentor David',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: '3',
            type: 'approval',
            message: 'New mentor approved: Dr. James Wilson',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mentorship/alerts/`,
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600" />
            Mentorship Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and analytics for the Mansa Mentorship Program
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Live Updates</span>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Mentors
            </CardTitle>
            <Users className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalMentors}
            </div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {stats.approvedMentors} approved
              {stats.pendingMentors > 0 && (
                <span className="text-yellow-600 ml-2">
                  • {stats.pendingMentors} pending
                </span>
              )}
            </p>
            <Link
              href="/dashboard/mentorship/mentors"
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              Manage mentors →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Mentees
            </CardTitle>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalMentees}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registered users seeking mentorship
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sessions
            </CardTitle>
            <Calendar className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalBookings}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                {stats.upcomingBookings} upcoming
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                {stats.completedBookings} completed
              </span>
            </div>
            <Link
              href="/dashboard/mentorship/sessions"
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              View all sessions →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Rating
            </CardTitle>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              {stats.completionRate.toFixed(1)}% completion rate
            </p>
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/mentorship/mentors"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all group"
            >
              <Users className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage Mentors</h3>
              <p className="text-sm text-gray-500 mt-1">
                Approve, review, and manage mentor profiles
              </p>
            </Link>

            <Link
              href="/dashboard/mentorship/sessions"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
            >
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">View Sessions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Monitor bookings and session activities
              </p>
            </Link>

            <Link
              href="/dashboard/mentorship/analytics"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">View Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">
                Detailed metrics and performance reports
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

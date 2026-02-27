'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  CheckCircle,
  Star,
  MessageSquare,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    completionRate: number;
    averageRating: number;
    totalMentors: number;
    totalMentees: number;
    growthRate: number;
  };
  trends: {
    month: string;
    sessions: number;
    mentors: number;
    mentees: number;
  }[];
  topMentors: {
    id: string;
    name: string;
    expertise: string;
    totalSessions: number;
    averageRating: number;
    completionRate: number;
  }[];
  sessionsByExpertise: {
    name: string;
    count: number;
    percentage: number;
  }[];
  satisfactionMetrics: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/analytics/?range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics:', response.statusText);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;

    const report = JSON.stringify(analytics, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorship-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
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
            <BarChart3 className="w-8 h-8 text-slate-700" />
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive performance metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                type="button"
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  timeRange === range
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportReport}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link
            href="/dashboard/mentorship"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-slate-700" />
              <div className="flex items-center gap-1 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">+{analytics.overview.growthRate}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalSessions}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-green-700" />
              <div className="flex items-center gap-1 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">+8.2%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalMentors}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active Mentors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-sky-700" />
              <div className="flex items-center gap-1 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">+15.3%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalMentees}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active Mentees</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.completionRate}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completion Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.averageRating.toFixed(1)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Average Rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-slate-700" />
              <div className="flex items-center gap-1 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">+{analytics.overview.growthRate}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Excellent</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Platform Health</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-700" />
              Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.trends.map((trend, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{trend.month}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{trend.sessions} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-slate-700 h-3 rounded-full transition-all"
                      style={{ width: `${(trend.sessions / 200) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sessions by Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-700" />
              Sessions by Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.sessionsByExpertise.map((expertise, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{expertise.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{expertise.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-700 h-3 rounded-full transition-all"
                      style={{ width: `${expertise.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-700" />
            Satisfaction Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{analytics.satisfactionMetrics.excellent}%</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Excellent</p>
              <p className="text-xs text-gray-500">5 stars</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 bg-sky-700 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{analytics.satisfactionMetrics.good}%</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Good</p>
              <p className="text-xs text-gray-500">4 stars</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{analytics.satisfactionMetrics.average}%</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Average</p>
              <p className="text-xs text-gray-500">3 stars</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 bg-rose-700 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{analytics.satisfactionMetrics.poor}%</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Poor</p>
              <p className="text-xs text-gray-500">1-2 stars</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Mentors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Top Performing Mentors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Mentor</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Expertise</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Sessions</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Rating</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Completion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topMentors.map((mentor, index) => (
                  <tr key={mentor.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-amber-600 text-white' :
                        index === 1 ? 'bg-slate-500 text-white' :
                        index === 2 ? 'bg-orange-700 text-white' :
                        'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                          {mentor.name[0]}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{mentor.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{mentor.expertise}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
                        <Calendar className="w-3 h-3" />
                        {mentor.totalSessions}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-full">
                        <Star className="w-3 h-3" />
                        {mentor.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {mentor.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

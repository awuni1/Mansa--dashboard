'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface Mentee {
  id: string;
  email: string;
  name: string;
  created_at: string;
  total_bookings: number;
  completed_sessions: number;
  is_mentor: boolean;
  is_mentee: boolean;
  last_booking?: string;
  member_id?: string;
}

export default function MenteesManagementPage() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchMentees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentees/?page=${page}&page_size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch mentees');
      }

      const data = await response.json();
      console.log('Mentees API response:', data);
      setMentees(data.results || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching mentees:', error);
      setMentees([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentees = mentees.filter(mentee => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      mentee.name.toLowerCase().includes(query) ||
      mentee.email.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && mentees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading mentees...</p>
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
            <Users className="w-8 h-8 text-purple-600" />
            Mentee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View all mentees and their session history
          </p>
        </div>
        <Link
          href="/dashboard/mentorship"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Mentees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Also Mentors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mentees.filter(m => m.is_mentor).length}
                </p>
              </div>
              <Award className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active This Month</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mentees.filter(m => m.total_bookings > 0).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mentees Only</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mentees.filter(m => !m.is_mentor).length}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={fetchMentees}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Mentees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Mentees ({filteredMentees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Mentee</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Sessions</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentees.map((mentee) => (
                  <tr key={mentee.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {mentee.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{mentee.name}</p>
                          <p className="text-xs text-gray-500">ID: {mentee.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        {mentee.email}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{mentee.total_bookings} total</p>
                        <p className="text-xs text-green-600">{mentee.completed_sessions} completed</p>
                      </div>
                    </td>
                    <td className="py-4">
                      {mentee.is_mentor ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                          <Award className="w-3 h-3" />
                          Also Mentor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                          <Users className="w-3 h-3" />
                          Mentee Only
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                      {mentee.last_booking ? new Date(mentee.last_booking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No recent activity'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} mentees
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

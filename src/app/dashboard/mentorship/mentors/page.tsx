'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  UserCheck,
  X,
  Check,
  Clock,
  Mail,
  MapPin,
  Briefcase,
  Award,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Mentor {
  id: string;
  member_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  linkedin?: string;
  experience?: string;
  areaofexpertise?: string;
  jobtitle?: string;
  bio?: string;
  photo_url?: string;
  is_approved: boolean;
  created_at: string;
  member_data?: any;
  rating?: number;
  total_sessions?: number;
  engagement_score?: number;
}

function computeScore(mentor: Mentor): number {
  const sessions = Math.min(mentor.total_sessions || 0, 50);
  const rating = Math.min(mentor.rating || 0, 5);
  const approved = mentor.is_approved ? 20 : 0;
  return Math.min(sessions + Math.floor(rating * 6) + approved, 100);
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}/100
    </span>
  );
}

export default function MentorsManagementPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchMentors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentors/?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }

      const data = await response.json();
      setMentors(data.results || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (mentorId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentors/${mentorId}/approve/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        fetchMentors();
        console.log('Mentor approved successfully!');
      } else {
        throw new Error('Failed to approve mentor');
      }
    } catch (error) {
      console.error('Error approving mentor:', error);
      console.error('Failed to approve mentor. Please try again.');
    }
  };

  const handleReject = async (mentorId: string) => {
    if (!confirm('Are you sure you want to reject this mentor application?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentors/${mentorId}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (response.ok) {
        fetchMentors();
        console.log('Mentor application rejected.');
      } else {
        throw new Error('Failed to reject mentor');
      }
    } catch (error) {
      console.error('Error rejecting mentor:', error);
      console.error('Failed to reject mentor. Please try again.');
    }
  };

  const handleDeleteMentor = async (mentor: Mentor) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${mentor.name || 'this mentor'}? This cannot be undone.`)) {
      return;
    }
    setDeleteLoadingId(mentor.id);
    setDeleteError(null);
    const result = await api.deleteMentor(mentor.id);
    setDeleteLoadingId(null);
    if (result.error) {
      setDeleteError(`Delete failed: ${result.error}`);
    } else {
      fetchMentors();
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = mentor.name || '';
    const email = mentor.email || '';
    const jobtitle = mentor.jobtitle || '';
    const city = mentor.city || '';

    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      jobtitle.toLowerCase().includes(query) ||
      city.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Mentor Management</h1>
        </div>
        <Link
          href="/dashboard/mentorship"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {deleteError && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-red-800">{deleteError}</p>
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Total Mentors</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{totalCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">All applications</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Approved</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{mentors.filter(m => m.is_approved).length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Active mentors</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Pending Review</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{mentors.filter(m => !m.is_approved).length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Awaiting approval</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, title, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full pl-9"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('approved')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                filter === 'approved'
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Mentor Applications</span>
        </div>
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-[13px] text-gray-500">Loading mentors...</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[13px] text-gray-500">No mentors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Mentor</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Contact</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Experience</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Score</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Status</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[13px] flex-shrink-0">
                            {mentor.name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{mentor.name}</p>
                            <p className="text-[11px] text-gray-500">{mentor.jobtitle || 'No title'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {mentor.email}
                          </p>
                          <p className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {mentor.city}, {mentor.country}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        <p>{mentor.experience || '0'} years</p>
                        {mentor.areaofexpertise && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{mentor.areaofexpertise}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        <ScoreBadge score={mentor.engagement_score ?? computeScore(mentor)} />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        {mentor.is_approved ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/community/mentorship/${mentor.id}`}
                            target="_blank"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {!mentor.is_approved && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(mentor.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(mentor.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {mentor.is_approved && (
                            <button
                              type="button"
                              onClick={() => handleReject(mentor.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Revoke"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMentor(mentor)}
                            disabled={deleteLoadingId === mentor.id}
                            className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete mentor"
                          >
                            {deleteLoadingId === mentor.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-[12px] text-gray-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} mentors
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

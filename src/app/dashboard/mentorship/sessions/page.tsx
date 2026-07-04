'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Video,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  mentee_id: string;
  mentee_name: string;
  mentee_email: string;
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meeting_link?: string;
  created_at: string;
}

export default function SessionsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        role: 'admin',
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(
        `${apiUrl}/v1/mentorship/bookings/?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Sessions API response:', data);
      setBookings(data.results || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      // Handle both ISO timestamps and date-only strings
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', time, error);
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">Confirmed</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">Pending</span>;
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const selectAllBookings = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Mentee', 'Mentor', 'Topic', 'Status', 'Meeting Link'];
    const rows = filteredBookings.map(booking => [
      booking.session_date,
      `${booking.start_time} - ${booking.end_time}`,
      `${booking.mentee_name} (${booking.mentee_email})`,
      `${booking.mentor_name} (${booking.mentor_email})`,
      booking.topic,
      booking.status,
      booking.meeting_link || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorship-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkAction = async (action: 'cancel' | 'complete') => {
    if (selectedBookings.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedBookings.size} selected session(s)?`
    );
    if (!confirmed) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const newStatus = action === 'cancel' ? 'cancelled' : 'completed';

    const results = await Promise.allSettled(
      Array.from(selectedBookings).map((bookingId) =>
        fetch(`${apiUrl}/v1/mentorship/bookings/${bookingId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        })
      )
    );

    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as Response).ok
    ).length;
    const failed = results.length - succeeded;

    if (succeeded > 0) toast.success(`${succeeded} session(s) marked as ${newStatus}.`);
    if (failed > 0) toast.error(`${failed} session(s) failed to update.`);

    setSelectedBookings(new Set());
    fetchBookings();
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.mentee_name.toLowerCase().includes(query) ||
      booking.mentor_name.toLowerCase().includes(query) ||
      booking.topic.toLowerCase().includes(query)
    );
  });

  const upcomingCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

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
          <h1 className="text-xl font-bold text-gray-900 leading-none">Sessions Command Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/dashboard/mentorship"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{totalCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">All time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{upcomingCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Scheduled</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Completed</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{completedCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Finished</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Cancelled</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{cancelledCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by mentee, mentor, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full pl-9"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors capitalize ${
                    filter === f
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[13px] font-medium text-blue-900">
                {selectedBookings.size} session(s) selected
              </p>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => handleBulkAction('complete')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Mark Complete
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('cancel')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Cancel Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedBookings(new Set())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">All Sessions ({filteredBookings.length})</span>
          <button
            type="button"
            onClick={selectAllBookings}
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700"
          >
            {selectedBookings.size === filteredBookings.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-[13px] text-gray-500">Loading sessions...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[13px] text-gray-500">No sessions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-4 transition-colors ${
                    selectedBookings.has(booking.id)
                      ? 'bg-blue-50 border-l-2 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedBookings.has(booking.id)}
                      onChange={() => toggleBookingSelection(booking.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                      aria-label={`Select session: ${booking.topic}`}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[13px] font-semibold text-gray-900">
                          {booking.topic}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Mentee</p>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[11px] font-bold flex-shrink-0">
                              {booking.mentee_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-gray-900">
                                {booking.mentee_name}
                              </p>
                              <p className="text-[11px] text-gray-500">{booking.mentee_email}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Mentor</p>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[11px] font-bold flex-shrink-0">
                              {booking.mentor_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-gray-900">
                                {booking.mentor_name}
                              </p>
                              <p className="text-[11px] text-gray-500">{booking.mentor_email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(booking.session_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>

                      <div className="text-[11px] text-blue-600 mt-1 ml-5">
                        Times shown in mentor&apos;s timezone
                      </div>

                      {booking.description && (
                        <p className="text-[13px] text-gray-500 mt-2">
                          {booking.description}
                        </p>
                      )}

                      {/* Meeting Link */}
                      {booking.meeting_link && (
                        <div className="mt-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            <a
                              href={booking.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              Join Meeting
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedBooking === booking.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Booking ID</p>
                          <p className="font-mono text-[11px] text-gray-700">{booking.id}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Created At</p>
                          <p className="text-gray-700">
                            {new Date(booking.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-[12px] text-gray-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} sessions
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

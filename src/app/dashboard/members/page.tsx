'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { api, Member } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { Search, Eye, Edit, Trash2, Mail, Users, ChevronLeft, ChevronRight, UserPlus, Filter, Download, TrendingUp, MapPin, Briefcase, Phone } from 'lucide-react';
import { toast } from 'sonner';

const MEMBER_ROLES = ['user', 'mentee', 'mentor', 'mentor_mentee', 'admin'] as const;

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Admin action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleModalMember, setRoleModalMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');

  // Email compose modal
  const [composeTarget, setComposeTarget] = useState<Member | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Debounced search
  const { searchTerm, setSearchTerm, debouncedValue, isSearching } = useDebounceSearch('', {
    delay: 500,
    minLength: 0,
  });

  // Fetch members with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.platformMembers({ page: currentPage, search: debouncedValue }),
    queryFn: () => api.getPlatformMembers({
      page: currentPage,
      search: debouncedValue || undefined,
    }),
    select: (response) => response.data,
  });

  const members = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const filteredMembers = members.filter(member => {
    if (filterType === 'all') return true;
    return member.membershiptype?.toLowerCase() === filterType.toLowerCase();
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedValue !== searchTerm) {
      setCurrentPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const sendEmail = (member: Member) => {
    if (!member.email) {
      toast.error('This member has no email address on record.');
      return;
    }
    setEmailSubject('Mansa to Mansa — Message for You');
    setEmailBody(`Dear ${member.name || member.full_name || 'Member'},\n\n`);
    setComposeTarget(member);
  };

  const handleSendEmail = async () => {
    if (!composeTarget) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Please fill in both subject and message.');
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          to: composeTarget.email,
          toName: composeTarget.name || composeTarget.full_name,
          subject: emailSubject,
          body: emailBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Email sent to ${composeTarget.name || composeTarget.email}!`);
        setComposeTarget(null);
      } else {
        toast.error(data.error || 'Failed to send email.');
      }
    } catch {
      toast.error('Network error — could not send email.');
    } finally {
      setEmailSending(false);
    }
  };

  const csvSafe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Profession', 'Location', 'Joined'];
    const rows = members.map(m => [
      csvSafe(m.name || m.full_name || ''),
      csvSafe(m.email || ''),
      csvSafe(m.profession || m.occupation || m.jobtitle || ''),
      csvSafe(m.location || m.city || ''),
      new Date(m.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    a.click();
  };

  const handleDeleteMember = async (member: Member) => {
    if (!window.confirm(`Are you sure you want to delete ${member.name || member.full_name || 'this member'}? This action cannot be undone.`)) {
      return;
    }
    setActionLoadingId(member.id);
    setActionError(null);
    const result = await api.deleteUser(member.id);
    setActionLoadingId(null);
    if (result.error) {
      setActionError(`Delete failed: ${result.error}`);
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.platformMembers({ page: currentPage, search: debouncedValue }) });
    }
  };

  const handleAssignRole = async () => {
    if (!roleModalMember) return;
    setActionLoadingId(roleModalMember.id);
    setActionError(null);
    const result = await api.assignRole(roleModalMember.id, selectedRole);
    setActionLoadingId(null);
    if (result.error) {
      setActionError(`Role change failed: ${result.error}`);
    } else {
      setRoleModalMember(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.platformMembers({ page: currentPage, search: debouncedValue }) });
    }
  };

  const handlePromoteToMentor = async (member: Member) => {
    if (!window.confirm(`Promote ${member.name || member.full_name || 'this member'} to mentor? This will create a Supabase mentor profile.`)) {
      return;
    }
    setActionLoadingId(member.id);
    setActionError(null);
    const result = await api.promoteToMentor(member.id);
    setActionLoadingId(null);
    if (result.error) {
      setActionError(`Promote failed: ${result.error}`);
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.platformMembers({ page: currentPage, search: debouncedValue }) });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Members</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-yellow-800">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-red-800">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, profession, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-[13px] rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>

            {showFilters && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 bg-white text-gray-700 text-[13px] rounded-lg px-3 py-1.5 hover:bg-gray-50 focus:outline-none"
                aria-label="Filter member type"
                title="Filter by member type"
              >
                <option value="all">All Types</option>
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="trial">Trial</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Members Directory */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
            Members Directory ({filteredMembers.length})
          </span>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="space-y-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Member</TableHead>
                    <TableHead className="font-bold text-gray-700">Contact</TableHead>
                    <TableHead className="font-bold text-gray-700">Profession</TableHead>
                    <TableHead className="font-bold text-gray-700">Location</TableHead>
                    <TableHead className="font-bold text-gray-700">Joined</TableHead>
                    <TableHead className="font-bold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 min-w-[40px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-base leading-none select-none">
                              {((member.name || member.full_name || 'U')[0]).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{member.name || member.full_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                                {member.membershiptype || 'Standard'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-3 w-3 text-blue-600" />
                            {member.email || 'N/A'}
                          </div>
                          {(member.phone || member.phone_number) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3 text-green-600" />
                              {member.phone || member.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{member.profession || member.occupation || member.jobtitle || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-gray-700">{member.location || member.city || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(member.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowModal(true);
                            }}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => sendEmail(member)}
                            title="Send email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalMember(member);
                              setSelectedRole('user');
                            }}
                            disabled={actionLoadingId === member.id}
                            title="Change role"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromoteToMentor(member)}
                            disabled={actionLoadingId === member.id}
                            title="Promote to mentor"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member)}
                            disabled={actionLoadingId === member.id}
                            title="Delete member"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === member.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 min-w-[48px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg leading-none select-none">
                        {((member.name || member.full_name || 'U')[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{member.name || member.full_name || 'N/A'}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                        {member.membershiptype || 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="truncate">{member.email || 'N/A'}</span>
                    </div>
                    {(member.phone || member.phone_number) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>{member.phone || member.phone_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span>{member.profession || member.occupation || member.jobtitle || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>{member.location || member.city || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setShowModal(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => sendEmail(member)}
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleModalMember(member);
                        setSelectedRole('user');
                      }}
                      disabled={actionLoadingId === member.id}
                      title="Change role"
                      className="p-1.5 text-purple-600 border border-purple-200 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromoteToMentor(member)}
                      disabled={actionLoadingId === member.id}
                      title="Promote to mentor"
                      className="p-1.5 text-green-600 border border-green-200 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member)}
                      disabled={actionLoadingId === member.id}
                      title="Delete member"
                      className="p-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === member.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[13px] text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                    <span className="text-gray-400 ml-1.5">({totalCount} total members)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="hidden sm:flex gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            type="button"
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-100 mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No members found</h3>
            <p className="text-[13px] text-gray-500 max-w-md mx-auto">
              {error ? 'Unable to load members from platform data.' : 'No members match your search criteria. Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {roleModalMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Change Role</h2>
              <button
                type="button"
                onClick={() => setRoleModalMember(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-gray-600">
                Assign a new role to <span className="font-semibold text-gray-900">{roleModalMember.name || roleModalMember.full_name}</span>.
              </p>
              <div>
                <label htmlFor="role-select" className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Role
                </label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MEMBER_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRoleModalMember(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleAssignRole}
                  disabled={actionLoadingId === roleModalMember.id}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoadingId === roleModalMember.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : null}
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      {composeTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {(composeTarget.name || composeTarget.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">New Message</p>
                    <p className="text-blue-200 text-xs mt-0.5">
                      To: {composeTarget.name || composeTarget.full_name || 'Member'} &lt;{composeTarget.email}&gt;
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setComposeTarget(null)}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
                />
              </div>

              {/* Message body */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={8}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 resize-none leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{emailBody.length} characters</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setComposeTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base leading-none flex-shrink-0">
                    {(selectedMember.name || selectedMember.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selectedMember.name || selectedMember.full_name || 'Unknown Member'}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                        {selectedMember.membershiptype || 'Standard'}
                      </span>
                      {selectedMember.is_active !== undefined && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${selectedMember.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {selectedMember.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Contact Information */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Full Name
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.name || selectedMember.full_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email Address
                    </p>
                    <p className="text-sm text-gray-900 font-medium break-all">{selectedMember.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Phone Number
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.phone || selectedMember.phone_number || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> City / Location
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.city || selectedMember.location || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Country
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.country || 'N/A'}</p>
                  </div>
                  {selectedMember.linkedin && (
                    <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">LinkedIn</p>
                      <a href={selectedMember.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline break-all">
                        {selectedMember.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Professional Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Job Title / Profession
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.jobtitle || selectedMember.occupation || selectedMember.profession || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Industry
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.industry || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">School / Institution</p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.school || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Major / Field of Study</p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.major || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Area of Expertise
                    </p>
                    <p className="text-sm text-gray-700">{selectedMember.areaOfExpertise || selectedMember.areaofexpertise || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Skills</p>
                    <p className="text-sm text-gray-700">{selectedMember.skills || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Experience</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedMember.experience || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Profile & Membership */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Profile & Membership</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Users className="h-3 w-3" /> Membership Type
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.membershiptype || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Level</p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.level || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Gender</p>
                    <p className="text-sm text-gray-900 font-medium">{selectedMember.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Member Since</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(selectedMember.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {(selectedMember.bio) && (
                    <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedMember.bio}</p>
                    </div>
                  )}
                  {(selectedMember.motivation) && (
                    <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 sm:col-span-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Motivation / Why Joined</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedMember.motivation}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => sendEmail(selectedMember)}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

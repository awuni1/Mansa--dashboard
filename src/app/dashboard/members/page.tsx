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

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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
  }, [debouncedValue]);

  const sendEmail = async (member: Member) => {
    const subject = 'Mansa to Mansa - Important Update';
    const body = `Dear ${member.name || member.full_name || 'Member'},\n\nThank you for being a member of Mansa to Mansa.\n\nWe appreciate your continued participation in our community of African professionals.\n\nBest regards,\nMansa to Mansa Team`;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{ email: member.email, name: member.name || member.full_name || 'Member' }],
          subject: subject,
          body: body
        }),
      });

      const result = await response.json();

      if (result.useMailto || !result.success) {
        // Fallback to mailto
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(`mailto:${member.email}?subject=${encodedSubject}&body=${encodedBody}`);
      } else {
        alert('Email sent successfully');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback to mailto
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:${member.email}?subject=${encodedSubject}&body=${encodedBody}`);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedValue !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedValue]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Profession', 'Location', 'Joined'];
    const rows = members.map(m => [
      m.name || m.full_name || '',
      m.email || '',
      m.profession || m.occupation || m.jobtitle || '',
      m.location || m.city || '',
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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Users className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              Platform Members
            </h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Manage and engage with your community</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl border border-white/30 flex-1 md:flex-none">
              <div className="text-white/90 text-xs sm:text-sm font-medium">Total Members</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                {totalCount}
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-300" />
              </div>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 px-3 sm:px-4 py-2 text-sm sm:text-base"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-md animate-slideInFromRight">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-yellow-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters & Search Bar */}
      <Card className="border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search by name, email, profession, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              {showFilters && (
                <div className="flex gap-2 animate-slideInFromRight">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <Card className="border-2 border-gray-100 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              Members Directory ({filteredMembers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length > 0 ? (
            <div className="space-y-0">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <TableHead className="font-bold text-gray-700">Member</TableHead>
                      <TableHead className="font-bold text-gray-700">Contact</TableHead>
                      <TableHead className="font-bold text-gray-700">Profession</TableHead>
                      <TableHead className="font-bold text-gray-700">Location</TableHead>
                      <TableHead className="font-bold text-gray-700">Joined</TableHead>
                      <TableHead className="font-bold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member, index) => (
                      <TableRow 
                        key={member.id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 border-b border-gray-100"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-base leading-none select-none">
                                {((member.name || member.full_name || 'U')[0]).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{member.name || member.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{member.membershiptype || 'Standard'}</div>
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
                            <Briefcase className="h-4 w-4 text-purple-600" />
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowModal(true);
                              }}
                              className="hover:scale-105 transition-transform shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => sendEmail(member)}
                              className="hover:scale-105 transition-transform shadow-sm"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredMembers.map((member, index) => (
                  <div 
                    key={member.id} 
                    className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 animate-slideInFromRight"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 min-w-[48px] rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg leading-none select-none">
                          {((member.name || member.full_name || 'U')[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name || member.full_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">{member.membershiptype || 'Standard'}</p>
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
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        <span>{member.profession || member.occupation || member.jobtitle || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{member.location || member.city || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-medium text-gray-700">
                      Showing page <span className="text-blue-600 font-bold">{currentPage}</span> of{' '}
                      <span className="text-blue-600 font-bold">{totalPages}</span>
                      <span className="text-gray-500 ml-2">({totalCount} total members)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="hover:scale-105 transition-transform shadow-md"
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
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg scale-110'
                                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:scale-105'
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
                        className="hover:scale-105 transition-transform shadow-md"
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-4">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {error ? 'Unable to load members from platform data.' : 'No members match your search criteria. Try adjusting your filters.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Member Details Modal */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideInFromRight">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-6 z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg leading-none">
                    {(selectedMember.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Member Profile</h2>
                    <p className="text-blue-100">{selectedMember.membershiptype || 'Standard'} Member</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:rotate-90 transition-all duration-300"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Full Name
                  </label>
                  <p className="text-base text-gray-900 font-medium">{selectedMember.full_name}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-base text-gray-900 font-medium break-all">{selectedMember.email}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <p className="text-base text-gray-900 font-medium">{selectedMember.phone_number || 'N/A'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Profession
                  </label>
                  <p className="text-base text-gray-900 font-medium">{selectedMember.profession || 'N/A'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl border-2 border-red-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  <p className="text-base text-gray-900 font-medium">{selectedMember.location || 'N/A'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-indigo-100 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membership Type
                  </label>
                  <p className="text-base text-gray-900 font-medium">{selectedMember.membershiptype || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Skills
                  </label>
                  <p className="text-base text-gray-700 leading-relaxed">{selectedMember.skills || 'No skills listed'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Area of Expertise
                  </label>
                  <p className="text-base text-gray-700 leading-relaxed">{selectedMember.areaOfExpertise || 'No expertise listed'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all">
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    Experience
                  </label>
                  <p className="text-base text-gray-700 leading-relaxed">{selectedMember.experience || 'No experience listed'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                  <label className="block text-sm font-bold text-blue-900 mb-2">Member Since</label>
                  <p className="text-base text-gray-900 font-medium">
                    {new Date(selectedMember.created_at).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-6 text-base hover:scale-105 transition-transform shadow-md"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => sendEmail(selectedMember)}
                  className="flex-1 py-6 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:scale-105 transition-transform shadow-lg"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
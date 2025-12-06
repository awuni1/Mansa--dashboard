'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { api, Member, ProjectApplication } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { Search, Eye, Mail, FileText, Filter, Download, TrendingUp, Users, Briefcase, Calendar, Clock, CheckCircle } from 'lucide-react';

interface FormSubmission {
  id: string;
  form_type: string;
  form_data: any;
  email?: string;
  name?: string;
  created_at: string;
}

export default function FormsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const { searchTerm, setSearchTerm, debouncedValue, isSearching } = useDebounceSearch('', {
    delay: 500,
    minLength: 0,
  });

  // Fetch members
  const { data: membersData } = useQuery({
    queryKey: queryKeys.platformMembers({ page: 1, search: '' }),
    queryFn: () => api.getPlatformMembers(),
    select: (response) => response.data,
  });

  // Fetch applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: queryKeys.platformApplications({ page: 1, search: '' }),
    queryFn: () => api.getPlatformApplications(),
    select: (response) => response.data,
  });

  // Transform data into form submissions
  const submissions = useMemo(() => {
    const realTimeSubmissions: FormSubmission[] = [];

    // Convert members to form submissions
    if (membersData?.results) {
      membersData.results.forEach(member => {
        realTimeSubmissions.push({
          id: `member_${member.id}`,
          form_type: 'membership',
          form_data: member,
          email: member.email,
          name: member.full_name || member.name,
          created_at: member.created_at,
        });
      });
    }

    // Convert project applications to form submissions
    if (applicationsData?.results) {
      applicationsData.results.forEach(application => {
        realTimeSubmissions.push({
          id: `application_${application.id}`,
          form_type: 'project',
          form_data: application,
          email: application.applicant_email || application.email,
          name: application.applicant_name || application.full_name,
          created_at: application.created_at,
        });
      });
    }

    // Sort by creation date (most recent first)
    return realTimeSubmissions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [membersData, applicationsData]);

  // Filter submissions based on search and type
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      const searchLower = debouncedValue.toLowerCase();
      return (
        submission.name?.toLowerCase().includes(searchLower) ||
        submission.email?.toLowerCase().includes(searchLower) ||
        JSON.stringify(submission.form_data).toLowerCase().includes(searchLower)
      );
    });

    if (typeFilter !== 'all') {
      filtered = filtered.filter(submission => submission.form_type === typeFilter);
    }

    return filtered;
  }, [submissions, debouncedValue, typeFilter]);

  const sendEmail = async (submission: FormSubmission) => {
    const subject = 'Mansa to Mansa - Form Submission Follow-up';
    const body = `Dear ${submission.name || 'Applicant'},\n\nThank you for your ${submission.form_type} submission.\n\nWe have received your information and will be in touch soon.\n\nBest regards,\nMansa to Mansa Team`;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{ email: submission.email, name: submission.name || 'Applicant' }],
          subject: subject,
          body: body,
          fromEmail: 'mansatomansa@gmail.com'
        }),
      });

      const result = await response.json();

      if (result.useMailto || !result.success) {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(`mailto:${submission.email}?subject=${encodedSubject}&body=${encodedBody}&from=mansatomansa@gmail.com`);
      } else {
        alert('Email sent successfully from mansatomansa@gmail.com');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:${submission.email}?subject=${encodedSubject}&body=${encodedBody}&from=mansatomansa@gmail.com`);
    }
  };

  const getFormTypeBadge = (type: string) => {
    switch (type) {
      case 'contact':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-300">
            <Mail className="h-3 w-3" />
            Contact
          </span>
        );
      case 'membership':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300">
            <Users className="h-3 w-3" />
            Membership
          </span>
        );
      case 'project':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-2 border-purple-300">
            <Briefcase className="h-3 w-3" />
            Project
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gray-100 text-gray-800 border-2 border-gray-300">
            <FileText className="h-3 w-3" />
            {type}
          </span>
        );
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Submitted'];
    const rows = filteredSubmissions.map(s => [
      s.name || 'Anonymous',
      s.email || 'N/A',
      s.form_type,
      new Date(s.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-submissions.csv';
    a.click();
  };

  const renderFormData = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;

      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let displayValue = value;

      if (typeof value === 'string' && value.length > 100) {
        displayValue = value.substring(0, 100) + '...';
      }

      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium text-gray-700">{displayKey}</label>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayValue || 'N/A'}</p>
        </div>
      );
    }).filter(Boolean);
  };

  const membershipCount = submissions.filter(s => s.form_type === 'membership').length;
  const projectCount = submissions.filter(s => s.form_type === 'project').length;
  const contactCount = submissions.filter(s => s.form_type === 'contact').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="h-8 w-8 text-indigo-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              Form Submissions
            </h1>
            <p className="text-purple-100 text-sm sm:text-base lg:text-lg">Track and manage all platform submissions</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl border border-white/30 flex-1 md:flex-none">
              <div className="text-white/90 text-xs sm:text-sm font-medium">Total Submissions</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                {submissions.length}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div onClick={() => setTypeFilter('membership')} className="cursor-pointer">
          <Card className="border border-green-200 hover:shadow-lg sm:hover:shadow-xl transition-all">
            <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Membership Forms</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{membershipCount}</p>
              </div>
              <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg sm:rounded-xl">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        <div onClick={() => setTypeFilter('project')} className="cursor-pointer">
          <Card className="border border-purple-200 hover:shadow-lg sm:hover:shadow-xl transition-all">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Project Applications</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">{projectCount}</p>
              </div>
              <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg sm:rounded-xl">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        <div onClick={() => setTypeFilter('contact')} className="cursor-pointer col-span-2 lg:col-span-1">
          <Card className="border border-blue-200 hover:shadow-lg sm:hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Forms</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{contactCount}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-2 border-gray-100 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                <Input
                  placeholder="Search by name, email, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-indigo-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
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
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none bg-white shadow-sm hover:shadow-md transition-all"
                    aria-label="Filter by form type"
                    title="Select form type"
                  >
                    <option value="all">All Types</option>
                    <option value="contact">Contact</option>
                    <option value="membership">Membership</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="border-2 border-gray-100 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b-2 border-gray-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              Submissions ({filteredSubmissions.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <TableHead className="font-bold text-gray-700">Submitter</TableHead>
                    <TableHead className="font-bold text-gray-700">Contact</TableHead>
                    <TableHead className="font-bold text-gray-700">Type</TableHead>
                    <TableHead className="font-bold text-gray-700">Submitted</TableHead>
                    <TableHead className="font-bold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission, index) => (
                    <TableRow 
                      key={submission.id} 
                      className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-100"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-base leading-none select-none">
                              {(submission.name || 'A')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="font-semibold text-gray-900">{submission.name || 'Anonymous'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-3 w-3 text-indigo-600" />
                          {submission.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFormTypeBadge(submission.form_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{new Date(submission.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowModal(true);
                            }}
                            className="hover:scale-105 transition-transform shadow-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {submission.email && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => sendEmail(submission)}
                              className="hover:scale-105 transition-transform shadow-sm"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No form submissions match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Submission Details Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideInFromRight">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-600 p-6 z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg leading-none">
                    {(selectedSubmission.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Submission Details</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {getFormTypeBadge(selectedSubmission.form_type)}
                      <span className="text-indigo-100 text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedSubmission.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:rotate-90 transition-all duration-300"
                  aria-label="Close modal"
                  title="Close"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(selectedSubmission.form_data).map(([key, value]) => {
                  if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;

                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue: string = String(value || 'N/A');

                  if (typeof value === 'string' && value.length > 100) {
                    displayValue = value.substring(0, 100) + '...';
                  } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2);
                  }

                  return (
                    <div key={key} className="bg-gradient-to-br from-gray-50 to-indigo-50 p-5 rounded-xl border-2 border-indigo-100 hover:shadow-lg transition-all">
                      <label className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {displayKey}
                      </label>
                      <p className="text-base text-gray-900 whitespace-pre-wrap break-words">{displayValue}</p>
                    </div>
                  );
                }).filter(Boolean)}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-6 text-base hover:scale-105 transition-transform shadow-md"
                >
                  Close
                </Button>
                {selectedSubmission.email && (
                  <Button 
                    onClick={() => sendEmail(selectedSubmission)}
                    className="flex-1 py-6 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 transition-transform shadow-lg"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Send Email Response
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

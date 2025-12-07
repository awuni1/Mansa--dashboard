'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { api, ProjectApplication } from '@/lib/api';
import { Search, Eye, Check, X, Mail, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Download } from 'lucide-react';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ProjectApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ProjectApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadApplications();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Fetch project applications from members who have applied
      const { data, error } = await api.getProjectApplications({
        page: currentPage,
        search: searchTerm || undefined,
      });

      if (error) {
        console.error('Error loading applications:', error);
        alert(`Failed to load applications: ${error}`);
        setApplications([]);
        setTotalCount(0);
        return;
      }

      if (data) {
        console.log('Loaded applications:', data.results?.length || 0, 'Total:', data.count);
        setApplications(data.results || []);
        setTotalCount(data.count || 0);
      } else {
        console.warn('No data returned from API');
        setApplications([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      alert(`An error occurred while loading applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string | number, status: 'approved' | 'denied') => {
    try {
      const numericId = typeof id === 'string' ? parseInt(id) : id;

      let response;
      if (status === 'approved') {
        response = await api.approveApplication(numericId);
      } else {
        response = await api.denyApplication(numericId);
      }

      if (response.error) {
        alert(`Failed to ${status} application: ${response.error}`);
        return;
      }

      // Reload applications to get updated data
      loadApplications();

      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const sendStatusEmail = async (application: ProjectApplication, status: string) => {
    const statusMessage = status === 'approved'
      ? 'We are pleased to inform you that your project application has been approved!'
      : status === 'denied'
      ? 'Thank you for your project application. After careful review, we are unable to approve it at this time.'
      : 'Thank you for your project application. We are currently reviewing it and will get back to you soon.';

    const subject = `Mansa to Mansa - Project Application ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const applicantName = application.applicant_name || application.full_name || 'Applicant';
    const applicantEmail = application.applicant_email || application.email || '';
    const projectTitle = application.project_title || 'N/A';

    const body = `Dear ${applicantName},\n\n${statusMessage}\n\nProject: ${projectTitle}\n\nWe will be in touch with next steps.\n\nBest regards,\nMansa to Mansa Team`;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{ email: applicantEmail, name: applicantName }],
          subject: subject,
          body: body
        }),
      });

      const result = await response.json();

      if (result.useMailto || !result.success) {
        // Fallback to mailto
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(`mailto:${applicantEmail}?subject=${encodedSubject}&body=${encodedBody}`);
      } else {
        alert('Email sent successfully');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback to mailto
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:${applicantEmail}?subject=${encodedSubject}&body=${encodedBody}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex px-3 py-1.5 text-xs font-bold rounded-full border-2';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300`;
      case 'approved':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300`;
      case 'denied':
      case 'rejected':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300`;
      case 'waitlist':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-300`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / 20);
  
  // Calculate stats
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const deniedCount = applications.filter(app => app.status === 'denied' || app.status === 'rejected').length;
  const waitlistCount = applications.filter(app => app.status === 'waitlist').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Project Applications
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                Review and manage applicants who want to join projects
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div 
          onClick={() => setStatusFilter('pending')} 
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="border-2 border-yellow-100 hover:border-yellow-300 hover:shadow-2xl transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl">
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div 
          onClick={() => setStatusFilter('approved')} 
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-2xl transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mt-2">{approvedCount}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div 
          onClick={() => setStatusFilter('denied')} 
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Denied</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mt-2">{deniedCount}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl">
                  <XCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div 
          onClick={() => setStatusFilter('waitlist')} 
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Waitlist</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mt-2">{waitlistCount}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-2 border-gray-100 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by applicant name, email, or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 focus:border-indigo-500 rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white shadow-sm hover:shadow-md transition-all text-sm sm:text-base font-medium"
                aria-label="Filter by status"
                title="Select status filter"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="denied">❌ Denied</option>
                <option value="waitlist">📋 Waitlist</option>
              </select>
              
              <Button 
                variant="outline" 
                onClick={loadApplications}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Refresh
              </Button>

              <Button 
                variant="primary"
                onClick={() => setStatusFilter('all')}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Users className="h-4 w-4" />
                View All ({totalCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Applications Table */}
      <Card className="border-2 border-gray-100 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b-2 border-gray-100">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Applications Directory ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredApplications.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <TableHead className="font-bold text-gray-700">Applicant</TableHead>
                      <TableHead className="font-bold text-gray-700">Project</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Applied Date</TableHead>
                      <TableHead className="font-bold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => {
                      const applicantName = application.applicant_name || application.full_name || 'N/A';
                      const applicantEmail = application.applicant_email || application.email || 'N/A';
                      const appliedDate = application.applied_at || application.applied_date || application.created_at;

                      return (
                        <TableRow 
                          key={application.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-100"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-base">
                                  {applicantName[0]?.toUpperCase() || 'A'}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{applicantName}</div>
                                <div className="text-sm text-gray-500">{applicantEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate text-gray-900">
                              {application.project_title || `Project #${application.project_id || application.project || 'N/A'}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={getStatusBadge(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(appliedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowModal(true);
                                }}
                                className="hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {application.status === 'pending' && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => updateApplicationStatus(application.id, 'approved')}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="Approve Application"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => updateApplicationStatus(application.id, 'denied')}
                                    title="Deny Application"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendStatusEmail(application, application.status)}
                                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                title="Send Email"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredApplications.map((application) => {
                  const applicantName = application.applicant_name || application.full_name || 'N/A';
                  const applicantEmail = application.applicant_email || application.email || 'N/A';
                  const appliedDate = application.applied_at || application.applied_date || application.created_at;

                  return (
                    <div 
                      key={application.id}
                      className="p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {applicantName[0]?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{applicantName}</h3>
                          <p className="text-sm text-gray-500 truncate">{applicantEmail}</p>
                          <span className={`${getStatusBadge(application.status)} mt-2`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700">Project: </span>
                            <span className="text-gray-600">
                              {application.project_title || `Project #${application.project_id || application.project || 'N/A'}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                          <span>Applied: {new Date(appliedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowModal(true);
                          }}
                          className="flex-1 min-w-[100px]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {application.status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => updateApplicationStatus(application.id, 'approved')}
                              className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => updateApplicationStatus(application.id, 'denied')}
                              className="flex-1 min-w-[100px]"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Deny
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendStatusEmail(application, application.status)}
                          className="flex-1 min-w-[100px]"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 p-6 bg-gray-50 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="font-semibold"
                  >
                    ← Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Page <span className="font-bold text-indigo-600">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="font-semibold"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                  <FileText className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-500 mb-2">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} applications at the moment` 
                  : 'No project applications have been submitted yet'}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Total applications in database: {totalCount} | Current filter: {statusFilter}
              </p>
              {statusFilter !== 'all' && (
                <Button 
                  variant="primary"
                  onClick={() => setStatusFilter('all')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  View All Applications
                </Button>
              )}
              <div className="mt-6">
                <Button 
                  variant="outline"
                  onClick={loadApplications}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Reload Data
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 sm:px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Application Details</h2>
                  <p className="text-indigo-100 text-sm mt-1">Complete application information</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Modal"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Applicant Info Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-2xl">
                      {(selectedApplication.applicant_name || selectedApplication.full_name || 'A')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedApplication.applicant_name || selectedApplication.full_name || 'N/A'}
                    </h3>
                    <p className="text-indigo-600 font-medium">
                      {selectedApplication.applicant_email || selectedApplication.email || 'N/A'}
                    </p>
                  </div>
                  <span className={getStatusBadge(selectedApplication.status)}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Project</span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {selectedApplication.project_title || `Project #${selectedApplication.project_id || selectedApplication.project || 'N/A'}`}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Applied Date</span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {new Date(
                        selectedApplication.applied_at || 
                        selectedApplication.applied_date || 
                        selectedApplication.created_at
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              {selectedApplication.skills && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.skills.split(',').map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 rounded-full text-sm font-semibold"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivation Section */}
              {selectedApplication.motivation && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Motivation
                  </h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedApplication.motivation}
                    </p>
                  </div>
                </div>
              )}

              {/* Experience Section */}
              {(selectedApplication as any).experience && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Experience
                  </h4>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {(selectedApplication as any).experience}
                    </p>
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {(selectedApplication as any).portfolio_url && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    Portfolio
                  </h4>
                  <a
                    href={(selectedApplication as any).portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    View Portfolio
                  </a>
                </div>
              )}

              {/* Project Description */}
              {(selectedApplication as any).project_description && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Project Description
                  </h4>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-5">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {(selectedApplication as any).project_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Review Information */}
              {((selectedApplication as any).reviewed_at || (selectedApplication as any).review_notes || (selectedApplication as any).reviewer_notes) && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    Review Information
                  </h4>
                  <div className="space-y-3">
                    {(selectedApplication as any).reviewed_at && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Reviewed On:</span>
                        <p className="text-gray-900 font-semibold">
                          {new Date((selectedApplication as any).reviewed_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {((selectedApplication as any).review_notes || (selectedApplication as any).reviewer_notes) && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Notes:</span>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {(selectedApplication as any).review_notes || (selectedApplication as any).reviewer_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200">
                {selectedApplication.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'approved');
                        setShowModal(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 text-base font-semibold"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'denied');
                        setShowModal(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-3 text-base font-semibold"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Deny Application
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    sendStatusEmail(selectedApplication, selectedApplication.status);
                    setShowModal(false);
                  }}
                  className="flex-1 sm:flex-none border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-3 text-base font-semibold"
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

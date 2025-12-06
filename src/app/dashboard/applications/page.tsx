'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { api, ProjectApplication } from '@/lib/api';
import { Search, Eye, Check, X, Mail } from 'lucide-react';

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
      const { data, error } = await api.getProjectApplications({
        page: currentPage,
        search: searchTerm || undefined,
      });

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      if (data) {
        setApplications(data.results);
        setTotalCount(data.count);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
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
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'denied':
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'waitlist':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / 20); // Assuming 20 items per page

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Applications</h1>
          <p className="mt-2 text-gray-600">Review and manage project applications</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Applications ({totalCount})</CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="waitlist">Waitlist</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const applicantName = application.applicant_name || application.full_name || 'N/A';
                    const applicantEmail = application.applicant_email || application.email || 'N/A';
                    const appliedDate = application.applied_at || application.applied_date || application.created_at;

                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{applicantName}</div>
                            <div className="text-sm text-gray-500">{applicantEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {application.project_title || `Project #${application.project_id || application.project || 'N/A'}`}
                        </TableCell>
                        <TableCell>
                          <span className={getStatusBadge(application.status)}>
                            {application.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(appliedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => updateApplicationStatus(application.id, 'approved')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => updateApplicationStatus(application.id, 'denied')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendStatusEmail(application, application.status)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No applications found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                  <span className={getStatusBadge(selectedApplication.status)}>
                    {selectedApplication.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Applicant Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.applicant_name || selectedApplication.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.applicant_email || selectedApplication.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.project_id || selectedApplication.project || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skills</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.skills || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Applied Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedApplication.applied_at || selectedApplication.applied_date || selectedApplication.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Motivation</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.motivation || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.project_title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Description</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedApplication.project_description || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.status || 'N/A'}</p>
                  </div>
                  {selectedApplication.reviewed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reviewed On</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedApplication.reviewed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(selectedApplication.review_notes || selectedApplication.reviewer_notes) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedApplication.review_notes || selectedApplication.reviewer_notes}
                      </p>
                    </div>
                  )}
                  {selectedApplication.application_data && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Additional Data</label>
                      <pre className="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(selectedApplication.application_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                {selectedApplication.status === 'pending' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'denied');
                        setShowModal(false);
                      }}
                    >
                      Deny
                    </Button>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'approved');
                        setShowModal(false);
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => sendStatusEmail(selectedApplication, selectedApplication.status)}
                >
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

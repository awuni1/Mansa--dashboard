'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { supabase, FormSubmission, transformMemberData, transformApplicationData } from '@/lib/supabase';
import { Search, Eye, Mail, FileText } from 'lucide-react';

export default function FormsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadFormSubmissions();
  }, []);

  useEffect(() => {
    let filtered = submissions.filter(submission => {
      const searchLower = searchTerm.toLowerCase();
      return (
        submission.name?.toLowerCase().includes(searchLower) ||
        submission.email?.toLowerCase().includes(searchLower) ||
        JSON.stringify(submission.form_data).toLowerCase().includes(searchLower)
      );
    });

    if (typeFilter !== 'all') {
      filtered = filtered.filter(submission => submission.form_type === typeFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, typeFilter]);

  const loadFormSubmissions = async () => {
    try {
      // Get real-time data from members and project_applications tables
      const [membersResult, applicationsResult] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: false }),
        supabase.from('project_applications').select('*').order('created_at', { ascending: false }),
      ]);

      const realTimeSubmissions: FormSubmission[] = [];

      // Transform and convert members to form submissions
      if (membersResult.data) {
        const transformedMembers = membersResult.data.map(member => transformMemberData(member));
        transformedMembers.forEach(member => {
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

      // Transform and convert project applications to form submissions
      if (applicationsResult.data) {
        const transformedApplications = await Promise.all(
          applicationsResult.data.map(app => transformApplicationData(app))
        );
        transformedApplications.forEach(application => {
          realTimeSubmissions.push({
            id: `application_${application.id}`,
            form_type: 'project',
            form_data: application,
            email: application.email || application.applicant_email,
            name: application.full_name || application.applicant_name,
            created_at: application.created_at,
          });
        });
      }

      // Sort by creation date (most recent first)
      const sortedSubmissions = realTimeSubmissions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setSubmissions(sortedSubmissions);
    } catch (error) {
      console.error('Error loading form submissions:', error);
    } finally {
      setLoading(false);
    }
  };

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
        // Fallback to mailto
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(`mailto:${submission.email}?subject=${encodedSubject}&body=${encodedBody}&from=mansatomansa@gmail.com`);
      } else {
        alert('Email sent successfully from mansatomansa@gmail.com');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback to mailto
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      window.open(`mailto:${submission.email}?subject=${encodedSubject}&body=${encodedBody}&from=mansatomansa@gmail.com`);
    }
  };

  const getFormTypeBadge = (type: string) => {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    switch (type) {
      case 'contact':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'membership':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'project':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
          <p className="mt-2 text-gray-600">View and manage all form submissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Submissions ({filteredSubmissions.length})</CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="contact">Contact</option>
                <option value="membership">Membership</option>
                <option value="project">Project</option>
                <option value="other">Other</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.name || 'Anonymous'}
                    </TableCell>
                    <TableCell>{submission.email || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={getFormTypeBadge(submission.form_type)}>
                        {submission.form_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(submission.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {submission.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendEmail(submission)}
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
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No form submissions match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Form Submission Details</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={getFormTypeBadge(selectedSubmission.form_type)}>
                      {selectedSubmission.form_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
                    </span>
                  </div>
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
                {renderFormData(selectedSubmission.form_data)}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                {selectedSubmission.email && (
                  <Button onClick={() => sendEmail(selectedSubmission)}>
                    Send Email
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
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Award,
  CheckCircle,
  Settings,
  Upload,
  Trash2,
  X,
  User,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
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
  profile_picture?: string;
}

interface SettingsModal {
  mentee: Mentee;
  photoPreview: string | null;
  photoFile: File | null;
  uploading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
}

export default function MenteesManagementPage() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [modal, setModal] = useState<SettingsModal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchMentees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentees/?page=${page}&page_size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch mentees');
      const data = await response.json();
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

  const openSettings = (mentee: Mentee) => {
    setModal({
      mentee,
      photoPreview: mentee.profile_picture || null,
      photoFile: null,
      uploading: false,
      message: null,
    });
  };

  const closeModal = () => setModal(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modal) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({ ...modal, message: { type: 'error', text: 'File too large. Maximum 5MB allowed.' } });
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
      setModal({ ...modal, message: { type: 'error', text: 'Invalid file type. Only JPEG, PNG, WebP, GIF, HEIC allowed.' } });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setModal(prev => prev ? { ...prev, photoFile: file, photoPreview: reader.result as string, message: null } : prev);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!modal?.photoFile) return;
    setModal(prev => prev ? { ...prev, uploading: true, message: null } : prev);

    try {
      const formData = new FormData();
      formData.append('photo', modal.photoFile);

      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentees/${modal.mentee.id}/upload_photo/`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      const photoUrl = data.photo_url;

      // Update local mentees list
      setMentees(prev => prev.map(m => m.id === modal.mentee.id ? { ...m, profile_picture: photoUrl } : m));
      setModal(prev => prev ? {
        ...prev,
        uploading: false,
        photoFile: null,
        photoPreview: photoUrl,
        mentee: { ...prev.mentee, profile_picture: photoUrl },
        message: { type: 'success', text: 'Profile photo updated successfully!' },
      } : prev);
    } catch (error: any) {
      setModal(prev => prev ? { ...prev, uploading: false, message: { type: 'error', text: error.message || 'Upload failed' } } : prev);
    }
  };

  const handleDeletePhoto = async () => {
    if (!modal || !modal.mentee.profile_picture) return;
    if (!confirm('Are you sure you want to delete this profile photo?')) return;

    setModal(prev => prev ? { ...prev, uploading: true, message: null } : prev);

    try {
      const response = await fetch(
        `${apiUrl}/v1/mentorship/mentees/${modal.mentee.id}/delete_photo/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Delete failed');
      }

      setMentees(prev => prev.map(m => m.id === modal.mentee.id ? { ...m, profile_picture: undefined } : m));
      setModal(prev => prev ? {
        ...prev,
        uploading: false,
        photoFile: null,
        photoPreview: null,
        mentee: { ...prev.mentee, profile_picture: undefined },
        message: { type: 'success', text: 'Profile photo deleted.' },
      } : prev);
    } catch (error: any) {
      setModal(prev => prev ? { ...prev, uploading: false, message: { type: 'error', text: error.message || 'Delete failed' } } : prev);
    }
  };

  const cancelPhotoSelection = () => {
    if (!modal) return;
    setModal({ ...modal, photoFile: null, photoPreview: modal.mentee.profile_picture || null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMentees = mentees.filter(mentee => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return mentee.name.toLowerCase().includes(query) || mentee.email.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && mentees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-[13px] text-gray-500">Loading mentees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">System Status: Optimal</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Mentee Management</h1>
        </div>
        <Link
          href="/dashboard/mentorship"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Total Mentees</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{totalCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">All registered</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Also Mentors</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{mentees.filter(m => m.is_mentor).length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Dual role</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Active This Month</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{mentees.filter(m => m.total_bookings > 0).length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">With bookings</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">With Profile Photo</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{mentees.filter(m => m.profile_picture).length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Has photo</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full pl-9"
            />
          </div>
          <button
            type="button"
            onClick={fetchMentees}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">All Mentees ({filteredMentees.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Mentee</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Email</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Sessions</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Last Activity</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMentees.map((mentee) => (
                <tr key={mentee.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    <div className="flex items-center gap-3">
                      {/* Avatar — shows profile picture if available */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {mentee.profile_picture ? (
                          <Image
                            src={mentee.profile_picture}
                            alt={mentee.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-700 font-bold text-[13px]">
                            {mentee.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mentee.name}</p>
                        <p className="text-[11px] text-gray-500">ID: {mentee.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {mentee.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    <p className="font-medium text-gray-900">{mentee.total_bookings} total</p>
                    <p className="text-[11px] text-green-600">{mentee.completed_sessions} completed</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    {mentee.is_mentor ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                        Also Mentor
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                        Mentee Only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    {mentee.last_booking
                      ? new Date(mentee.last_booking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No recent activity'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    <button
                      type="button"
                      onClick={() => openSettings(mentee)}
                      title="Manage profile"
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[12px] text-gray-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} mentees
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[12px] text-gray-500">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

      {/* Settings Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Mentee Settings
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Alert Message */}
              {modal.message && (
                <div className={`flex items-start gap-3 p-3 rounded-lg text-[13px] ${
                  modal.message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{modal.message.text}</span>
                  <button
                    type="button"
                    onClick={() => setModal(prev => prev ? { ...prev, message: null } : prev)}
                    className="ml-auto flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mentee Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {modal.photoPreview ? (
                    <img src={modal.photoPreview} alt={modal.mentee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-700 font-bold text-[13px]">{modal.mentee.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[13px]">{modal.mentee.name}</p>
                  <p className="text-[11px] text-gray-500">{modal.mentee.email}</p>
                </div>
              </div>

              {/* Profile Photo Section */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Profile Photo
                </h3>

                {/* Photo Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                    {modal.photoPreview ? (
                      <img src={modal.photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-gray-500">Max 5MB · JPEG, PNG, WebP, GIF, HEIC</p>
                    <label
                      htmlFor="mentee-photo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose Photo
                    </label>
                    <input
                      id="mentee-photo-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Upload / Cancel buttons — shown when a new file is selected */}
                {modal.photoFile && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={modal.uploading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {modal.uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelPhotoSelection}
                      disabled={modal.uploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Delete button — only when mentee has a photo and no new file selected */}
                {modal.mentee.profile_picture && !modal.photoFile && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={modal.uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {modal.uploading ? 'Deleting...' : 'Remove Photo'}
                  </button>
                )}
              </div>

              {/* Session Stats */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-[12px] font-semibold text-gray-600 mb-3">Session Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{modal.mentee.total_bookings}</p>
                    <p className="text-[11px] text-blue-600">Total Bookings</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{modal.mentee.completed_sessions}</p>
                    <p className="text-[11px] text-green-600">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 flex justify-end gap-2 rounded-b-xl">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

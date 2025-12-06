'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, Project } from '@/lib/api';
import { FolderOpen, Plus, Eye, Check, X, Edit, Trash2, Clock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Users } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Partial<Project>) => void;
  project?: Project | null;
  loading: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, project, loading }) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    detailed_description: '',
    max_participants: 100,
    admission_start_date: '',
    admission_end_date: '',
    status: 'draft'
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        detailed_description: project.detailed_description || '',
        max_participants: project.max_participants || 100,
        admission_start_date: project.admission_start_date ? project.admission_start_date.split('T')[0] : '',
        admission_end_date: project.admission_end_date ? project.admission_end_date.split('T')[0] : '',
        status: project.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        detailed_description: '',
        max_participants: 100,
        admission_start_date: '',
        admission_end_date: '',
        status: 'draft'
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Project title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brief project description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detailed Description
              </label>
              <textarea
                rows={5}
                value={formData.detailed_description}
                onChange={(e) => setFormData(prev => ({ ...prev, detailed_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Detailed project description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admission Start Date
                </label>
                <input
                  type="date"
                  value={formData.admission_start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, admission_start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admission End Date
                </label>
                <input
                  type="date"
                  value={formData.admission_end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, admission_end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Saving...' : (project ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface Application {
  id: string;
  project_id: number;
  applicant_name: string;
  applicant_email: string;
  skills?: string;
  motivation?: string;
  status: string;
  applied_date: string;
  reviewed_date?: string;
  reviewer_notes?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applicationsModalOpen, setApplicationsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationCounts, setApplicationCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    loadProjects();
    loadApplicationCounts();
  }, []);

  const loadProjects = async () => {
    try {
      // Load from Supabase platform projects (existing data)
      const { data, error } = await api.getPlatformProjects({ search: searchTerm });
      if (error) {
        console.error('Error loading projects:', error);
      } else {
        setProjects(data?.results || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationCounts = async () => {
    try {
      const { data, error } = await api.getPlatformApplications({});
      if (!error && data?.results) {
        // Count applications per project
        const counts: Record<number, number> = {};
        data.results.forEach((app: any) => {
          const projectId = app.project_id;
          counts[projectId] = (counts[projectId] || 0) + 1;
        });
        setApplicationCounts(counts);
      }
    } catch (error) {
      console.error('Error loading application counts:', error);
    }
  };

  const loadApplicationsForProject = async (projectId: number) => {
    setApplicationsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/?project_id=${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApplications(data.results || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleViewApplications = (projectId: number) => {
    setSelectedProjectId(projectId);
    setApplicationsModalOpen(true);
    loadApplicationsForProject(projectId);
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${applicationId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ status: 'approved' })
        }
      );

      if (response.ok) {
        alert('Application approved successfully!');
        if (selectedProjectId) {
          loadApplicationsForProject(selectedProjectId);
        }
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${applicationId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ status: 'rejected' })
        }
      );

      if (response.ok) {
        alert('Application rejected successfully!');
        if (selectedProjectId) {
          loadApplicationsForProject(selectedProjectId);
        }
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    setActionLoading(-1);
    try {
      const { data, error } = await api.createProject({
        ...projectData,
        admission_start_date: projectData.admission_start_date ? `${projectData.admission_start_date}T00:00:00Z` : undefined,
        admission_end_date: projectData.admission_end_date ? `${projectData.admission_end_date}T23:59:59Z` : undefined,
      });

      if (!error && data) {
        setModalOpen(false);
        setEditingProject(null);
        loadProjects();
        alert('Project created successfully!');
      } else {
        console.error('Failed to create project:', error);
        alert(`Failed to create project: ${error}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!editingProject) return;

    setActionLoading(editingProject.id);
    try {
      // Update via platform endpoint (Supabase)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${editingProject.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingProject(null);
        loadProjects();
        alert('Project updated successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to update project:', error);
        alert(`Failed to update project: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveProject = async (projectId: number) => {
    setActionLoading(projectId);
    try {
      const { error } = await api.approveProject(projectId);
      if (!error) {
        loadProjects();
      } else {
        console.error('Error approving project:', error);
      }
    } catch (error) {
      console.error('Error approving project:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyProject = async (projectId: number) => {
    setActionLoading(projectId);
    try {
      const { error } = await api.denyProject(projectId);
      if (!error) {
        loadProjects();
      } else {
        console.error('Error denying project:', error);
      }
    } catch (error) {
      console.error('Error denying project:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setActionLoading(projectId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${projectId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        loadProjects();
        alert('Project deleted successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to delete project:', error);
        alert(`Failed to delete project: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToActive = async (projectId: number) => {
    if (!confirm('Move this project from Future to Ongoing?')) return;

    setActionLoading(projectId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: 'Active' })
      });

      if (response.ok) {
        loadProjects();
        alert('Project moved to Ongoing successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to update project:', error);
        alert(`Failed to update project: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToDraft = async (projectId: number) => {
    if (!confirm('Move this project back to Future/Draft?')) return;

    setActionLoading(projectId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: 'Concept' })
      });

      if (response.ok) {
        loadProjects();
        alert('Project moved to Future/Draft successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to update project:', error);
        alert(`Failed to update project: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToClosed = async (projectId: number) => {
    if (!confirm('Mark this project as Closed/Completed?')) return;

    setActionLoading(projectId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: 'Completed' })
      });

      if (response.ok) {
        loadProjects();
        alert('Project marked as Completed successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to update project:', error);
        alert(`Failed to update project: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;

    // Map Supabase statuses to our filter categories
    const status = (project.status || '').toLowerCase();
    if (statusFilter === 'draft') {
      // "Future Projects" - Concept or Planning stages
      return status === 'concept' || status === 'planning' || status === 'draft';
    }
    if (statusFilter === 'active') {
      // "Ongoing Projects" - Active projects
      return status === 'active';
    }
    if (statusFilter === 'closed') {
      // "Completed Projects" - Closed, Completed, or Archived
      return status === 'closed' || status === 'completed' || status === 'archived';
    }
    return false;
  });

  const getStatusBadge = (status: string, approval_status?: string) => {
    if (approval_status === 'pending') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Approval</span>;
    }
    if (approval_status === 'denied') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Denied</span>;
    }

    // Handle both Django and Supabase statuses
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'draft':
      case 'concept':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Concept</span>;
      case 'planning':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Planning</span>;
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'closed':
      case 'completed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Completed</span>;
      case 'archived':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Archived</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Count projects by category
  const futureProjectsCount = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status === 'concept' || status === 'planning' || status === 'draft';
  }).length;

  const ongoingProjectsCount = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status === 'active';
  }).length;

  const completedProjectsCount = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status === 'closed' || status === 'completed' || status === 'archived';
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-md sm:shadow-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Project Management</h1>
            </div>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Manage and oversee all your projects</p>
          </div>
          <Button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Card className="overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-gray-200 dark:divide-gray-700">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 sm:p-4 text-center transition-all duration-200 ${
              statusFilter === 'all'
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${
              statusFilter === 'all' ? 'text-blue-600' : 'text-gray-900 dark:text-white'
            }`}>
              {projects.length}
            </div>
            <div className={`text-xs sm:text-sm font-medium mt-1 ${
              statusFilter === 'all' ? 'text-blue-700' : 'text-gray-500 dark:text-gray-400'
            }`}>
              All Projects
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`p-3 sm:p-4 text-center transition-all duration-200 ${
              statusFilter === 'draft'
                ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${
              statusFilter === 'draft' ? 'text-gray-600' : 'text-gray-900 dark:text-white'
            }`}>
              {futureProjectsCount}
            </div>
            <div className={`text-xs sm:text-sm font-medium mt-1 ${
              statusFilter === 'draft' ? 'text-gray-700' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Future
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`p-3 sm:p-4 text-center transition-all duration-200 ${
              statusFilter === 'active'
                ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${
              statusFilter === 'active' ? 'text-green-600' : 'text-gray-900 dark:text-white'
            }`}>
              {ongoingProjectsCount}
            </div>
            <div className={`text-xs sm:text-sm font-medium mt-1 ${
              statusFilter === 'active' ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Ongoing
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`p-3 sm:p-4 text-center transition-all duration-200 ${
              statusFilter === 'closed'
                ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${
              statusFilter === 'closed' ? 'text-purple-600' : 'text-gray-900 dark:text-white'
            }`}>
              {completedProjectsCount}
            </div>
            <div className={`text-xs sm:text-sm font-medium mt-1 ${
              statusFilter === 'closed' ? 'text-purple-700' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Completed
            </div>
          </button>
        </div>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {statusFilter === 'all' && 'All Projects'}
                {statusFilter === 'draft' && 'Future Projects'}
                {statusFilter === 'active' && 'Ongoing Projects'}
                {statusFilter === 'closed' && 'Completed Projects'}
              </span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 sm:w-64 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Button
                onClick={loadProjects}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {(project as any).image_url && (
                            <img
                              src={(project as any).image_url}
                              alt={project.title}
                              className="h-12 w-12 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {project.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(project.status || 'draft', project.approval_status || 'pending')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApplications(project.id)}
                          className="flex items-center space-x-2"
                        >
                          <Users className="h-4 w-4" />
                          <span>{applicationCounts[project.id] || 0} Applications</span>
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(project as any).location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProject(project);
                              setModalOpen(true);
                            }}
                            disabled={actionLoading === project.id}
                            title="Edit Project"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          {/* Status transition buttons */}
                          {project.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleMoveToActive(project.id)}
                              disabled={actionLoading === project.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              title="Move to Ongoing"
                            >
                              {actionLoading === project.id ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <><ArrowRight className="h-3 w-3" /> Ongoing</>
                              )}
                            </Button>
                          )}

                          {project.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMoveToClosed(project.id)}
                                disabled={actionLoading === project.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                title="Mark as Completed"
                              >
                                {actionLoading === project.id ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  <><CheckCircle className="h-3 w-3" /> Complete</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleMoveToDraft(project.id)}
                                disabled={actionLoading === project.id}
                                variant="outline"
                                title="Move back to Future"
                              >
                                {actionLoading === project.id ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowLeft className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}

                          {project.status === 'closed' && (
                            <Button
                              size="sm"
                              onClick={() => handleMoveToActive(project.id)}
                              disabled={actionLoading === project.id}
                              variant="outline"
                              title="Reactivate Project"
                            >
                              {actionLoading === project.id ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <><ArrowLeft className="h-3 w-3" /> Reactivate</>
                              )}
                            </Button>
                          )}

                          {/* Approval buttons for pending projects */}
                          {project.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveProject(project.id)}
                                disabled={actionLoading === project.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                title="Approve Project"
                              >
                                {actionLoading === project.id ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDenyProject(project.id)}
                                disabled={actionLoading === project.id}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                title="Deny Project"
                              >
                                {actionLoading === project.id ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={actionLoading === project.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Project"
                          >
                            {actionLoading === project.id ? (
                              <Clock className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mx-auto mb-4">
                <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
              <p className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold mb-2">No projects found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Create your first project to get started</p>
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setModalOpen(true);
                }}
                className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        loading={actionLoading === -1 || (editingProject && actionLoading === editingProject.id)}
      />

      {/* Applications Modal */}
      {applicationsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Project Applications ({applications.length})</span>
                </h2>
                <button
                  onClick={() => {
                    setApplicationsModalOpen(false);
                    setSelectedProjectId(null);
                    setApplications([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {applicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {application.applicant_name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              application.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : application.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Email:</strong> {application.applicant_email}
                          </p>
                          {application.skills && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Skills:</strong> {application.skills}
                            </p>
                          )}
                          {application.motivation && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Motivation:</strong>
                              <p className="mt-1 whitespace-pre-wrap">{application.motivation}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Applied: {new Date(application.applied_date).toLocaleDateString()}
                          </p>
                        </div>

                        {application.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveApplication(application.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectApplication(application.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
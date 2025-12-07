'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, Project } from '@/lib/api';
import { FolderOpen, Plus, Eye, Edit, Trash2, Users, Search, Filter, TrendingUp, CheckCircle, Clock, XCircle, ArrowRight, Calendar, MapPin, X } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await api.getPlatformProjects({ search: searchTerm });
      if (!error && data) {
        setProjects(data.results || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    const status = (project.status || '').toLowerCase();
    if (statusFilter === 'concept') return status === 'concept' || status === 'draft' || status === 'planning';
    if (statusFilter === 'active') return status === 'active';
    if (statusFilter === 'completed') return status === 'completed' || status === 'closed' || status === 'archived';
    return false;
  });

  const conceptCount = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status === 'concept' || status === 'draft' || status === 'planning';
  }).length;

  const activeCount = projects.filter(p => (p.status || '').toLowerCase() === 'active').length;
  const completedCount = projects.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status === 'completed' || status === 'closed' || status === 'archived';
  }).length;

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      );
    }
    if (statusLower === 'completed' || statusLower === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-300">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (statusLower === 'concept' || statusLower === 'draft' || statusLower === 'planning') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300">
          <Clock className="h-3 w-3" />
          Planning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-gray-100 text-gray-800 border-2 border-gray-300">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-purple-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-purple-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <FolderOpen className="h-10 w-10" />
              Project Management
            </h1>
            <p className="text-purple-100 text-lg">Manage and track all platform projects</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
              <div className="text-white/90 text-sm font-medium">Total Projects</div>
              <div className="text-3xl font-bold text-white flex items-center gap-2">
                {projects.length}
                <TrendingUp className="h-6 w-6 text-green-300" />
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setStatusFilter('concept')} className="cursor-pointer">
          <Card className="border-2 border-yellow-100 hover:shadow-2xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planning Phase</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{conceptCount}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => setStatusFilter('active')} className="cursor-pointer">
          <Card className="border-2 border-green-100 hover:shadow-2xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => setStatusFilter('completed')} className="cursor-pointer">
          <Card className="border-2 border-blue-100 hover:shadow-2xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{completedCount}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-purple-500 rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white shadow-sm hover:shadow-md transition-all"
                    aria-label="Filter by project status"
                    title="Select project status"
                  >
                    <option value="all">All Status</option>
                    <option value="concept">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
              
              <Button variant="outline" onClick={loadProjects}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <Card 
              key={project.id} 
              className="border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 overflow-hidden group animate-slideInFromRight"
            >
              {/* Project Image/Banner */}
              <div className="relative h-48 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FolderOpen className="h-16 w-16 text-white/30" />
                </div>
                <div className="absolute top-4 right-4">
                  {getStatusBadge(project.status || 'draft')}
                </div>
                {(project as any).max_participants && (
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-bold text-gray-900">
                        {(project as any).max_participants} participants
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {(project as any).location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>{(project as any).location}</span>
                    </div>
                  )}
                  {(project as any).admission_start_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>Opens: {new Date((project as any).admission_start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t-2 border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:scale-105 transition-transform"
                    onClick={() => {
                      setSelectedProject(project);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:scale-105 transition-transform"
                    onClick={() => {
                      window.location.href = `/dashboard/projects/${project.id}/edit`;
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/dashboard/applications?project=${project.id}`;
                    }}
                    className="hover:scale-105 transition-transform"
                    title="View Applications"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-gray-100">
          <CardContent className="p-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
                <FolderOpen className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {statusFilter !== 'all' 
                  ? `No projects in the selected status. Try changing your filters.`
                  : 'Get started by creating your first project.'}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Project Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <FolderOpen className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Project Details</h2>
                  <p className="text-indigo-100 text-sm mt-1">Complete project information</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Modal"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h3>
                    <p className="text-purple-600 font-medium mt-1">Project ID: {selectedProject.id}</p>
                  </div>
                  {getStatusBadge(selectedProject.status || 'draft')}
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedProject.description}</p>
              </div>

              {(selectedProject as any).location && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Location:</span>
                  <span>{(selectedProject as any).location}</span>
                </div>
              )}

              {(selectedProject as any).admission_start_date && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Admission Opens:</span>
                  <span>{new Date((selectedProject as any).admission_start_date).toLocaleDateString()}</span>
                </div>
              )}

              {(selectedProject as any).max_participants && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Max Participants:</span>
                  <span>{(selectedProject as any).max_participants}</span>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
                <Button
                  variant="primary"
                  onClick={() => {
                    window.location.href = `/dashboard/projects/${selectedProject.id}/edit`;
                  }}
                  className="flex-1"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/dashboard/applications?project=${selectedProject.id}`;
                  }}
                  className="flex-1"
                >
                  <Users className="h-5 w-5 mr-2" />
                  View Applications
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <Plus className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Create New Project</h2>
                  <p className="text-indigo-100 text-sm mt-1">Add a new project to the platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Modal"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Project creation is managed through the Django admin panel. Click the button below to access the admin interface.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    window.open('https://mansa-backend-1rr8.onrender.com/admin/', '_blank');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Open Admin Panel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

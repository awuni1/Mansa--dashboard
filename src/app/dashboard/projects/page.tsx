'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api, Project } from '@/lib/api';
import Image from 'next/image';
import {
  FolderOpen, Plus, Check, X, Edit, Trash2, Clock,
  CheckCircle, Users, SlidersHorizontal, ArrowUpDown,
  ArrowRight, ArrowLeft,
} from 'lucide-react';

/* ─── Project Modal (unchanged) ─────────────────────────────────────────── */
interface ProjectModalProps {
  isOpen: boolean; onClose: () => void;
  onSubmit: (project: Partial<Project>) => void;
  project?: Project | null; loading: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, project, loading }) => {
  const [formData, setFormData] = useState<Partial<Project> & { project_type?: string }>({
    title: '', description: '', detailed_description: '',
    max_participants: 100, admission_start_date: '', admission_end_date: '',
    status: 'draft', project_type: 'future',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '', description: project.description || '',
        detailed_description: project.detailed_description || '',
        max_participants: project.max_participants || 100,
        admission_start_date: project.admission_start_date ? project.admission_start_date.split('T')[0] : '',
        admission_end_date: project.admission_end_date ? project.admission_end_date.split('T')[0] : '',
        status: project.status || 'draft',
        project_type: (project as any).project_type || 'future',
      });
    } else {
      setFormData({ title: '', description: '', detailed_description: '', max_participants: 100, admission_start_date: '', admission_end_date: '', status: 'draft', project_type: 'future' });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            {project ? <><Edit className="h-5 w-5 text-gray-500" /> Edit Project</> : <><Plus className="h-5 w-5 text-gray-500" /> Create New Project</>}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form id="project-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="h-8 w-1 bg-blue-600 rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div>
              <label htmlFor="project-title-input" className="text-[12px] font-semibold text-gray-600 mb-1 block">Project Title <span className="text-red-500">*</span></label>
              <input id="project-title-input" type="text" required value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none"
                placeholder="e.g., AI Healthcare Platform for Rural Africa" />
            </div>
            <div>
              <label htmlFor="project-description-textarea" className="text-[12px] font-semibold text-gray-600 mb-1 block">Short Description <span className="text-red-500">*</span></label>
              <textarea id="project-description-textarea" required rows={3} value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none resize-none"
                placeholder="Brief overview (2-3 sentences)" />
            </div>
            <div>
              <label htmlFor="project-detailed-description-textarea" className="text-[12px] font-semibold text-gray-600 mb-1 block">Detailed Description</label>
              <textarea id="project-detailed-description-textarea" rows={6} value={formData.detailed_description} onChange={(e) => setFormData(p => ({ ...p, detailed_description: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none resize-none"
                placeholder="Comprehensive project details..." />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="h-8 w-1 bg-blue-600 rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-type-select" className="text-[12px] font-semibold text-gray-600 mb-1 block">Project Type <span className="text-red-500">*</span></label>
                <select id="project-type-select" value={formData.project_type} onChange={(e) => setFormData(p => ({ ...p, project_type: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none cursor-pointer">
                  <option value="future">Future (Coming Soon)</option>
                  <option value="ongoing">Ongoing (Active Now)</option>
                </select>
              </div>
              <div>
                <label htmlFor="project-status-select" className="text-[12px] font-semibold text-gray-600 mb-1 block">Project Status</label>
                <select id="project-status-select" value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none cursor-pointer">
                  <option value="draft">Draft</option>
                  <option value="concept">Concept</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="project-max-participants-input" className="text-[12px] font-semibold text-gray-600 mb-1 block">Max Participants</label>
                <input id="project-max-participants-input" type="number" min="1" value={formData.max_participants} onChange={(e) => setFormData(p => ({ ...p, max_participants: parseInt(e.target.value) || 0 }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="h-8 w-1 bg-green-600 rounded-full" />
              <h3 className="text-lg font-semibold text-gray-900">Application Timeline</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-admission-start-date" className="text-[12px] font-semibold text-gray-600 mb-1 block">Applications Open</label>
                <input id="project-admission-start-date" type="date" value={formData.admission_start_date} onChange={(e) => setFormData(p => ({ ...p, admission_start_date: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none" />
              </div>
              <div>
                <label htmlFor="project-admission-end-date" className="text-[12px] font-semibold text-gray-600 mb-1 block">Applications Close</label>
                <input id="project-admission-end-date" type="date" value={formData.admission_end_date} onChange={(e) => setFormData(p => ({ ...p, admission_end_date: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full focus:outline-none" />
              </div>
            </div>
          </div>
        </form>
        <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border border-gray-200 bg-white text-gray-700 text-[13px] px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</Button>
          <Button type="submit" form="project-form" disabled={loading}
            onClick={(e) => { e.preventDefault(); const f = document.getElementById('project-form') as HTMLFormElement; f?.requestSubmit(); }}
            className="bg-blue-600 text-white px-3 py-1.5 text-[13px] rounded-lg hover:bg-blue-700">
            {loading ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : project ? <><CheckCircle className="h-4 w-4 mr-2" /> Update Project</> : <><Plus className="h-4 w-4 mr-2" /> Create Project</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Application type ───────────────────────────────────────────────────── */
interface Application {
  id: string; project_id: number; applicant_name: string;
  applicant_email: string; skills?: string; motivation?: string;
  status: string; applied_date: string; reviewed_date?: string; reviewer_notes?: string;
}

/* ─── Status badge helper ────────────────────────────────────────────────── */
function StatusBadge({ status, approval_status }: { status: string; approval_status?: string }) {
  if (approval_status === 'pending') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Pending</span>;
  if (approval_status === 'denied') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">Denied</span>;
  const s = (status || '').toLowerCase();
  if (s === 'active') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">ACTIVE</span>;
  if (s === 'concept' || s === 'draft') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">DRAFT</span>;
  if (s === 'planning') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">PLANNING</span>;
  if (s === 'closed' || s === 'completed') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">COMPLETED</span>;
  if (s === 'archived') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">ARCHIVED</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [applicationsModalOpen, setApplicationsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationCounts, setApplicationCounts] = useState<Record<number, number>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  useEffect(() => { loadProjects(); loadApplicationCounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProjects = async () => {
    try {
      const { data, error } = await api.getPlatformProjects({});
      if (!error) setProjects(data?.results || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadApplicationCounts = async () => {
    try {
      const { data } = await api.getPlatformProjects({});
      const counts: Record<number, number> = {};
      (data?.results || []).forEach((p: Project) => { counts[p.id] = (p as any).participants_count ?? 0; });
      setApplicationCounts(counts);
    } catch { /* ignore */ }
  };

  const loadApplicationsForProject = async (projectId: number) => {
    setApplicationsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) { const d = await res.json(); setApplications(d.results || []); }
    } catch { /* ignore */ } finally { setApplicationsLoading(false); }
  };

  const handleViewApplications = (projectId: number) => {
    setSelectedProjectId(projectId);
    setApplicationsModalOpen(true);
    loadApplicationsForProject(projectId);
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${applicationId}/approve/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) { toast.success('Application approved!'); if (selectedProjectId) loadApplicationsForProject(selectedProjectId); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.detail || 'Failed to approve.'); }
    } catch { toast.error('Network error.'); }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${applicationId}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (selectedProjectId) loadApplicationsForProject(selectedProjectId);
    } catch { /* ignore */ }
  };

  const patchProject = async (id: number, body: object) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const handleCreateProject = async (projectData: Partial<Project> & { project_type?: string }) => {
    setActionLoading(-1);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ ...projectData, admission_start_date: projectData.admission_start_date ? `${projectData.admission_start_date}T00:00:00Z` : undefined, admission_end_date: projectData.admission_end_date ? `${projectData.admission_end_date}T23:59:59Z` : undefined }),
      });
      if (res.ok) { setModalOpen(false); setEditingProject(null); toast.success('Project created!'); loadProjects(); }
      else { const e = await res.json().catch(() => ({ detail: 'Unknown error' })); toast.error(e.detail || 'Failed to create.'); }
    } catch { toast.error('Error creating project.'); } finally { setActionLoading(null); }
  };

  const handleUpdateProject = async (projectData: Partial<Project> & { project_type?: string }) => {
    if (!editingProject) return;
    setActionLoading(editingProject.id);
    const ok = await patchProject(editingProject.id, projectData);
    if (ok) { setModalOpen(false); setEditingProject(null); toast.success('Project updated!'); loadProjects(); }
    else { toast.error('Failed to update.'); }
    setActionLoading(null);
  };

  const handleApproveProject = async (projectId: number) => {
    setActionLoading(projectId);
    const { error } = await api.approveProject(projectId);
    if (!error) loadProjects(); else toast.error('Failed to approve.');
    setActionLoading(null);
  };

  const handleDenyProject = async (projectId: number) => {
    setActionLoading(projectId);
    const { error } = await api.denyProject(projectId);
    if (!error) loadProjects(); else toast.error('Failed to deny.');
    setActionLoading(null);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Delete this project permanently?')) return;
    setActionLoading(projectId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/projects/${projectId}/`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
    });
    if (res.ok || res.status === 204) { toast.success('Project deleted.'); loadProjects(); }
    else { toast.error('Failed to delete.'); }
    setActionLoading(null);
  };

  const handleMoveToActive = async (projectId: number) => {
    setActionLoading(projectId);
    if (await patchProject(projectId, { status: 'active' })) { toast.success('Moved to Active.'); loadProjects(); }
    setActionLoading(null);
  };

  const handleMoveToDraft = async (projectId: number) => {
    setActionLoading(projectId);
    if (await patchProject(projectId, { status: 'concept' })) { toast.success('Moved to Draft.'); loadProjects(); }
    setActionLoading(null);
  };

  const handleMoveToClosed = async (projectId: number) => {
    setActionLoading(projectId);
    if (await patchProject(projectId, { status: 'completed' })) { toast.success('Marked as Completed.'); loadProjects(); }
    setActionLoading(null);
  };

  const activeProjects = projects.filter(p => (p.status || '').toLowerCase() === 'active');
  const draftProjects = projects.filter(p => ['concept', 'planning', 'draft'].includes((p.status || '').toLowerCase()));
  const archivedProjects = projects.filter(p => ['closed', 'completed', 'archived'].includes((p.status || '').toLowerCase()));

  const viewList = [...activeProjects, ...draftProjects]
    .filter(p => {
      if (filterStatus === 'all') return true;
      const s = (p.status || '').toLowerCase();
      if (filterStatus === 'active') return s === 'active';
      return ['concept', 'planning', 'draft'].includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'za') return (b.title || '').localeCompare(a.title || '');
      if (sortBy === 'oldest') return (a.id ?? 0) - (b.id ?? 0);
      return (b.id ?? 0) - (a.id ?? 0);
    });

  const [featuredProject, ...otherProjects] = viewList;
  const gridProjects = otherProjects.slice(1);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Project Terminal</h1>
          <p className="text-sm text-gray-500 mt-1">Pioneering high-density operations and creative architectural projects across the global network.</p>
        </div>
        <button type="button" onClick={() => { setEditingProject(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider rounded-lg transition-colors shadow-sm whitespace-nowrap">
          <Plus className="h-4 w-4" /> INITIALIZE NEW PROJECT
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ACTIVE DEPLOYMENTS', value: activeProjects.length, sub: 'currently live' },
          { label: 'ACTIVE RATE', value: projects.length > 0 ? `${Math.round(activeProjects.length / projects.length * 100)}%` : '0%', sub: 'of all projects' },
          { label: 'PENDING REVIEW', value: projects.filter(p => p.approval_status === 'pending').length, sub: 'awaiting approval' },
          { label: 'TOTAL PROJECTS', value: projects.length.toLocaleString(), sub: 'all time' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Active Operations header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Active Operations</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" title="Filter"
              onClick={() => { setShowFilterPanel(p => !p); setShowSortPanel(false); }}
              className={`p-2 rounded-lg border transition-colors ${showFilterPanel || filterStatus !== 'all' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-36 overflow-hidden">
                {(['all', 'active', 'draft'] as const).map(opt => (
                  <button key={opt} type="button"
                    onClick={() => { setFilterStatus(opt); setShowFilterPanel(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm capitalize ${filterStatus === opt ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {opt === 'all' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" title="Sort"
              onClick={() => { setShowSortPanel(p => !p); setShowFilterPanel(false); }}
              className={`p-2 rounded-lg border transition-colors ${showSortPanel || sortBy !== 'newest' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
              <ArrowUpDown className="h-4 w-4" />
            </button>
            {showSortPanel && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 overflow-hidden">
                {([
                  { key: 'newest', label: 'Newest first' },
                  { key: 'oldest', label: 'Oldest first' },
                  { key: 'az',     label: 'A → Z' },
                  { key: 'za',     label: 'Z → A' },
                ] as const).map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => { setSortBy(opt.key); setShowSortPanel(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${sortBy === opt.key ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Featured project + sidebar ── */}
      {projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 text-lg font-bold mb-2">No projects yet</p>
          <p className="text-gray-500 text-sm mb-6">Create your first project to get started</p>
          <button type="button" onClick={() => { setEditingProject(null); setModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Project
          </button>
        </div>
      ) : (
        <>
          {featuredProject && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Featured card */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-wider bg-blue-100 text-blue-700 px-2.5 py-1 rounded uppercase">
                    {(featuredProject as any).category || 'Neural Architecture'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                    {featuredProject.approval_status === 'pending' ? 'PENDING REVIEW' : 'CLASSIFIED'}
                  </span>
                  <StatusBadge status={featuredProject.status || ''} approval_status={featuredProject.approval_status} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project: {featuredProject.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-5 line-clamp-2">{featuredProject.description}</p>
                {/* Progress bar */}
                {featuredProject.max_participants ? (() => {
                  const pct = Math.min(100, Math.round(((featuredProject.current_participants || 0) / featuredProject.max_participants) * 100));
                  return (
                    <div className="mb-5">
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                        <span>Participants</span><span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })() : null}
                {/* Bottom row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold ${['bg-blue-500', 'bg-purple-500', 'bg-green-500'][i]}`}
                        style={{ marginLeft: i > 0 ? '-6px' : '0' }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    <span className="text-xs text-gray-500 ml-2">{applicationCounts[featuredProject.id] || 0} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleViewApplications(featuredProject.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      <Users className="h-3.5 w-3.5" /> Applications
                    </button>
                    <button type="button" onClick={() => { setEditingProject(featuredProject); setModalOpen(true); }}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                      ACCESS TERMINAL <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar: second project */}
              {otherProjects[0] ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
                  <StatusBadge status={otherProjects[0].status || ''} approval_status={otherProjects[0].approval_status} />
                  <h3 className="font-bold text-gray-900 text-sm mt-3 mb-2">{otherProjects[0].title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed flex-1">{otherProjects[0].description}</p>
                  {otherProjects[0].max_participants ? (() => {
                    const pct = Math.min(100, Math.round(((otherProjects[0].current_participants || 0) / otherProjects[0].max_participants) * 100));
                    return (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="h-1 bg-gray-100 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} /></div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Participants</span><span>{pct}%</span></div>
                      </div>
                    );
                  })() : null}
                  <button type="button" onClick={() => { setEditingProject(otherProjects[0]); setModalOpen(true); }}
                    className="mt-3 w-full py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                  <Plus className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Add another project</p>
                  <button type="button" onClick={() => { setEditingProject(null); setModalOpen(true); }}
                    className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Create
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Project cards grid ── */}
          {gridProjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridProjects.map((project) => (
                <div key={project.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image area */}
                  <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                    {(project as any).image_url ? (
                      <Image src={(project as any).image_url} alt={project.title} fill className="object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <FolderOpen className="h-10 w-10 text-gray-300" />
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={project.status || ''} approval_status={project.approval_status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{project.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <button type="button" onClick={() => handleViewApplications(project.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        <Users className="h-3.5 w-3.5" /> {applicationCounts[project.id] || 0}
                      </button>
                      <div className="flex items-center gap-1">
                        {project.status === 'draft' && (
                          <button type="button" onClick={() => handleMoveToActive(project.id)} disabled={actionLoading === project.id} title="Move to Active"
                            className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {project.status === 'active' && (
                          <>
                            <button type="button" onClick={() => handleMoveToClosed(project.id)} disabled={actionLoading === project.id} title="Mark Complete"
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleMoveToDraft(project.id)} disabled={actionLoading === project.id} title="Move to Draft"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {project.approval_status === 'pending' && (
                          <>
                            <button type="button" onClick={() => handleApproveProject(project.id)} disabled={actionLoading === project.id} title="Approve"
                              className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDenyProject(project.id)} disabled={actionLoading === project.id} title="Deny"
                              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => { setEditingProject(project); setModalOpen(true); }} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteProject(project.id)} disabled={actionLoading === project.id} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          {actionLoading === project.id ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Archived Systems table ── */}
          {archivedProjects.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Archived Systems</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['PROJECT NAME', 'DOMAIN', 'DURATION', 'RESULT', 'STATUS'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {archivedProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{project.title}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{(project as any).category || 'N/A'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {project.admission_start_date ? new Date(project.admission_start_date).getFullYear() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{(project as any).location || '—'}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={project.status || ''} approval_status={project.approval_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        loading={actionLoading === -1 || (!!editingProject && actionLoading === editingProject.id)}
      />

      {applicationsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" /> Project Applications ({applications.length})
              </h2>
              <button type="button" onClick={() => { setApplicationsModalOpen(false); setSelectedProjectId(null); setApplications([]); }}
                aria-label="Close" className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{app.applicant_name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong> {app.applicant_email}</p>
                          {app.skills && <p className="text-sm text-gray-600 mb-1"><strong>Skills:</strong> {app.skills}</p>}
                          {app.motivation && <p className="text-sm text-gray-600 mb-2"><strong>Motivation:</strong> {app.motivation}</p>}
                          <p className="text-xs text-gray-400">Applied: {new Date(app.applied_date).toLocaleDateString()}</p>
                        </div>
                        {app.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" onClick={() => handleApproveApplication(app.id)} className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" onClick={() => handleRejectApplication(app.id)} className="bg-red-600 hover:bg-red-700 text-white">
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import {
  Search, Download, Filter, ChevronRight, Mail, Users,
  Briefcase, AlertTriangle, Clock, FileText, X,
} from 'lucide-react';

interface FormSubmission {
  id: string;
  short_id: string;
  form_type: 'membership' | 'project' | 'contact';
  form_data: Record<string, any>;
  email?: string;
  name?: string;
  created_at: string;
  status: 'reviewing' | 'approved' | 'closed' | 'pending';
}

type TabKey = 'all' | 'membership' | 'project' | 'urgent';

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

function shortId(id: string, type: string) {
  const prefix = type === 'membership' ? 'MBR' : type === 'project' ? 'PRJ' : 'CTT';
  const num = id.replace(/\D/g, '').slice(0, 4).padStart(4, '0');
  return `${prefix}-${num}`;
}

function deriveStatus(submission: FormSubmission): FormSubmission['status'] {
  const raw = submission.form_data?.status || submission.form_data?.approval_status || '';
  if (raw === 'approved') return 'approved';
  if (raw === 'denied' || raw === 'rejected' || raw === 'closed') return 'closed';
  if (raw === 'pending' || raw === '') return 'reviewing';
  return 'pending';
}

function StatusBadge({ status }: { status: FormSubmission['status'] }) {
  const map = {
    reviewing: 'bg-amber-100 text-amber-700 border-amber-200',
    approved:  'bg-green-100 text-green-700 border-green-200',
    closed:    'bg-gray-100 text-gray-500 border-gray-200',
    pending:   'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'reviewing' ? 'bg-amber-500' :
        status === 'approved'  ? 'bg-green-500' :
        status === 'closed'    ? 'bg-gray-400'  : 'bg-blue-500'
      }`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TypeBadge({ type }: { type: FormSubmission['form_type'] }) {
  const map = {
    membership: { cls: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Users className="w-3 h-3" />, label: 'Membership' },
    project:    { cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <Briefcase className="w-3 h-3" />, label: 'Project' },
    contact:    { cls: 'bg-teal-100 text-teal-700 border-teal-200',       icon: <Mail className="w-3 h-3" />,     label: 'Contact' },
  };
  const { cls, icon, label } = map[type] ?? map.contact;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wide ${cls}`}>
      {icon}{label}
    </span>
  );
}

function AuditLog({ submission }: { submission: FormSubmission | null }) {
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<{ text: string; time: string }[]>([]);

  const addLog = () => {
    if (!note.trim()) return;
    setLogs(prev => [{ text: note.trim(), time: 'Just now' }, ...prev]);
    setNote('');
  };

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <FileText className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">Select a submission to view the audit log</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {logs.map((l, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-gray-800">{l.text}</p>
              <p className="text-gray-400 text-xs mt-0.5">{l.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addLog()}
          placeholder="Type a note for this item..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        <button
          onClick={addLog}
          className="mt-2 w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Log Interaction
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FormsPage() {
  const [tab, setTab] = useState<TabKey>('all');
  const [selected, setSelected] = useState<FormSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'reviewing' | 'approved' | 'closed'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const { searchTerm, setSearchTerm, debouncedValue } = useDebounceSearch('', { delay: 400, minLength: 0 });

  const { data: membersData } = useQuery({
    queryKey: queryKeys.platformMembers({ page: 1, search: '' }),
    queryFn: () => api.getPlatformMembers(),
    select: r => r.data,
  });

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: queryKeys.platformApplications({ page: 1, search: '' }),
    queryFn: () => api.getPlatformApplications(),
    select: r => r.data,
  });

  const submissions = useMemo<FormSubmission[]>(() => {
    const list: FormSubmission[] = [];

    membersData?.results?.forEach((m: any) => {
      const sub: FormSubmission = {
        id: `member_${m.id}`,
        short_id: shortId(`member_${m.id}`, 'membership'),
        form_type: 'membership',
        form_data: m,
        email: m.email,
        name: m.full_name || m.name,
        created_at: m.created_at,
        status: 'reviewing',
      };
      sub.status = deriveStatus(sub);
      list.push(sub);
    });

    applicationsData?.results?.forEach((a: any) => {
      const sub: FormSubmission = {
        id: `app_${a.id}`,
        short_id: shortId(`app_${a.id}`, 'project'),
        form_type: 'project',
        form_data: a,
        email: a.applicant_email || a.email,
        name: a.applicant_name || a.full_name,
        created_at: a.created_at,
        status: 'reviewing',
      };
      sub.status = deriveStatus(sub);
      list.push(sub);
    });

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [membersData, applicationsData]);

  const filtered = useMemo(() => {
    let out = submissions;
    if (tab === 'membership') out = out.filter(s => s.form_type === 'membership');
    else if (tab === 'project') out = out.filter(s => s.form_type === 'project');
    else if (tab === 'urgent') out = out.filter(s => s.status === 'reviewing');
    if (filterStatus !== 'all') out = out.filter(s => s.status === filterStatus);
    if (debouncedValue.trim()) {
      const q = debouncedValue.toLowerCase();
      out = out.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [submissions, tab, debouncedValue, filterStatus]);

  const pendingCount = submissions.filter(s => s.status === 'reviewing' || s.status === 'pending').length;

  const exportCSV = () => {
    const rows = [['ID', 'Name', 'Email', 'Type', 'Status', 'Date']];
    filtered.forEach(s => rows.push([
      s.short_id, s.name || '', s.email || '',
      s.form_type, s.status,
      new Date(s.created_at).toLocaleDateString(),
    ]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'submissions.csv' });
    a.click();
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (selected.form_type === 'membership') {
      toast.info('Membership approvals are managed via the Members panel');
      return;
    }
    const appId = selected.id.replace('app_', '');
    setActionLoading('approve');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${appId}/approve/`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      );
      if (res.ok) { toast.success('Application approved!'); setSelected(null); }
      else { const d = await res.json().catch(() => ({})); toast.error((d as any).detail || 'Failed to approve.'); }
    } catch { toast.error('Network error.'); } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (selected.form_type === 'membership') {
      toast.info('Membership management is handled via the Members panel');
      return;
    }
    const appId = selected.id.replace('app_', '');
    setActionLoading('reject');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'}/platform/applications/${appId}/`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }, body: JSON.stringify({ status: 'rejected' }) }
      );
      if (res.ok) { toast.success('Application rejected.'); setSelected(null); }
      else { toast.error('Failed to reject.'); }
    } catch { toast.error('Network error.'); } finally { setActionLoading(null); }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all',        label: 'All Forms' },
    { key: 'membership', label: 'Memberships' },
    { key: 'project',    label: 'Projects' },
    { key: 'urgent',     label: 'Urgent' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Form Submissions</h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-xl">
            High-fidelity ingestion stream for membership applications, project proposals, and direct outreach.
            Real-time status monitoring enabled.
          </p>
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm min-w-[110px]">
            <p className="text-xs font-medium text-gray-500">Pending</p>
            <div className="flex items-end gap-1.5 mt-1">
              <span className="text-2xl font-bold text-gray-900">{pendingCount}</span>
              <span className="text-xs text-amber-500 font-semibold mb-0.5">▲</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm min-w-[110px]">
            <p className="text-xs font-medium text-gray-500">Total Submissions</p>
            <div className="flex items-end gap-1.5 mt-1">
              <span className="text-2xl font-bold text-gray-900">{submissions.length}</span>
              <Clock className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs + actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-0">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                tab === t.key
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              {t.key === 'urgent' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterPanel(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                filterStatus !== 'all' || showFilterPanel
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />Filter{filterStatus !== 'all' && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-40 overflow-hidden">
                {([
                  { key: 'all',       label: 'All Statuses' },
                  { key: 'reviewing', label: 'Reviewing' },
                  { key: 'approved',  label: 'Approved' },
                  { key: 'closed',    label: 'Closed' },
                ] as const).map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => { setFilterStatus(opt.key); setShowFilterPanel(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${filterStatus === opt.key ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />Export
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-400 font-medium">
          Showing {Math.min(filtered.length, 10)} of {filtered.length} submissions
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No submissions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelected(prev => prev?.id === sub.id ? null : sub)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${
                      selected?.id === sub.id ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    {/* ID */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {sub.short_id}
                      </span>
                    </td>

                    {/* Name + email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{initials(sub.name)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{sub.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400 leading-tight mt-0.5">{sub.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <TypeBadge type={sub.form_type} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 text-sm">
                        {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(sub.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={sub.status} />
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3.5 text-right">
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                        selected?.id === sub.id ? 'rotate-90 text-blue-500' : ''
                      }`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom split panel ───────────────────────────────────────────── */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Submission details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Submission Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Submitter hero row */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{initials(selected.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {selected.form_type === 'membership' ? 'Membership Application' : 'Project Application'}: {selected.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{selected.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'approve' ? '…' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? '…' : 'Reject'}
                </button>
              </div>
            </div>

            {/* Key fields */}
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {Object.entries(selected.form_data)
                .filter(([k]) => !['id', 'created_at', 'updated_at', 'profile_picture'].includes(k))
                .slice(0, 8)
                .map(([key, val]) => {
                  if (!val) return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const value = typeof val === 'object' ? JSON.stringify(val) : String(val);
                  return (
                    <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500 font-medium truncate">{label}</span>
                      <span className="text-gray-900 truncate">{value.length > 60 ? value.slice(0, 60) + '…' : value}</span>
                    </div>
                  );
                })}
            </div>

            {/* Motivation / notes */}
            {(selected.form_data.motivation || selected.form_data.notes || selected.form_data.bio) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statement</p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                  {selected.form_data.motivation || selected.form_data.notes || selected.form_data.bio}
                </p>
              </div>
            )}

            {/* Tags */}
            {selected.form_data.skills && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {String(selected.form_data.skills).split(',').slice(0, 5).map(s => (
                  <span key={s} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Audit log */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Internal Audit Log</h3>
            <AuditLog submission={selected} />
          </div>
        </div>
      )}
    </div>
  );
}

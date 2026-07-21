'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ListOrdered, Plus, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react';

const TRIGGERS = [
  { value: 'user_registered', label: 'User Registered' },
  { value: 'user_approved', label: 'User Approved' },
  { value: 'member_joined', label: 'Member Joined' },
  { value: 'project_applied', label: 'Project Application Submitted' },
  { value: 'application_approved', label: 'Project Application Approved' },
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'booking_cancelled', label: 'Booking Cancelled' },
];

type Tab = 'cadences' | 'enrollments';

export default function CadencesPage() {
  const [cadences, setCadences] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('cadences');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', trigger: 'user_registered' });
  const [stepForms, setStepForms] = useState<Record<number, { step_number: string; delay_days: string; subject: string; body: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCadences();
    loadEnrollments();
  }, []);

  const loadCadences = async () => {
    const { data } = await api.getCadences();
    if (data) setCadences(Array.isArray(data) ? data : (data as any).results || []);
  };

  const loadEnrollments = async () => {
    const { data } = await api.getCadenceEnrollments();
    if (data) setEnrollments(Array.isArray(data) ? data : (data as any).results || []);
  };

  const createCadence = async () => {
    if (!form.name) return;
    setLoading(true);
    const { error } = await api.createCadence(form);
    setLoading(false);
    if (error) { alert(error); return; }
    setShowForm(false);
    setForm({ name: '', trigger: 'user_registered' });
    loadCadences();
  };

  const deleteCadence = async (id: number) => {
    if (!confirm('Delete this cadence?')) return;
    await api.deleteCadence(id);
    loadCadences();
  };

  const addStep = async (cadenceId: number) => {
    const sf = stepForms[cadenceId];
    if (!sf?.subject) return;
    const { error } = await api.createCadenceStep({
      cadence: cadenceId,
      step_number: Number(sf.step_number) || 1,
      delay_days: Number(sf.delay_days) || 0,
      action: 'send_email',
      subject: sf.subject,
      body: sf.body,
    });
    if (error) { alert(error); return; }
    setStepForms(prev => ({ ...prev, [cadenceId]: { step_number: '', delay_days: '', subject: '', body: '' } }));
    loadCadences();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-blue-600" /> Cadences
          </h1>
          <p className="text-gray-500 text-sm mt-1">Multi-step automated email sequences triggered by platform events.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> New Cadence
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['cadences', 'enrollments'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'cadences' ? `Cadences (${cadences.length})` : `Enrollments (${enrollments.length})`}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Cadence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cadence Name</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Booking Follow-Up" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={createCadence} loading={loading} disabled={!form.name}>Create Cadence</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cadences List */}
      {activeTab === 'cadences' && (
        <div className="space-y-3">
          {cadences.length === 0 && <p className="text-gray-500 text-sm">No cadences yet.</p>}
          {cadences.map(cadence => (
            <Card key={cadence.id} padding={false}>
              {/* Header row */}
              <div className="flex items-center justify-between p-4">
                <button
                  className="flex items-center gap-2 text-left flex-1"
                  onClick={() => setExpandedId(expandedId === cadence.id ? null : cadence.id)}>
                  {expandedId === cadence.id
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div>
                    <p className="font-medium text-gray-900">{cadence.name}</p>
                    <p className="text-xs text-gray-500">
                      Trigger: <code className="bg-gray-100 px-1 rounded">{cadence.trigger}</code>
                      {' · '}{cadence.steps?.length || 0} step(s)
                    </p>
                  </div>
                </button>
                <button onClick={() => deleteCadence(cadence.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-3">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded steps */}
              {expandedId === cadence.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                  {/* Existing steps */}
                  {(cadence.steps || []).map((step: any) => (
                    <div key={step.id} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.step_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{step.subject}</p>
                        <p className="text-xs text-gray-500">After {step.delay_days} day(s)</p>
                        {step.body && <p className="text-xs text-gray-400 mt-1 truncate">{step.body}</p>}
                      </div>
                    </div>
                  ))}

                  {/* Add step form */}
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-700">Add Step</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border rounded px-2 py-1 text-xs" type="number" placeholder="Step #"
                        value={stepForms[cadence.id]?.step_number || ''}
                        onChange={e => setStepForms(prev => ({ ...prev, [cadence.id]: { ...prev[cadence.id], step_number: e.target.value } }))} />
                      <input className="border rounded px-2 py-1 text-xs" type="number" placeholder="Delay (days)"
                        value={stepForms[cadence.id]?.delay_days || ''}
                        onChange={e => setStepForms(prev => ({ ...prev, [cadence.id]: { ...prev[cadence.id], delay_days: e.target.value } }))} />
                    </div>
                    <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Email subject"
                      value={stepForms[cadence.id]?.subject || ''}
                      onChange={e => setStepForms(prev => ({ ...prev, [cadence.id]: { ...prev[cadence.id], subject: e.target.value } }))} />
                    <textarea className="w-full border rounded px-2 py-1 text-xs resize-none" rows={2}
                      placeholder="Body (supports {{ name }}, {{ email }})"
                      value={stepForms[cadence.id]?.body || ''}
                      onChange={e => setStepForms(prev => ({ ...prev, [cadence.id]: { ...prev[cadence.id], body: e.target.value } }))} />
                    <Button size="xs" onClick={() => addStep(cadence.id)}>Add Step</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Enrollments Table */}
      {activeTab === 'enrollments' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Recipient</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Cadence</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Step</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Next Send</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400 text-sm">No enrollments yet.</td></tr>
              )}
              {enrollments.map(en => (
                <tr key={en.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <p className="font-medium">{en.recipient_name || en.recipient_email}</p>
                    <p className="text-xs text-gray-400">{en.recipient_email}</p>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{en.cadence_name}</td>
                  <td className="py-2 px-3 text-gray-500">Step {en.current_step}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">
                    {en.next_send_at ? new Date(en.next_send_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 px-3">{statusBadge(en.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

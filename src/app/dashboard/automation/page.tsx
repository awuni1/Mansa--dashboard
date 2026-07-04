'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Zap, CheckCircle, XCircle, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const TRIGGERS = [
  { value: 'on_create', label: 'User Created' },
  { value: 'on_update', label: 'User Updated' },
  { value: 'on_approve', label: 'User Approved' },
  { value: 'scheduled', label: 'Scheduled' },
];

type Tab = 'rules' | 'logs';

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('rules');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trigger: 'on_create',
    target_model: 'User',
    action: 'send_email_template',
    email_template: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRules();
    loadLogs();
  }, []);

  const loadRules = async () => {
    const { data } = await api.getAutomationRules();
    if (data) setRules(Array.isArray(data) ? data : (data as any).results || []);
  };

  const loadLogs = async () => {
    const { data } = await api.getAutomationLogs();
    if (data) setLogs(Array.isArray(data) ? data : (data as any).results || []);
  };

  const toggleRule = async (rule: any) => {
    await api.updateAutomationRule(rule.id, { is_active: !rule.is_active });
    loadRules();
  };

  const deleteRule = async (id: number) => {
    if (!confirm('Delete this automation rule?')) return;
    await api.deleteAutomationRule(id);
    loadRules();
  };

  const submit = async () => {
    if (!form.name) return;
    setLoading(true);
    const payload = {
      ...form,
      email_template: form.email_template ? Number(form.email_template) : null,
    };
    const { error } = await api.createAutomationRule(payload);
    setLoading(false);
    if (error) { alert(error); return; }
    setShowForm(false);
    setForm({ name: '', trigger: 'on_create', target_model: 'User', action: 'send_email_template', email_template: '' });
    loadRules();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" /> Automation Rules
          </h1>
          <p className="text-gray-500 text-sm mt-1">Trigger emails automatically based on platform events.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> New Rule
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['rules', 'logs'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'rules' ? `Rules (${rules.length})` : `Run Log (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Automation Rule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Welcome new users" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Model</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.target_model} onChange={e => setForm(f => ({ ...f, target_model: e.target.value }))}>
                  <option value="User">User</option>
                  <option value="MentorshipBooking">Booking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Template ID (optional)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  type="number" value={form.email_template}
                  onChange={e => setForm(f => ({ ...f, email_template: e.target.value }))}
                  placeholder="Template ID" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={submit} loading={loading} disabled={!form.name}>Create Rule</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 && <p className="text-gray-500 text-sm">No automation rules yet.</p>}
          {rules.map(rule => (
            <Card key={rule.id} padding={false}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{rule.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Trigger: <code className="text-xs bg-gray-100 px-1 rounded">{rule.trigger}</code>
                    {' → '}
                    <code className="text-xs bg-gray-100 px-1 rounded">{rule.action}</code>
                    {' on '}
                    <code className="text-xs bg-gray-100 px-1 rounded">{rule.target_model}</code>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRule(rule)} title={rule.is_active ? 'Pause' : 'Activate'}>
                    {rule.is_active
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Logs Table */}
      {activeTab === 'logs' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Rule</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Target</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Ran At</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No logs yet.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{log.rule_name}</td>
                  <td className="py-2 px-3 text-gray-500 max-w-xs truncate">{log.target_repr}</td>
                  <td className="py-2 px-3 text-gray-500">{new Date(log.ran_at).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    {log.success
                      ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> OK</span>
                      : <span className="flex items-center gap-1 text-red-500 text-xs" title={log.error_message}><XCircle className="w-3 h-3" /> Failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

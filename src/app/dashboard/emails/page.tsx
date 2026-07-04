'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { api, EmailTemplate, EmailCampaign, EmailLog, Member } from '@/lib/api';
import {
  Mail, Send, Loader, Plus, Trash2, FileText,
  XCircle, Edit3, BarChart3, X, Zap, Target,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type ModalType = 'compose' | 'template' | null;

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<'all_members' | 'individual' | 'custom'>('all_members');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [sending, setSending] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', template_type: 'campaign', subject: '', html_content: '', text_content: '' });
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerUrl, setFlyerUrl] = useState<string>('');
  const [flyerUploading, setFlyerUploading] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => { loadTemplates(); loadMembers(); loadCampaigns(); loadEmailLogs(); }, []);

  const loadTemplates = async () => {
    const { data, error } = await api.getEmailTemplates();
    if (data && !error) setTemplates(data.results);
  };

  const loadMembers = async () => {
    let allMembers: Member[] = [], page = 1, hasMore = true;
    while (hasMore) {
      if (page > 20) break; // cap at ~2000 records to prevent OOM
      const { data, error } = await api.getPlatformMembers({ page });
      if (data && !error) { allMembers = [...allMembers, ...data.results]; hasMore = data.next !== null; page++; }
      else { hasMore = false; }
    }
    setMembers(allMembers);
  };

  const loadCampaigns = async () => {
    const { data, error } = await api.getEmailCampaigns();
    if (data && !error) setCampaigns(data.results);
  };

  const loadEmailLogs = async () => {
    const { data, error } = await api.getEmailLogs({ page: 1 });
    if (data && !error) setEmailLogs(data.results);
  };

  const getRecipientCount = () => {
    if (recipients === 'custom') return customEmails.split(',').filter(e => e.trim()).length;
    if (recipients === 'individual') return selectedMemberIds.length;
    return members.length;
  };

  const handleFlyerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerFile(file); setFlyerUploading(true);
    const { data, error } = await api.uploadCampaignFlyer(file);
    if (error) { toast.error('Failed to upload flyer'); setFlyerFile(null); }
    else if (data) { setFlyerUrl(data.flyer_url); toast.success('Flyer uploaded!'); }
    setFlyerUploading(false);
  };

  const sendEmails = async () => {
    setSending(true);
    if (!selectedTemplate) { toast.error('Select a template first'); setSending(false); return; }
    if (recipients === 'individual' && selectedMemberIds.length === 0) { toast.error('Select at least one member'); setSending(false); return; }
    try {
      const campaignData: any = {
        name: `Campaign - ${new Date().toISOString()}`, template: selectedTemplate.id,
        target_all_members: recipients === 'all_members',
        specific_member_emails: recipients === 'custom' ? customEmails : recipients === 'individual' ? members.filter(m => selectedMemberIds.includes(m.id)).map(m => m.email).join(',') : '',
        ...(flyerUrl ? { flyer_url: flyerUrl } : {}),
      };
      if (isScheduled && scheduledAt) campaignData.scheduled_at = new Date(scheduledAt).toISOString();
      const { data: campaign, error: campaignError } = await api.createEmailCampaign(campaignData);
      if (campaignError || !campaign) { toast.error('Failed to create campaign'); setSending(false); return; }
      if (isScheduled) { toast.success('Campaign scheduled!'); }
      else {
        const { error: sendError } = await api.sendEmailCampaign(campaign.id);
        if (sendError) { toast.error('Failed to send campaign'); }
        else { toast.success(`Sent to ${getRecipientCount()} recipient(s)!`); loadCampaigns(); }
      }
      setActiveModal(null);
    } catch { toast.error('Error sending.'); } finally { setSending(false); }
  };

  const createTemplate = async () => {
    const { error } = await api.createEmailTemplate(templateForm);
    if (error) { toast.error('Failed to create template'); return; }
    toast.success('Template created!'); setActiveModal(null); loadTemplates(); resetTemplateForm();
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    const { error } = await api.updateEmailTemplate(editingTemplate.id, templateForm);
    if (error) { toast.error('Failed to update template'); return; }
    toast.success('Template updated!'); setActiveModal(null); setEditingTemplate(null); loadTemplates(); resetTemplateForm();
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    const { error } = await api.deleteEmailTemplate(id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Template deleted!'); loadTemplates();
  };

  const sendCampaign = async (id: number) => {
    if (!confirm('Send this campaign now?')) return;
    const { error } = await api.sendEmailCampaign(id);
    if (error) { toast.error('Failed to send'); return; }
    toast.success('Campaign sent!'); loadCampaigns();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    const { error } = await api.deleteEmailCampaign(id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted!'); loadCampaigns();
  };

  const sendTest = async () => {
    if (!testEmail.trim()) { setTestResult({ ok: false, message: 'Enter an email address.' }); return; }
    setTestSending(true); setTestResult(null);
    const { data, error } = await api.sendTestEmail(testEmail.trim());
    if (error) { setTestResult({ ok: false, message: error }); }
    else { setTestResult({ ok: true, message: data?.detail || 'Test sent!' }); toast.success(`Test sent to ${testEmail}`); }
    setTestSending(false);
  };

  const resetTemplateForm = () => setTemplateForm({ name: '', template_type: 'campaign', subject: '', html_content: '', text_content: '' });

  const getStatusColor = (status: string) => {
    if (status === 'sent') return 'bg-green-100 text-green-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    if (status === 'sending' || status === 'scheduled') return 'bg-blue-100 text-blue-700';
    if (status === 'queued') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newArrivals = members.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
  const inactiveCount = members.filter(m => m.is_active === false).length;

  const sentLogs = emailLogs.filter(l => ['sent', 'opened', 'clicked'].includes(l.status));
  const openedLogs = emailLogs.filter(l => l.status === 'opened' || l.status === 'clicked');
  const clickedLogs = emailLogs.filter(l => l.status === 'clicked');
  const openRate = sentLogs.length > 0 ? (openedLogs.length / sentLogs.length * 100).toFixed(1) : null;
  const ctr = sentLogs.length > 0 ? (clickedLogs.length / sentLogs.length * 100).toFixed(1) : null;

  const targetSegments = [
    { label: 'All Members', count: members.length, badge: 'ACTIVE', color: 'bg-green-100 text-green-700' },
    { label: 'New Members (Last 30d)', count: newArrivals, badge: 'NEW', color: 'bg-blue-100 text-blue-700' },
    { label: 'Inactive Members', count: inactiveCount, badge: 'INACTIVE', color: 'bg-gray-100 text-gray-500' },
  ];

  const timelineItems = [
    ...campaigns.slice(0, 3).map(c => ({ id: c.id, label: c.name, date: c.created_at, status: c.status, type: 'campaign' as const })),
    ...emailLogs.slice(0, 2).map(l => ({ id: l.id, label: l.subject, date: l.created_at, status: l.status, type: 'log' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
          <p className="text-sm text-gray-500 mt-1">Execute and monitor strategic communication arrays.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setActiveModal('compose')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold tracking-wider rounded-lg transition-colors shadow-sm">
            <Plus className="h-3.5 w-3.5" /> NEW CAMPAIGN
          </button>
          <button type="button" onClick={() => { setIsScheduled(false); setActiveModal('compose'); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider rounded-lg transition-colors shadow-sm">
            <Zap className="h-3.5 w-3.5" /> DEPLOY URGENT
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Emails Sent */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Emails Sent</p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold text-gray-900">{sentLogs.length >= 1000 ? `${(sentLogs.length / 1000).toFixed(1)}K` : sentLogs.length}</p>
            <span className="text-xs font-semibold text-gray-400">{campaigns.length} campaigns</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">total delivered</p>
          <div className="flex items-end gap-0.5 h-10">
            {(() => {
              if (emailLogs.length === 0) return <div className="w-full text-[10px] text-gray-300 flex items-center justify-center">No data yet</div>;
              const byDay = Array.from({ length: 12 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (11 - i));
                const ds = d.toISOString().slice(0, 10);
                return emailLogs.filter(l => l.created_at?.slice(0, 10) === ds).length;
              });
              const max = Math.max(...byDay, 1);
              return byDay.map((v, i) => (
                <div key={i} className={`flex-1 rounded-sm ${i >= 9 ? 'bg-blue-500' : 'bg-blue-100'}`} style={{ height: `${Math.max(8, Math.round(v / max * 100))}%` }} />
              ));
            })()}
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Open Rate</p>
            <p className="text-3xl font-bold text-gray-900">{openRate !== null ? `${openRate}%` : '—'}</p>
            <p className="text-[11px] text-gray-400 mt-1">{sentLogs.length} emails tracked</p>
            <div className="mt-4">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Click-Through Rate</p>
              <p className="text-xl font-bold text-gray-900">{ctr !== null ? `${ctr}%` : '—'}</p>
            </div>
          </div>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${openRate ?? 0} ${100 - Number(openRate ?? 0)}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-700">{openRate !== null ? `${Math.round(Number(openRate))}%` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Provider + Test */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Provider Status</p>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">SMTP — Configured</p>
          </div>
          <div className="space-y-1 text-[11px] mb-3">
            {[['Provider', 'SMTP via .env.local'], ['Transport', 'Nodemailer'], ['Status', '✓ Ready']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">{k}</span><span className="font-mono text-gray-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" aria-label="Test email address"
              className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            <button type="button" onClick={sendTest} disabled={testSending} title="Send test email" className="px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {testSending ? <Loader className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
          </div>
          {testResult && <p className={`text-[11px] mt-1.5 ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>{testResult.message}</p>}
        </div>
      </div>

      {/* ── Templates + Segments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Active Templates */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Active Templates</span>
            <button type="button" onClick={() => { resetTemplateForm(); setEditingTemplate(null); setActiveModal('template'); }}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-3">No templates yet</p>
              <button type="button" onClick={() => { resetTemplateForm(); setActiveModal('template'); }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Create Template</button>
            </div>
          ) : (
            templates.map((template, idx) => (
              <div key={template.id} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${idx < templates.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{template.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{template.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{template.template_type}</span>
                  <button type="button" title="Edit template"
                    onClick={() => { setEditingTemplate(template); setTemplateForm({ name: template.name, template_type: template.template_type, subject: template.subject, html_content: template.html_content, text_content: template.text_content || '' }); setActiveModal('template'); }}
                    className="p-1.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Delete template" onClick={() => deleteTemplate(template.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Target Segments */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Target Segments</span>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          {targetSegments.map((seg, idx) => (
            <div key={seg.label} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${idx < targetSegments.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div>
                <p className="text-sm font-semibold text-gray-900">{seg.label}</p>
                <p className="text-[11px] text-gray-400">{seg.count} members</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${seg.color}`}>{seg.badge}</span>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-gray-50">
            <button type="button" onClick={() => setActiveModal('compose')} className="w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Deploy to Segment
            </button>
          </div>
        </div>
      </div>

      {/* ── Deployment Timeline ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Deployment Timeline</span>
          <BarChart3 className="h-4 w-4 text-gray-400" />
        </div>
        <div className="p-5">
          {timelineItems.length === 0 ? (
            <div className="flex items-center gap-4">
              {[{ label: 'Create', color: 'bg-blue-500' }, { label: 'Review', color: 'bg-amber-400' }, { label: 'Send', color: 'bg-green-500' }, { label: 'Report', color: 'bg-gray-200' }].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full ${step.color} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-gray-100 -mt-3" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {timelineItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'sent' ? 'bg-green-500' : item.status === 'failed' ? 'bg-red-500' : item.status === 'scheduled' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                  {item.type === 'campaign' && item.status === 'draft' && (
                    <button type="button" onClick={() => sendCampaign(item.id as number)} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1">
                      <Send className="h-3 w-3" /> Send
                    </button>
                  )}
                  {item.type === 'campaign' && (
                    <button type="button" title="Delete campaign" onClick={() => deleteCampaign(item.id as number)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Compose Modal ── */}
      {activeModal === 'compose' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" /> New Campaign</h2>
              <button type="button" onClick={() => setActiveModal(null)} aria-label="Close modal" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="compose-template" className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Template *</label>
                <select id="compose-template" value={selectedTemplate?.id || ''} onChange={(e) => { const t = templates.find(t => t.id === parseInt(e.target.value)); setSelectedTemplate(t || null); if (t) { setSubject(t.subject); setBody(t.text_content || t.html_content); } }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white">
                  <option value="">Select a template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.template_type})</option>)}
                </select>
              </div>
              <div>
                <p className="block text-[13px] font-medium text-gray-700 mb-2">Recipients *</p>
                <div className="space-y-2">
                  {([
                    { value: 'all_members', label: 'All Community Members', count: members.length },
                    { value: 'individual', label: 'Select Individual Members', count: selectedMemberIds.length },
                    { value: 'custom', label: 'Custom Email Addresses', count: customEmails.split(',').filter(e => e.trim()).length },
                  ] as const).map((opt) => (
                    <label key={opt.value} htmlFor={`rec-${opt.value}`} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${recipients === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <input id={`rec-${opt.value}`} type="radio" name="recipients" value={opt.value} checked={recipients === opt.value} onChange={(e) => setRecipients(e.target.value as typeof recipients)} className="w-4 h-4 text-blue-600" aria-label={opt.label} />
                        <span className="text-[13px] font-medium text-gray-900">{opt.label}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-gray-600">{opt.count}</span>
                    </label>
                  ))}
                </div>
                {recipients === 'individual' && (
                  <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                    {members.map((member) => (
                      <label key={member.id} htmlFor={`mem-${member.id}`} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 border ${selectedMemberIds.includes(member.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                        <input id={`mem-${member.id}`} type="checkbox" checked={selectedMemberIds.includes(member.id)} onChange={(e) => { if (e.target.checked) setSelectedMemberIds([...selectedMemberIds, member.id]); else setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id)); }} className="w-4 h-4 text-blue-600 rounded" aria-label={`Select ${member.name}`} />
                        <div><div className="text-[13px] font-medium text-gray-900">{member.name}</div><div className="text-xs text-gray-500">{member.email}</div></div>
                      </label>
                    ))}
                  </div>
                )}
                {recipients === 'custom' && (
                  <textarea value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} rows={3} aria-label="Custom email addresses" placeholder="email1@example.com, email2@example.com"
                    className="mt-3 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input id="sched-cb" type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" aria-label="Schedule for later" />
                <label htmlFor="sched-cb" className="text-[13px] font-medium text-gray-700">Schedule for later</label>
              </div>
              {isScheduled && (
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} aria-label="Schedule date and time"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white" />
              )}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Event Flyer (optional)</label>
                <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFlyerChange} disabled={flyerUploading} aria-label="Upload event flyer" />
                  <span className="text-[13px] text-gray-500">{flyerUploading ? 'Uploading...' : flyerFile ? `✓ ${flyerFile.name}` : 'Click to upload flyer'}</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="button" onClick={sendEmails} disabled={!selectedTemplate || sending}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {sending ? <><Loader className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> {isScheduled ? 'Schedule' : 'Send Now'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Modal ── */}
      {activeModal === 'template' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">{editingTemplate ? 'Edit Template' : 'Create Template'}</span>
              <button type="button" onClick={() => setActiveModal(null)} aria-label="Close modal" className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div>
                <label htmlFor="tpl-name" className="block text-[13px] font-medium text-gray-700 mb-1.5">Template Name *</label>
                <Input id="tpl-name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g., Welcome Email"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white" />
              </div>
              <div>
                <label htmlFor="tpl-type" className="block text-[13px] font-medium text-gray-700 mb-1.5">Type *</label>
                <select id="tpl-type" value={templateForm.template_type} onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })} aria-label="Template type"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white">
                  {['welcome', 'approval', 'denial', 'campaign', 'notification'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="tpl-subject" className="block text-[13px] font-medium text-gray-700 mb-1.5">Subject Line *</label>
                <Input id="tpl-subject" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="e.g., Welcome to our community!"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white" />
              </div>
              <div>
                <label htmlFor="tpl-text" className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Message *</label>
                <textarea id="tpl-text" value={templateForm.text_content} onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })} rows={8}
                  placeholder="Write your email... Use {{name}} to personalize."
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white resize-none" />
              </div>
              <div>
                <label htmlFor="tpl-html" className="block text-[13px] font-medium text-gray-700 mb-1.5">HTML Content (optional)</label>
                <textarea id="tpl-html" value={templateForm.html_content} onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })} rows={5}
                  placeholder="Leave empty to use plain text above..."
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:ring-1 focus:ring-blue-500 w-full bg-white font-mono resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={editingTemplate ? updateTemplate : createTemplate} className="px-3 py-1.5 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

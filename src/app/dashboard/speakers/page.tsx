'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mic2, Plus, X, Linkedin, Globe, Mail, Clock } from 'lucide-react';

const PIPELINE: { value: string; label: string; color: string }[] = [
  { value: 'discovered', label: 'Discovered', color: 'bg-gray-100 text-gray-700' },
  { value: 'researching', label: 'Researching', color: 'bg-blue-50 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-indigo-50 text-indigo-700' },
  { value: 'engaged', label: 'Engaged', color: 'bg-purple-50 text-purple-700' },
  { value: 'invited', label: 'Invited', color: 'bg-amber-50 text-amber-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-50 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'advocate', label: 'Advocate', color: 'bg-teal-50 text-teal-700' },
];

const ALL_STATUSES = [...PIPELINE.map(p => p.value), 'declined', 'dormant'];

const INTERACTION_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin_dm', label: 'LinkedIn DM' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'warm_intro', label: 'Warm Intro' },
  { value: 'event', label: 'Event' },
  { value: 'note', label: 'Note' },
];

type Speaker = {
  id: number; name: string; title: string; organization: string; country: string;
  photo_url: string; expertise_tags: string[]; status: string; alignment_score: number;
};

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [funnel, setFunnel] = useState<{ status: string; label: string; count: number }[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', organization: '', country: '', linkedin_url: '', email: '', expertise: '', source: '' });
  const [interactionForm, setInteractionForm] = useState({ interaction_type: 'linkedin_dm', summary: '', follow_up_due: '' });
  const [aiSource, setAiSource] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');
  const [photoCandidates, setPhotoCandidates] = useState<{ page_url: string; image_url: string }[] | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [emailCompose, setEmailCompose] = useState<{ subject: string; body: string; to: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  const load = async () => {
    const [s, f] = await Promise.all([api.getSpeakers({ page_size: '100' }), api.getSpeakerFunnel()]);
    if (s.data) setSpeakers(Array.isArray(s.data) ? s.data : (s.data as any).results || []);
    if (f.data) setFunnel(f.data);
  };

  useEffect(() => { load(); }, []);

  const openSpeaker = async (id: number) => {
    const { data } = await api.getSpeaker(id);
    if (data) setSelected(data);
  };

  const createSpeaker = async () => {
    if (!form.name) return;
    setLoading(true);
    await api.createSpeaker({
      name: form.name, title: form.title, organization: form.organization,
      country: form.country, linkedin_url: form.linkedin_url, email: form.email,
      source: form.source,
      expertise_tags: form.expertise.split(',').map(t => t.trim()).filter(Boolean),
    });
    setForm({ name: '', title: '', organization: '', country: '', linkedin_url: '', email: '', expertise: '', source: '' });
    setShowForm(false);
    setLoading(false);
    load();
  };

  const setStatus = async (id: number, status: string) => {
    await api.updateSpeaker(id, { status });
    if (selected?.id === id) openSpeaker(id);
    load();
  };

  const logInteraction = async () => {
    if (!selected || !interactionForm.summary) return;
    setLoading(true);
    await api.createSpeakerInteraction({
      speaker: selected.id,
      interaction_type: interactionForm.interaction_type,
      summary: interactionForm.summary,
      occurred_at: new Date().toISOString(),
      follow_up_due: interactionForm.follow_up_due || null,
    });
    setInteractionForm({ interaction_type: 'linkedin_dm', summary: '', follow_up_due: '' });
    setLoading(false);
    openSpeaker(selected.id);
  };

  const runAI = async (kind: string) => {
    if (!selected) return;
    setAiLoading(kind);
    setAiError('');
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/speakers/speakers/${selected.id}/generate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api.getToken()}`,
      },
      body: JSON.stringify({ kind, source_text: aiSource }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      setAiError(err.error || 'AI generation failed');
    } else {
      await openSpeaker(selected.id);
    }
    setAiLoading(null);
  };

  const findPhoto = async () => {
    if (!selected) return;
    setPhotoLoading(true);
    setAiError('');
    setPhotoCandidates(null);
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/speakers/speakers/${selected.id}/find_photo/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.getToken()}` },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      setAiError(err.error || 'Photo search failed');
    } else {
      const data = await resp.json();
      setPhotoCandidates(data.candidates || []);
    }
    setPhotoLoading(false);
  };

  const pickPhoto = async (url: string) => {
    if (!selected || !url) return;
    await api.updateSpeaker(selected.id, { photo_url: url });
    setPhotoCandidates(null);
    await openSpeaker(selected.id);
    load();
  };

  const SUBJECT_BY_KIND: Record<string, string> = {
    outreach_draft: 'Invitation to speak — Mansa-to-Mansa',
    follow_up: 'Following up — Mansa-to-Mansa',
    thank_you: 'Thank you from Mansa-to-Mansa',
    event_brief: 'Your Mansa-to-Mansa event brief',
  };

  const openCompose = (a: any) => {
    setEmailStatus('');
    setEmailCompose({
      subject: SUBJECT_BY_KIND[a.kind] || 'Message from Mansa-to-Mansa',
      body: a.content,
      to: selected?.email || '',
    });
  };

  const sendEmail = async () => {
    if (!selected || !emailCompose) return;
    setEmailSending(true);
    setEmailStatus('');
    if (!selected.email && emailCompose.to) {
      await api.updateSpeaker(selected.id, { email: emailCompose.to });
    }
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/speakers/speakers/${selected.id}/send_email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.getToken()}` },
      body: JSON.stringify({ subject: emailCompose.subject, body: emailCompose.body }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      setEmailStatus(data.error || 'Send failed');
    } else {
      setEmailStatus(data.detail || 'Email sent');
      setEmailCompose(null);
      await openSpeaker(selected.id);
    }
    setEmailSending(false);
  };

  const byStatus = (status: string) => speakers.filter(s => s.status === status);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-blue-600" /> Speaker Pipeline
          </h1>
          <p className="text-gray-500 text-sm mt-1">Relationship CRM for guest speakers and experts.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Add Speaker</Button>
      </div>

      {/* Funnel summary */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {funnel.filter(f => PIPELINE.some(p => p.value === f.status)).map(f => (
          <div key={f.status} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{f.count}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{f.label}</p>
          </div>
        ))}
      </div>

      {/* Add speaker form */}
      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                ['name', 'Full Name *'], ['title', 'Title'], ['organization', 'Organization'],
                ['country', 'Country'], ['linkedin_url', 'LinkedIn URL'], ['email', 'Email'],
                ['expertise', 'Expertise (comma-separated)'], ['source', 'How discovered?'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={createSpeaker} loading={loading} disabled={!form.name}>Add Speaker</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PIPELINE.map(stage => (
          <div key={stage.value} className="min-w-[220px] flex-1">
            <div className={`rounded-t-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide ${stage.color}`}>
              {stage.label} ({byStatus(stage.value).length})
            </div>
            <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[120px]">
              {byStatus(stage.value).map(s => (
                <button key={s.id} onClick={() => openSpeaker(s.id)}
                  className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-2">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{s.name?.[0] || '?'}</div>
                    )}
                    <p className="font-bold text-[13px] text-gray-900">{s.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.title}{s.organization ? ` · ${s.organization}` : ''}</p>
                  {(s.expertise_tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.expertise_tags.slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt={selected.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">{selected.name?.[0] || '?'}</div>
                )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.title}{selected.organization ? ` · ${selected.organization}` : ''}</p>
                <p className="text-xs text-gray-400">{selected.country}</p>
                <button onClick={findPhoto} disabled={photoLoading}
                  className="mt-1 px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold rounded hover:bg-indigo-100 disabled:opacity-50">
                  {photoLoading ? 'Searching…' : '✨ AI Find Photo'}
                </button>
              </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-3 text-gray-500">
              {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-blue-600"><Linkedin className="w-4 h-4" /></a>}
              {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="hover:text-blue-600"><Globe className="w-4 h-4" /></a>}
              {selected.email && <a href={`mailto:${selected.email}`} className="hover:text-blue-600"><Mail className="w-4 h-4" /></a>}
              <span className="ml-auto text-xs font-semibold text-gray-600">Alignment: {selected.alignment_score}/100</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pipeline Stage</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selected.status}
                onChange={e => setStatus(selected.id, e.target.value)}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {selected.bio && <p className="text-sm text-gray-600">{selected.bio}</p>}

            {/* Log interaction */}
            <div className="border rounded-xl p-3 space-y-2 bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase">Log Interaction</p>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={interactionForm.interaction_type}
                onChange={e => setInteractionForm(f => ({ ...f, interaction_type: e.target.value }))}>
                {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="What happened?"
                value={interactionForm.summary}
                onChange={e => setInteractionForm(f => ({ ...f, summary: e.target.value }))} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Follow-up due:</label>
                <input type="date" className="border rounded-lg px-2 py-1 text-sm"
                  value={interactionForm.follow_up_due}
                  onChange={e => setInteractionForm(f => ({ ...f, follow_up_due: e.target.value }))} />
                <Button onClick={logInteraction} loading={loading} disabled={!interactionForm.summary} className="ml-auto">Log</Button>
              </div>
            </div>

            {photoCandidates && (
              <div className="border rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pick the correct photo</p>
                {photoCandidates.filter(c => c.image_url).length === 0 && (
                  <p className="text-xs text-gray-500">No photos found on the discovered pages. Sources found:{' '}
                    {photoCandidates.map(c => c.page_url).slice(0, 3).join(', ') || 'none'}</p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {photoCandidates.filter(c => c.image_url).map((c, i) => (
                    <button key={i} onClick={() => pickPhoto(c.image_url)} title={c.page_url}
                      className="border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                      <img src={c.image_url} alt="candidate" className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setPhotoCandidates(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
            )}

            {emailStatus && <p className="text-xs font-semibold text-green-600">{emailStatus}</p>}
            {emailCompose && (
              <div className="border-2 border-blue-200 rounded-xl p-3 space-y-2 bg-blue-50/50">
                <p className="text-xs font-bold text-blue-700 uppercase">Send Email to Speaker</p>
                {selected.email ? (
                  <p className="text-xs text-gray-600">To: <strong>{selected.email}</strong></p>
                ) : (
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Speaker's email address"
                    value={emailCompose.to}
                    onChange={e => setEmailCompose(c => c && ({ ...c, to: e.target.value }))} />
                )}
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Subject"
                  value={emailCompose.subject}
                  onChange={e => setEmailCompose(c => c && ({ ...c, subject: e.target.value }))} />
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={8}
                  value={emailCompose.body}
                  onChange={e => setEmailCompose(c => c && ({ ...c, body: e.target.value }))} />
                {emailStatus && <p className="text-xs text-red-600">{emailStatus}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEmailCompose(null)}>Cancel</Button>
                  <Button onClick={sendEmail} loading={emailSending}
                    disabled={!emailCompose.subject || !emailCompose.body || (!selected.email && !emailCompose.to)}>
                    Send Email
                  </Button>
                </div>
              </div>
            )}

            {/* AI copilot */}
            <div className="border rounded-xl p-3 space-y-2 bg-indigo-50/50 border-indigo-100">
              <p className="text-xs font-bold text-indigo-600 uppercase">AI Copilot (Gemini)</p>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
                placeholder="Optional: paste their LinkedIn About, articles, or context…"
                value={aiSource} onChange={e => setAiSource(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {([
                  ['summary', 'Research Summary'],
                  ['outreach_draft', 'Outreach Draft'],
                  ['follow_up', 'Follow-Up'],
                  ['thank_you', 'Thank-You Note'],
                  ['moderator_questions', 'Moderator Questions'],
                  ['event_brief', 'Event Brief'],
                ] as const).map(([kind, label]) => (
                  <button key={kind} onClick={() => runAI(kind)} disabled={aiLoading !== null}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 disabled:opacity-50">
                    {aiLoading === kind ? 'Generating…' : label}
                  </button>
                ))}
              </div>
              {aiError && <p className="text-xs text-red-600">{aiError}</p>}
              {(selected.ai_artifacts || []).slice(0, 3).map((a: any) => (
                <div key={a.id} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">{a.kind.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                      <button onClick={() => openCompose(a)}
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded hover:bg-blue-700">
                        Send as Email
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">{a.content}</pre>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Relationship Timeline</p>
              <div className="space-y-2">
                {(selected.interactions || []).map((i: any) => (
                  <div key={i.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700 uppercase">{i.interaction_type.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-400">{new Date(i.occurred_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{i.summary}</p>
                    {i.follow_up_due && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Follow up by {i.follow_up_due}
                      </p>
                    )}
                  </div>
                ))}
                {(selected.interactions || []).length === 0 && (
                  <p className="text-sm text-gray-400">No interactions logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

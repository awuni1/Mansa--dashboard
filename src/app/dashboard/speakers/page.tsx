'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus, X, Linkedin, Globe, Mail, Clock, Sparkles, Check, Trash2,
  ChevronDown, ChevronUp, Twitter, Link2, ArrowRight,
} from 'lucide-react';

const PIPELINE: { value: string; label: string }[] = [
  { value: 'discovered', label: 'Discovered' },
  { value: 'researching', label: 'Researching' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'invited', label: 'Invited' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'advocate', label: 'Advocate' },
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
  alignment_notes?: string; bio?: string;
  response_likelihood_score?: number | null; discovery_batch_id?: string | null;
  response_likelihood_rationale?: string; suggested_topics?: string[]; discovery_notes?: string;
  email?: string; linkedin_url?: string; twitter_url?: string; website?: string;
  other_links?: { label: string; url: string }[]; ai_summary?: string;
};

/** Minimal, dependency-free markdown renderer for AI-generated dossiers and
 * artifacts — handles the handful of constructs Gemini actually produces
 * (### headings, **bold**, - bullets, blank-line paragraphs) so they render
 * properly instead of showing literal ** and ### characters. */
function renderMarkdownLite(text: string) {
  const renderInline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
      <span key={key}>
        {parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>)}
      </span>
    );
  };

  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc list-inside space-y-0.5 my-1.5">
          {listItems.map((li, i) => <li key={i}>{renderInline(li, i)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (heading) {
      flushList();
      blocks.push(
        <p key={i} className="font-bold text-gray-900 mt-2.5 mb-1">{renderInline(heading[2], i)}</p>
      );
    } else if (bullet) {
      listItems.push(bullet[1]);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push(<p key={i} className="mb-1.5">{renderInline(line, i)}</p>);
    }
  });
  flushList();
  return blocks;
}

/** AI-extracted URLs (linkedin_url, twitter_url, website, other_links) come
 * from web search results, not a trusted source — reject anything that
 * isn't http(s)/mailto before it ever reaches an href (blocks javascript:
 * and similar XSS vectors). Returns undefined for anything unsafe, so
 * callers should skip rendering the link entirely in that case. */
function safeUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    // No base — these are always meant to be absolute URLs; a relative-
    // looking value (or anything unparseable on its own) isn't one we trust.
    const parsed = new URL(u);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? u : undefined;
  } catch {
    return undefined;
  }
}

function initialsOf(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?';
}

/** Circular avatar with a photo or initials — matches the blue-600 circular
 * avatars already used on the Dashboard overview and Members pages. */
function Avatar({ name, photoUrl, size = 'md' }: { name?: string; photoUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${dims} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dims} rounded-full flex-shrink-0 flex items-center justify-center font-bold bg-blue-600 text-white`}>
      {initialsOf(name)}
    </div>
  );
}

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

  // AI speaker discovery (Phase 1: manual trigger, review-before-pipeline)
  const [topicFocus, setTopicFocus] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [discoverNotice, setDiscoverNotice] = useState('');
  const [candidateActionId, setCandidateActionId] = useState<number | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);

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

  const runDiscovery = async () => {
    setDiscovering(true);
    setDiscoverError('');
    setDiscoverNotice('');
    const resp = await api.discoverSpeakers(topicFocus);
    setDiscovering(false);
    if (resp.error) {
      setDiscoverError(resp.error);
      return;
    }
    // Discovery now runs fire-and-forget in the background (the full
    // pipeline takes minutes — too long for one HTTP request/response), so
    // this call only confirms it started. Poll for the next few minutes so
    // new candidates appear without the admin having to manually refresh.
    setDiscoverNotice((resp.data as any)?.detail || 'Discovery started — checking for new candidates…');
    setExpandedCandidateId(null);
    let checks = 0;
    const poll = setInterval(() => {
      checks += 1;
      load();
      if (checks >= 10) clearInterval(poll); // ~5 minutes at 30s intervals
    }, 30000);
    load();
  };

  const approveCandidate = async (id: number) => {
    setCandidateActionId(id);
    await api.approveSpeaker(id);
    setCandidateActionId(null);
    load();
  };

  const rejectCandidate = async (s: Speaker) => {
    if (!window.confirm(`Discard ${s.name} as a candidate? This can't be undone.`)) return;
    setCandidateActionId(s.id);
    await api.deleteSpeaker(s.id);
    setCandidateActionId(null);
    load();
  };

  const byStatus = (status: string) => speakers.filter(s => s.status === status);
  const candidates = speakers.filter(s => s.status === 'candidate');

  return (
    <div className="space-y-8 pb-8">
      {/* Header — matches the rest of the admin app's plain title treatment */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Speaker Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1.5 max-w-xl">
            Track every speaker from first discovery to long-term advocate. Review AI-sourced candidates,
            move people through stages and log each touchpoint.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Speaker
        </Button>
      </div>

      {/* AI Speaker Discovery — light card, same visual weight as every other card on this page */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> AI Speaker Discovery
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Find speakers for a topic</h2>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              Researches, scores and drafts outreach for three candidates. Results land in the review queue below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="flex-1 sm:w-72">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Topic focus</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. climate finance in emerging markets"
                value={topicFocus}
                onChange={e => setTopicFocus(e.target.value)}
                disabled={discovering}
              />
            </div>
            <button
              onClick={runDiscovery}
              disabled={discovering}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-60 sm:self-end whitespace-nowrap"
            >
              {discovering ? 'Discovering…' : 'Find 3 Speakers'}
              {!discovering && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {discoverError && <p className="text-xs text-red-600 mt-3">{discoverError}</p>}
        {discoverNotice && <p className="text-xs text-blue-600 mt-3">{discoverNotice}</p>}
      </div>

      {/* Candidate review queue — AI-discovered, pending human approval */}
      {candidates.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900">Candidate review</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full">
              {candidates.length} awaiting approval
            </span>
          </div>
          <div className="border-b border-gray-200 mt-3 mb-4" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {candidates.map(c => {
              const expanded = expandedCandidateId === c.id;
              const busy = candidateActionId === c.id;
              const scoreLabel = typeof c.response_likelihood_score === 'number'
                ? c.response_likelihood_score >= 66 ? 'High response' : c.response_likelihood_score >= 33 ? 'Medium response' : 'Low response'
                : null;
              return (
                <div key={c.id} className="border border-gray-200 rounded-xl bg-white flex flex-col overflow-hidden">
                  <div className="p-4 flex-1">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.name} photoUrl={c.photo_url} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900">{c.name}</p>
                          {scoreLabel && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              {scoreLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {c.title}{c.organization ? ` · ${c.organization}` : ''}
                        </p>
                        {c.country && <p className="text-xs text-gray-400">{c.country}</p>}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-3" />

                    {c.bio && <p className="text-sm text-gray-700">{c.bio}</p>}

                    {c.alignment_notes && (
                      <div className="mt-3 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg px-3 py-2">
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Why picked</p>
                        <p className="text-sm font-semibold text-blue-900 mt-0.5">{c.alignment_notes}</p>
                      </div>
                    )}

                    {c.response_likelihood_rationale && (
                      <p className="text-xs text-gray-600 mt-3">{c.response_likelihood_rationale}</p>
                    )}

                    {(c.suggested_topics || []).length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {(c.suggested_topics || []).map((t, i) => (
                          <div key={i} className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-blue-600 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                            <span className="text-sm text-gray-800">{t}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {c.discovery_notes && (
                      <p className="text-xs text-gray-600 mt-3">
                        <span className="font-bold text-gray-900">Outreach notes — </span>
                        {c.discovery_notes.replace(/\n/g, '  •  ')}
                      </p>
                    )}

                    {/* Contact & social */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {c.email && (
                        <a href={`mailto:${c.email}`} title={c.email}
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {safeUrl(c.linkedin_url) && (
                        <a href={safeUrl(c.linkedin_url)} target="_blank" rel="noreferrer" title="LinkedIn"
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {safeUrl(c.twitter_url) && (
                        <a href={safeUrl(c.twitter_url)} target="_blank" rel="noreferrer" title="Twitter/X"
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {safeUrl(c.website) && (
                        <a href={safeUrl(c.website)} target="_blank" rel="noreferrer" title="Website"
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {(c.other_links || []).filter(l => safeUrl(l.url)).map((l, i) => (
                        <a key={i} href={safeUrl(l.url)} target="_blank" rel="noreferrer" title={l.label || l.url}
                          className="h-8 px-2 flex items-center gap-1 border border-gray-200 rounded-lg text-gray-500 text-[11px] hover:border-blue-400 hover:text-blue-600 transition-colors">
                          <Link2 className="w-3.5 h-3.5" /> {l.label || 'Link'}
                        </a>
                      ))}
                      {!c.email && !c.linkedin_url && !c.twitter_url && !c.website && !(c.other_links || []).length && (
                        <span className="text-[11px] text-gray-400 italic">No contact details found — verify manually before outreach.</span>
                      )}
                    </div>

                    {c.ai_summary && (
                      <button onClick={() => setExpandedCandidateId(expanded ? null : c.id)}
                        className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800">
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        Show full dossier
                      </button>
                    )}
                    {expanded && c.ai_summary && (
                      <div className="mt-2 text-xs text-gray-700 max-h-64 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {renderMarkdownLite(c.ai_summary)}
                      </div>
                    )}
                  </div>

                  {/* Split footer — approve / reject */}
                  <div className="grid grid-cols-2 border-t border-gray-200">
                    <button onClick={() => approveCandidate(c.id)} disabled={busy}
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 transition-colors disabled:opacity-50">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => rejectCandidate(c)} disabled={busy}
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm py-3 border-l-2 border-blue-600 transition-colors disabled:opacity-50">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <Button onClick={createSpeaker} loading={loading} disabled={!form.name} className="bg-blue-600 hover:bg-blue-700 text-white">Add Speaker</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Pipeline</h2>
          <span className="text-sm text-gray-500">{speakers.filter(s => s.status !== 'candidate').length} speakers</span>
        </div>
        <div className="border-b border-gray-200 mt-3 mb-4" />

        {/* Stage counts — single bordered strip */}
        <div className="grid grid-cols-4 lg:grid-cols-8 border border-gray-200 rounded-xl overflow-hidden divide-x divide-y lg:divide-y-0 divide-gray-200 mb-5">
          {PIPELINE.map((stage, i) => {
            const count = funnel.find(f => f.status === stage.value)?.count ?? byStatus(stage.value).length;
            return (
              <div key={stage.value} className="p-3 bg-white">
                <p className="text-[10px] font-bold text-blue-600">
                  {String(i + 1).padStart(2, '0')} <span className="text-gray-400 font-bold tracking-wide">{stage.label.toUpperCase()}</span>
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Kanban board */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {PIPELINE.map(stage => (
            <div key={stage.value} className="min-w-[240px] flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                <span className="font-bold text-sm text-gray-900">{stage.label}</span>
                <span className="text-sm text-gray-500">{byStatus(stage.value).length}</span>
              </div>
              <div className="space-y-2">
                {byStatus(stage.value).map(s => (
                  <button key={s.id} onClick={() => openSpeaker(s.id)}
                    className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} photoUrl={s.photo_url} size="sm" />
                      <p className="font-bold text-[13px] text-gray-900">{s.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{s.title}{s.organization ? ` · ${s.organization}` : ''}</p>
                    {(s.expertise_tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.expertise_tags.slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar name={selected.name} photoUrl={selected.photo_url} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.title}{selected.organization ? ` · ${selected.organization}` : ''}</p>
                  <p className="text-xs text-gray-400">{selected.country}</p>
                  <button onClick={findPhoto} disabled={photoLoading}
                    className="mt-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold rounded hover:bg-blue-100 disabled:opacity-50">
                    {photoLoading ? 'Searching…' : 'AI Find Photo'}
                  </button>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            {/* Contact & social — same icon-row pattern as the candidate review cards */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {selected.email && (
                <a href={`mailto:${selected.email}`} title={selected.email}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
              {safeUrl(selected.linkedin_url) && (
                <a href={safeUrl(selected.linkedin_url)} target="_blank" rel="noreferrer" title="LinkedIn"
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
              {safeUrl(selected.twitter_url) && (
                <a href={safeUrl(selected.twitter_url)} target="_blank" rel="noreferrer" title="Twitter/X"
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              )}
              {safeUrl(selected.website) && (
                <a href={safeUrl(selected.website)} target="_blank" rel="noreferrer" title="Website"
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                </a>
              )}
              {(selected.other_links || []).filter((l: { label: string; url: string }) => safeUrl(l.url)).map((l: { label: string; url: string }, i: number) => (
                <a key={i} href={safeUrl(l.url)} target="_blank" rel="noreferrer" title={l.label || l.url}
                  className="h-8 px-2 flex items-center gap-1 border border-gray-200 rounded-lg text-gray-500 text-[11px] hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Link2 className="w-3.5 h-3.5" /> {l.label || 'Link'}
                </a>
              ))}
              {!selected.email && !selected.linkedin_url && !selected.twitter_url && !selected.website && !(selected.other_links || []).length && (
                <span className="text-xs text-gray-400 italic">No contact details on file.</span>
              )}
              {selected.alignment_score > 0 && (
                <span className="ml-auto text-xs font-semibold text-gray-600">Alignment: {selected.alignment_score}/100</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pipeline Stage</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selected.status}
                onChange={e => setStatus(selected.id, e.target.value)}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {selected.bio && <p className="text-sm text-gray-600">{selected.bio}</p>}

            {/* AI Discovery Insights — carries the "why picked" / score / topics
                forward past approval, instead of disappearing once a candidate
                leaves the review queue. */}
            {(selected.alignment_notes || typeof selected.response_likelihood_score === 'number' || (selected.suggested_topics || []).length > 0) && (
              <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-3.5 space-y-2.5">
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Discovery Insights
                </p>
                {selected.alignment_notes && (
                  <div className="bg-white border-l-4 border-blue-600 rounded-r-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Why picked</p>
                    <p className="text-sm text-blue-900 mt-0.5">{selected.alignment_notes}</p>
                  </div>
                )}
                {typeof selected.response_likelihood_score === 'number' && (
                  <p className="text-xs text-gray-700">
                    <span className="font-bold text-gray-900">Response likelihood: {selected.response_likelihood_score}/100.</span>{' '}
                    {selected.response_likelihood_rationale}
                  </p>
                )}
                {(selected.suggested_topics || []).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Suggested Topics</p>
                    {(selected.suggested_topics || []).map((t: string, i: number) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-blue-600 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-sm text-gray-800">{t}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selected.discovery_notes && (
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-900">Outreach notes — </span>
                    {selected.discovery_notes.replace(/\n/g, '  •  ')}
                  </p>
                )}
              </div>
            )}

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
                <Button onClick={logInteraction} loading={loading} disabled={!interactionForm.summary} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white">Log</Button>
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
                    disabled={!emailCompose.subject || !emailCompose.body || (!selected.email && !emailCompose.to)}
                    className="bg-blue-600 hover:bg-blue-700 text-white">
                    Send Email
                  </Button>
                </div>
              </div>
            )}

            {/* AI copilot */}
            <div className="border rounded-xl p-3 space-y-2 bg-blue-50/50 border-blue-100">
              <p className="text-xs font-bold text-blue-700 uppercase">AI Copilot (Gemini)</p>
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
                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 disabled:opacity-50">
                    {aiLoading === kind ? 'Generating…' : label}
                  </button>
                ))}
              </div>
              {aiError && <p className="text-xs text-red-600">{aiError}</p>}
              {(selected.ai_artifacts || []).slice(0, 3).map((a: any) => (
                <div key={a.id} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{a.kind.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                      <button onClick={() => openCompose(a)}
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded hover:bg-blue-700">
                        Send as Email
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 max-h-48 overflow-y-auto">{renderMarkdownLite(a.content)}</div>
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

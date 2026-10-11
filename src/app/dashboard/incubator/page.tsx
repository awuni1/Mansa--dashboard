'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Rocket, Search, Download, X, Video, ExternalLink, Mail, Users, CheckCircle2,
  Star, Clock, XCircle, Inbox, Linkedin, Loader2, RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'

// ── Types & constants ────────────────────────────────────────────────────────
type Member = { name: string; email: string; country: string; linkedin?: string }
type Application = {
  id: string
  cohort: string
  status: 'submitted' | 'shortlisted' | 'selected' | 'declined'
  video_file: string
  video_duration: number | null
  video_mime: string
  video_link: string // legacy: early applications pasted a link
  video_url?: string | null // short-lived signed link, only on the single-application endpoint
  video_download_url?: string | null
  team_size: number
  members: Member[]
  lead_name: string
  lead_email: string
  roles: string
  can_build: boolean
  is_member: boolean
  idea_sentence: string
  who_has_problem: string
  current_alternatives: string
  people_spoken: number
  surprise: string
  changed_mind: string
  stage: 'idea' | 'talked' | 'prototype' | 'users'
  built_link: string
  nontech_plan: string
  commit_hours: boolean
  commit_sessions: boolean
  heard_from: string
  scores: Record<string, number | null>
  reviewer_notes: string
  confirmation_email_sent: boolean
  confirmation_sent_to: string[]
  total_score: number | null
  created_at: string
}

const STATUSES = [
  { value: 'submitted', label: 'Submitted', badge: 'bg-gray-100 text-gray-700', icon: Inbox },
  { value: 'shortlisted', label: 'Shortlisted', badge: 'bg-amber-100 text-amber-700', icon: Star },
  { value: 'selected', label: 'Selected', badge: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  { value: 'declined', label: 'Declined', badge: 'bg-red-100 text-red-700', icon: XCircle },
] as const

const STAGES: Record<string, string> = {
  idea: 'Just an idea',
  talked: 'Talked to users',
  prototype: 'Has a prototype',
  users: 'Has users',
}

const HEARD_FROM: Record<string, string> = {
  community: 'Mansa-to-Mansa community',
  friend: 'A friend or colleague',
  linkedin: 'LinkedIn',
  x: 'X',
  event: 'An event',
  other: 'Other',
}

// Same five criteria (and keys) the backend validates and applicants see.
const CRITERIA = [
  { key: 'clarity', label: 'Clarity of the problem', hint: 'Section 2 and the video' },
  { key: 'founder_fit', label: 'Founder-problem fit', hint: '"Why you" in the video, and the "right team" answer' },
  { key: 'willingness', label: 'Willingness to be wrong', hint: 'The "what surprised you" answer' },
  { key: 'ship', label: 'Ability to ship', hint: "Section 4 and the team's skills" },
  { key: 'commitment', label: 'Commitment', hint: 'The checkboxes and time zone' },
]
const MAX_SCORE = CRITERIA.length * 5

// Only ever render http(s) links from applicant-supplied data.
const safeUrl = (u?: string) => {
  if (!u) return null
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/** Chrome's MediaRecorder WebM files carry no duration, so players show 0:00
 *  and can't seek until fully played. Seeking far past the end makes the
 *  browser work the length out; then jump back to the start. */
const fixUnknownDuration = (e: React.SyntheticEvent<HTMLMediaElement>) => {
  const el = e.currentTarget
  if (Number.isFinite(el.duration)) return
  const back = () => {
    el.removeEventListener('timeupdate', back)
    el.currentTime = 0
  }
  el.addEventListener('timeupdate', back)
  el.currentTime = 1e101
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const statusMeta = (s: string) => STATUSES.find((x) => x.value === s) ?? STATUSES[0]

const csvCell = (value: unknown) => {
  let s = value == null ? '' : String(value)
  if (/^[=@\t\r]/.test(s) || /^[+-](?![\d\s()-]+$)/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function IncubatorApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // Follow pagination so counts and exports cover every application.
    const rows: Application[] = []
    let page = 1
    for (;;) {
      const res = await api.getIncubatorApplications({ page: String(page), page_size: '100', ordering: '-created_at' })
      if (res.error || !res.data) {
        toast.error(res.error || 'Could not load applications')
        break
      }
      const data = res.data
      if (Array.isArray(data)) { rows.push(...data); break }
      rows.push(...(data.results || []))
      if (!data.next) break
      page += 1
    }
    setApps(rows)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return apps.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (stageFilter !== 'all' && a.stage !== stageFilter) return false
      if (!q) return true
      return (
        a.lead_name.toLowerCase().includes(q) ||
        a.lead_email.toLowerCase().includes(q) ||
        a.idea_sentence.toLowerCase().includes(q) ||
        a.members.some((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      )
    })
  }, [apps, search, statusFilter, stageFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length }
    STATUSES.forEach((s) => { c[s.value] = apps.filter((a) => a.status === s.value).length })
    return c
  }, [apps])

  const selected = apps.find((a) => a.id === selectedId) || null

  const onSaved = (updated: Application) => {
    setApps((list) => list.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
  }

  const exportCSV = () => {
    if (filtered.length === 0) return
    const headers = [
      'Applied', 'Status', 'Total score', 'Lead name', 'Lead email', 'Team size', 'Team members',
      'Idea', 'Who has the problem', 'What they do today', 'People spoken to', 'Surprise', 'Why the right team',
      'Stage', 'Can build', 'Built before', 'Non-technical plan', 'Member', 'Heard from',
      'Video length (s)', 'Video', ...CRITERIA.map((c) => c.label), 'Reviewer notes',
    ]
    const rows = filtered.map((a) => [
      new Date(a.created_at).toLocaleString(), statusMeta(a.status).label, a.total_score ?? '',
      a.lead_name, a.lead_email, a.team_size,
      a.members.map((m) => `${m.name} <${m.email}> (${m.country})`).join('; '),
      a.idea_sentence, a.who_has_problem, a.current_alternatives, a.people_spoken, a.surprise, a.changed_mind,
      STAGES[a.stage] || a.stage, a.can_build ? 'Yes' : 'No', a.built_link, a.nontech_plan,
      a.is_member ? 'Yes' : 'No', HEARD_FROM[a.heard_from] || a.heard_from,
      a.video_duration ?? '',
      a.video_file ? `Stored clip (watch in the dashboard): ${a.video_file}` : a.video_link,
      ...CRITERIA.map((c) => a.scores?.[c.key] ?? ''), a.reviewer_notes,
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `incubator-applications-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} application${filtered.length === 1 ? '' : 's'}`)
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Mansa Incubator · Cohort One</p>
          <h1 className="text-xl font-bold text-gray-900">Incubator Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review applications, watch each video, score the five criteria and shortlist.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wider rounded-lg"
          >
            <Download className="w-4 h-4" /> EXPORT CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Status tiles (click to filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[{ value: 'all', label: 'All applications', badge: 'bg-blue-100 text-blue-700', icon: Rocket }, ...STATUSES].map((s) => {
          const Icon = s.icon
          const on = statusFilter === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              className={`text-left bg-white rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                on ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.badge}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{counts[s.value] ?? 0}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or idea..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          aria-label="Filter by stage"
          className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All stages</option>
          {Object.entries(STAGES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Applications ({filtered.length})</span>
          <span className="text-[11px] text-gray-400">Click an application to review it</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">
              {apps.length === 0 ? 'No applications yet. They will appear here as soon as people apply.' : 'No applications match these filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Applicant', 'Idea', 'Team', 'Stage', 'Score', 'Status', 'Applied'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => {
                  const st = statusMeta(a.status)
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={`cursor-pointer transition-colors ${selectedId === a.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[11px] font-bold shrink-0">
                            {a.lead_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[180px]">{a.lead_name}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{a.lead_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] text-gray-700 line-clamp-2 max-w-[320px]">{a.idea_sentence}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {a.team_size}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{STAGES[a.stage] || a.stage}</td>
                      <td className="px-5 py-3.5 text-[12px] whitespace-nowrap">
                        {a.total_score != null ? (
                          <span className="font-bold text-gray-900">{a.total_score}<span className="text-gray-400 font-normal">/{MAX_SCORE}</span></span>
                        ) : (
                          <span className="text-gray-400">Not scored</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${st.badge}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <ApplicationPanel app={selected} onClose={() => setSelectedId(null)} onSaved={onSaved} />}
    </div>
  )
}

// ── Review panel ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Answer({ q, a }: { q: string; a?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-500">{q}</p>
      <div className="mt-0.5 text-[14px] text-gray-900 whitespace-pre-wrap break-words">{a || <span className="text-gray-400">No answer</span>}</div>
    </div>
  )
}

function ApplicationPanel({
  app,
  onClose,
  onSaved,
}: {
  app: Application
  onClose: () => void
  onSaved: (a: Application) => void
}) {
  const [status, setStatus] = useState(app.status)
  const [scores, setScores] = useState<Record<string, number | null>>(app.scores || {})
  const [notes, setNotes] = useState(app.reviewer_notes || '')
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState<{ url: string | null; download: string | null; loading: boolean }>({
    url: null, download: null, loading: !!app.video_file,
  })

  // Private clips need a fresh signed link, fetched when the panel opens.
  useEffect(() => {
    let cancelled = false
    if (!app.video_file) { setMedia({ url: null, download: null, loading: false }); return }
    setMedia({ url: null, download: null, loading: true })
    api.getIncubatorApplication(app.id).then((res) => {
      if (cancelled) return
      setMedia({ url: res.data?.video_url ?? null, download: res.data?.video_download_url ?? null, loading: false })
    })
    return () => { cancelled = true }
  }, [app.id, app.video_file])

  // Reset the form when switching to another application.
  useEffect(() => {
    setStatus(app.status)
    setScores(app.scores || {})
    setNotes(app.reviewer_notes || '')
  }, [app.id, app.status, app.scores, app.reviewer_notes])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total = CRITERIA.reduce((n, c) => n + (scores[c.key] || 0), 0)
  const scoredCount = CRITERIA.filter((c) => scores[c.key]).length
  const dirty =
    status !== app.status ||
    notes !== (app.reviewer_notes || '') ||
    // per criterion: the database may return the scores object in a different key order
    CRITERIA.some((c) => (scores[c.key] ?? null) !== (app.scores?.[c.key] ?? null))

  const save = async () => {
    setSaving(true)
    const res = await api.updateIncubatorApplication(app.id, { status, scores, reviewer_notes: notes })
    setSaving(false)
    if (res.error || !res.data) {
      toast.error(res.error || 'Could not save the review')
      return
    }
    onSaved(res.data as Application)
    toast.success('Review saved')
  }

  const legacyLink = safeUrl(app.video_link)
  const built = safeUrl(app.built_link)
  const sentTo = new Set(app.confirmation_sent_to || [])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-gray-900/30" />
      <div className="relative w-full max-w-2xl h-full bg-gray-50 shadow-2xl flex flex-col">
        {/* Panel header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400">Applied {fmtDate(app.created_at)}</p>
            <h2 className="text-lg font-bold text-gray-900 truncate">{app.lead_name}</h2>
            <a href={`mailto:${app.lead_email}`} className="text-[13px] text-blue-600 hover:text-blue-700">{app.lead_email}</a>
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Idea + video */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">The idea</p>
            <p className="mt-2 text-[17px] font-semibold text-gray-900 leading-snug">{app.idea_sentence}</p>
            {app.video_file && (
              <div className="mt-4">
                {media.loading ? (
                  <div className="h-48 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : media.url ? (
                  // applicants' own recordings have no caption files
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={media.url} controls playsInline preload="metadata" onLoadedMetadata={fixUnknownDuration} className="w-full max-h-[420px] rounded-lg bg-black" />
                ) : (
                  <p className="text-[13px] text-red-600">Could not load the clip. Try closing and reopening this application.</p>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {app.video_file ? (
                media.download && (
                  <a
                    href={media.download}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 text-[12px] font-semibold rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" /> Download video
                    {app.video_duration ? ` (${Math.round(app.video_duration)}s)` : ''}
                  </a>
                )
              ) : legacyLink ? (
                <a
                  href={legacyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white hover:text-white text-[13px] font-semibold rounded-lg"
                >
                  <Video className="w-4 h-4" />
                  Watch the video
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-[13px] text-red-600">No clip attached to this application.</span>
              )}
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-600">{STAGES[app.stage] || app.stage}</span>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-600">
                {app.people_spoken} people spoken to
              </span>
            </div>
          </div>

          {/* Review */}
          <div className="bg-white border-2 border-blue-100 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-bold tracking-widest text-blue-600 uppercase">Your review</h3>
              <span className="text-[13px] font-bold text-gray-900">
                {total}<span className="text-gray-400 font-normal">/{MAX_SCORE}</span>
                <span className="ml-2 text-[11px] font-normal text-gray-400">{scoredCount}/{CRITERIA.length} scored</span>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={status === s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                    status === s.value ? `${s.badge} border-transparent` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-4 divide-y divide-gray-100">
              {CRITERIA.map((c) => (
                <div key={c.key} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                    <p className="text-[11px] text-gray-400">{c.hint}</p>
                  </div>
                  <div className="flex items-center gap-1" role="radiogroup" aria-label={c.label}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = scores[c.key] === n
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={`${c.label}: ${n}`}
                          onClick={() => setScores((s) => ({ ...s, [c.key]: on ? null : n }))}
                          className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-colors ${
                            on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <label className="block mt-3">
              <span className="text-[12px] font-semibold text-gray-500">Reviewer notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What stood out, concerns, questions for the shortlist call..."
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </label>
            <div className="mt-3 flex items-center justify-end gap-2">
              {dirty && <span className="text-[11px] text-amber-600">Unsaved changes</span>}
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save review
              </button>
            </div>
          </div>

          {/* Team */}
          <Section title={`Team (${app.team_size})`}>
            <div className="divide-y divide-gray-100 -my-2">
              {app.members.map((m, i) => {
                const li = safeUrl(m.linkedin)
                const emailed = sentTo.has((m.email || '').toLowerCase())
                return (
                  <div key={m.email || i} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900">
                        {m.name} {i === 0 && <span className="ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">LEAD</span>}
                      </p>
                      <a href={`mailto:${m.email}`} className="text-[12px] text-blue-600 hover:text-blue-700 break-all">{m.email}</a>
                      <p className="text-[12px] text-gray-500">{m.country}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {li && (
                        <a href={li} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      <span
                        title={emailed ? 'Confirmation email sent' : 'Confirmation email not sent yet'}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${emailed ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {emailed ? <Mail className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {emailed ? 'Emailed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Answer q="Who does what?" a={app.roles} />
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className={`px-2.5 py-1 rounded-full font-semibold ${app.can_build ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {app.can_build ? 'Someone on the team can build' : 'No builder on the team'}
              </span>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${app.is_member ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {app.is_member ? 'Mansa-to-Mansa member' : 'Not a member yet'}
              </span>
            </div>
          </Section>

          <Section title="The problem">
            <Answer q="Who has this problem?" a={app.who_has_problem} />
            <Answer q="What do they do about it today, and why isn't that good enough?" a={app.current_alternatives} />
          </Section>

          <Section title="Evidence, and willingness to be wrong">
            <Answer q="People with this problem they have spoken to" a={String(app.people_spoken)} />
            <Answer q="One thing they said that surprised them" a={app.surprise} />
            <Answer q="What makes their team the right fit for this problem?" a={app.changed_mind} />
          </Section>

          <Section title="Ability to ship">
            <Answer
              q="Something they have built before"
              a={built ? <a href={built} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 break-all">{app.built_link}</a> : app.built_link}
            />
            {!app.can_build && <Answer q="Plan to reach a rough MVP without a builder" a={app.nontech_plan} />}
          </Section>

          <Section title="Commitment">
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className={`px-2.5 py-1 rounded-full font-semibold ${app.commit_hours ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {app.commit_hours ? '✓' : '✗'} About 8 hours a week for 5 weeks
              </span>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${app.commit_sessions ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {app.commit_sessions ? '✓' : '✗'} Weekly live sessions and demo night
              </span>
            </div>
            <Answer q="How they heard about the incubator" a={HEARD_FROM[app.heard_from] || app.heard_from} />
          </Section>
        </div>
      </div>
    </div>
  )
}

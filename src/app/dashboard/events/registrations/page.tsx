'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Calendar, Download, Search,
  GraduationCap, UserCheck, CheckCircle,
  Mail, Phone, Building, ArrowLeft, TrendingUp, UserPlus,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

interface EventRegistration {
  id: string
  event_id: string
  event_title: string
  event_date: string
  full_name: string
  email: string
  phone_number: string
  is_student: boolean
  institution_name?: string
  is_member: boolean
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
  registered_at: string
  created_at: string
}

interface EventGroup {
  event_id: string
  event_title: string
  count: number
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  attended:  'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show:   'bg-gray-100 text-gray-600',
}

export default function EventRegistrationsPage() {
  const searchParams = useSearchParams()

  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [eventGroups, setEventGroups]     = useState<EventGroup[]>([])
  const [loading, setLoading]             = useState(true)
  const [searchTerm, setSearchTerm]       = useState('')
  const [filterEvent, setFilterEvent]     = useState<string>(() => searchParams.get('eventId') || 'all')
  const [filterStatus, setFilterStatus]   = useState<string>('all')
  const [filterStudent, setFilterStudent] = useState<string>('all')
  const [filterMember, setFilterMember]   = useState<string>('all')
  const [page, setPage]                   = useState(1)
  const pageSize = 15

  // The label to show when an event filter is active from the URL
  const urlEventTitle = searchParams.get('eventTitle') ? decodeURIComponent(searchParams.get('eventTitle')!) : null

  useEffect(() => { fetchRegistrations() }, [])

  // Sync filter when URL changes (navigating between events without unmounting)
  useEffect(() => {
    const eid = searchParams.get('eventId')
    setFilterEvent(eid || 'all')
    setPage(1)
  }, [searchParams])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${apiUrl}/registrations/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      })
      if (response.ok) {
        const data = await response.json()
        const rows: EventRegistration[] = Array.isArray(data) ? data : (data.results || [])
        setRegistrations(rows)

        // build event groups
        const groups: Record<string, EventGroup> = {}
        rows.forEach((r) => {
          if (!groups[r.event_id]) groups[r.event_id] = { event_id: r.event_id, event_title: r.event_title, count: 0 }
          groups[r.event_id].count++
        })
        setEventGroups(Object.values(groups))
      } else {
        setRegistrations([])
      }
    } catch {
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = registrations.filter((r) => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      !q ||
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone_number.includes(q) ||
      r.event_title.toLowerCase().includes(q)
    const matchEvent   = filterEvent   === 'all' || String(r.event_id) === filterEvent
    const matchStatus  = filterStatus  === 'all' || r.status   === filterStatus
    const matchStudent =
      filterStudent === 'all' ||
      (filterStudent === 'student'     &&  r.is_student) ||
      (filterStudent === 'non_student' && !r.is_student)
    const matchMember =
      filterMember === 'all' ||
      (filterMember === 'member'     &&  r.is_member) ||
      (filterMember === 'non_member' && !r.is_member)
    return matchSearch && matchEvent && matchStatus && matchStudent && matchMember
  })

  const totalPages  = Math.ceil(filtered.length / pageSize)
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize)

  // stats
  const total     = registrations.length
  const confirmed = registrations.filter((r) => r.status === 'confirmed').length
  const attended  = registrations.filter((r) => r.status === 'attended').length
  const students  = registrations.filter((r) => r.is_student).length
  const members   = registrations.filter((r) => r.is_member).length

  const handleExportCSV = () => {
    const headers = ['Event', 'Date', 'Full Name', 'Email', 'Phone', 'Student', 'Institution', 'Member', 'Status', 'Registered']
    const rows = filtered.map((r) => [
      r.event_title,
      new Date(r.event_date).toLocaleDateString(),
      r.full_name,
      r.email,
      r.phone_number,
      r.is_student ? 'Yes' : 'No',
      r.institution_name || 'N/A',
      r.is_member ? 'Yes' : 'No',
      r.status,
      new Date(r.registered_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a   = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
            </Link>
          </div>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Event Management</p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Event Registrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {urlEventTitle ? <>Showing registrations for <span className="font-semibold text-gray-700">{urlEventTitle}</span></> : 'View and manage all registrations across every event.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> EXPORT CSV
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total',     value: total,     sub: 'all registrations',  icon: Users,       bg: 'bg-blue-100',   ic: 'text-blue-600' },
          { label: 'Confirmed', value: confirmed,  sub: 'awaiting event',     icon: CheckCircle, bg: 'bg-green-100',  ic: 'text-green-600' },
          { label: 'Attended',  value: attended,   sub: 'showed up',          icon: UserCheck,   bg: 'bg-blue-100',   ic: 'text-blue-600' },
          { label: 'Students',  value: students,   sub: 'student registrants',icon: GraduationCap,bg:'bg-amber-100',  ic: 'text-amber-600' },
          { label: 'Members',   value: members,    sub: 'platform members',   icon: TrendingUp,  bg: 'bg-purple-100', ic: 'text-purple-600' },
        ].map(({ label, value, sub, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── By Event breakdown ── */}
      {eventGroups.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Registrations by Event</span>
          </div>
          <div className="divide-y divide-gray-50">
            {eventGroups.map((eg) => {
              const pct = total > 0 ? Math.round((eg.count / total) * 100) : 0
              return (
                <button
                  key={eg.event_id}
                  type="button"
                  onClick={() => { setFilterEvent(eg.event_id); setPage(1) }}
                  className={`w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left ${filterEvent === eg.event_id ? 'bg-blue-50' : ''}`}
                >
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{eg.event_title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-400">{pct}%</span>
                    <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {eg.count}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {filterEvent !== 'all' && (
            <div className="px-5 py-2.5 border-t border-gray-100 bg-blue-50">
              <button
                type="button"
                onClick={() => { setFilterEvent('all'); setPage(1) }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide"
              >
                ✕ Clear event filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone or event..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            aria-label="Filter by status"
            className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          {/* Student filter */}
          <select
            value={filterStudent}
            onChange={(e) => { setFilterStudent(e.target.value); setPage(1) }}
            aria-label="Filter by student status"
            className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white"
          >
            <option value="all">All Attendees</option>
            <option value="student">Students Only</option>
            <option value="non_student">Non-Students</option>
          </select>
          {/* Member filter */}
          <select
            value={filterMember}
            onChange={(e) => { setFilterMember(e.target.value); setPage(1) }}
            aria-label="Filter by membership"
            className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white"
          >
            <option value="all">All Members</option>
            <option value="member">Platform Members</option>
            <option value="non_member">Non-Members</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
            Registrations ({filtered.length})
          </span>
          {filtered.length !== registrations.length && (
            <span className="text-[11px] text-gray-400">{registrations.length} total</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">No registrations found</p>
            {(searchTerm || filterEvent !== 'all' || filterStatus !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setFilterEvent('all'); setFilterStatus('all'); setFilterStudent('all'); setFilterMember('all') }}
                className="mt-3 text-[12px] font-bold text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Event', 'Registrant', 'Contact', 'Type', 'Status', 'Registered'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      {/* Event */}
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-gray-900 line-clamp-1">{r.event_title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>
                      {/* Registrant */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[11px] font-bold flex-shrink-0">
                            {r.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-gray-900">{r.full_name}</span>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{r.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {r.phone_number}
                        </div>
                      </td>
                      {/* Type badges */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {r.is_student && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                              <GraduationCap className="w-2.5 h-2.5" /> Student
                            </span>
                          )}
                          {r.is_member && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                              <UserCheck className="w-2.5 h-2.5" /> Member
                            </span>
                          )}
                          {r.institution_name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">
                              <Building className="w-2.5 h-2.5" /> {r.institution_name}
                            </span>
                          )}
                          {!r.is_student && !r.is_member && !r.institution_name && (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      {/* Registered at */}
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">
                        {new Date(r.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-[12px] text-gray-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[12px] text-gray-500">Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

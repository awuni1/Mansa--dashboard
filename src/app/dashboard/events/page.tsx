'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Image as ImageIcon, Upload, Trash2, Edit, ArrowRight, ArrowLeft, Users, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import api, { Event } from '@/lib/api';
import { toast } from 'sonner';

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'networking',
    date: '', start_time: '', end_time: '', location: '',
    is_virtual: false, virtual_link: '', max_attendees: '', published: false,
  });
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.getEvents();
      if (response.data) {
        const eventsData = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
        setEvents(eventsData);
      } else { setEvents([]); }
    } catch { setEvents([]); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: 'networking', date: '', start_time: '', end_time: '', location: '', is_virtual: false, virtual_link: '', max_attendees: '', published: false });
    setFlyerFile(null); setImageFiles([]); setEditingEvent(null);
  };

  const openCreate = () => { resetForm(); setShowCreateModal(true); };
  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({ title: event.title, description: event.description, category: event.category, date: event.date, start_time: event.start_time, end_time: event.end_time, location: event.location, is_virtual: event.is_virtual, virtual_link: event.virtual_link || '', max_attendees: event.max_attendees?.toString() || '', published: event.published });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'max_attendees') { if (value && String(value).trim() !== '') eventData.append(key, String(value)); }
      else if (key === 'is_virtual' || key === 'published') { eventData.append(key, value ? 'true' : 'false'); }
      else { eventData.append(key, String(value)); }
    });
    if (flyerFile) eventData.append('flyer', flyerFile);
    imageFiles.forEach((file) => eventData.append('images', file));
    try {
      const response = editingEvent ? await api.updateEvent(editingEvent.id, eventData) : await api.createEvent(eventData);
      if (response.data) {
        await fetchEvents(); resetForm(); setShowCreateModal(false);
        toast.success(`Event ${editingEvent ? 'updated' : 'created'} successfully!`);
      } else if (response.error) { toast.error(`Failed: ${response.error}`); }
    } catch { toast.error('An unexpected error occurred.'); }
  };

  const handleDelete = async (eventId: string | number) => {
    toast.warning('Delete this event?', {
      action: { label: 'Delete', onClick: async () => {
        const response = await api.deleteEvent(eventId);
        if (response.data) { await fetchEvents(); toast.success('Event deleted.'); }
        else { toast.error('Failed to delete.'); }
      }},
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const moveEvent = async (eventId: string | number, newStatus: 'upcoming' | 'past') => {
    const response = newStatus === 'past' ? await api.moveEventToPast(eventId) : await api.moveEventToUpcoming(eventId);
    if (response.data) { await fetchEvents(); toast.success(`Moved to ${newStatus}.`); }
    else { toast.error('Failed to move event.'); }
  };

  const togglePublish = async (eventId: string | number) => {
    const response = await api.toggleEventPublish(eventId);
    if (response.data) {
      await fetchEvents();
      toast.success(response.data.published ? 'Event published.' : 'Event unpublished.');
    } else { toast.error('Failed.'); }
  };

  /* ── Calendar helpers ── */
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' }).toUpperCase();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDays = new Set(
    events.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; }).map(e => new Date(e.date).getDate())
  );
  const upcomingEvents = Array.isArray(events) ? events.filter(e => e.status === 'upcoming') : [];
  const pastEvents = Array.isArray(events) ? events.filter(e => e.status === 'past') : [];
  const totalAttendees = events.reduce((s, e) => s + (e.max_attendees || 0), 0);

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Temporal Coordinates</p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Events Ecosystem</h1>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold tracking-wider rounded-lg transition-all whitespace-nowrap">
          <Plus className="h-4 w-4" /> + SCHEDULE NEW EVENT
        </button>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left panel: Live Metrics + Active Registrations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Metrics */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-4">Live Metrics</h2>
            <div className="space-y-5">
              {/* Capacity */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Total Capacity</p>
                    <p className="text-2xl font-bold text-gray-900">{totalAttendees >= 1000 ? `${(totalAttendees / 1000).toFixed(1)}K` : totalAttendees}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{events.length} events</span>
                </div>
                <div className="flex items-end gap-0.5 h-10 mt-2">
                  {(() => {
                    const vals = events.slice(-10).map(e => e.max_attendees || 0);
                    const max = Math.max(...vals, 1);
                    return vals.length > 0
                      ? vals.map((v, i) => (
                          <div key={i} className={`flex-1 rounded-sm ${i >= vals.length - 3 ? 'bg-blue-500' : 'bg-blue-100'}`} style={{ height: `${Math.max(8, Math.round(v / max * 100))}%` }} />
                        ))
                      : <div className="w-full flex items-center justify-center text-xs text-gray-300">No data</div>;
                  })()}
                </div>
              </div>
              {/* Active rate */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Upcoming Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {events.length > 0 ? `${Math.round(upcomingEvents.length / events.length * 100)}%` : '0%'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{upcomingEvents.length} upcoming</span>
                </div>
                <div className="flex items-end gap-0.5 h-10 mt-2">
                  {(() => {
                    const vals = events.slice(-10).map(e => e.status === 'upcoming' ? 100 : 30);
                    return vals.length > 0
                      ? vals.map((v, i) => (
                          <div key={i} className={`flex-1 rounded-sm ${events.slice(-10)[i]?.status === 'upcoming' ? 'bg-green-500' : 'bg-green-100'}`} style={{ height: `${v}%` }} />
                        ))
                      : <div className="w-full flex items-center justify-center text-xs text-gray-300">No data</div>;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Active Registrations */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Active Registrations</h2>
              <button type="button" onClick={() => { window.location.href = '/dashboard/events/registrations'; }} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 tracking-wider uppercase">View All Records</button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
            ) : upcomingEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming events</p>
              </div>
            ) : (
              <div>
                {upcomingEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{event.title[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                        <p className="text-[11px] text-gray-400">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      <Link href={`/dashboard/events/registrations?eventId=${event.id}&eventTitle=${encodeURIComponent(event.title)}`} title="View Registrations" className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">
                        <Users className="h-3.5 w-3.5" />
                      </Link>
                      <button type="button" onClick={() => openEdit(event)} title="Edit" className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(event.id)} title="Delete" className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-2.5 text-center">
                  <button type="button" onClick={openCreate} className="text-xs font-bold text-blue-600 hover:text-blue-700 tracking-wider uppercase">
                    + SCHEDULE NEW EVENT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Calendar + Event cards */}
        <div className="lg:col-span-3 space-y-4">
          {/* Calendar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 tracking-wider">{monthName} {year}</h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 pb-2">{d}</div>
              ))}
              {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const hasEvent = eventDays.has(day);
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                return (
                  <div key={day} className={`text-center py-1.5 text-xs font-semibold rounded-lg transition-colors ${isToday ? 'bg-blue-600 text-white' : hasEvent ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No events yet</p>
                <button type="button" onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Schedule First Event</button>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex">
                    {/* Date badge */}
                    <div className="w-16 flex-shrink-0 bg-blue-600 flex flex-col items-center justify-center text-white py-4">
                      <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-2xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {event.status?.toUpperCase()}
                            </span>
                            {event.published && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">PUBLISHED</span>}
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.start_time}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                          </div>
                        </div>
                        {/* Image */}
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {event.flyer ? (
                            <Image src={event.flyer} alt={event.title} width={64} height={48} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-300" /></div>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={() => togglePublish(event.id)} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${event.published ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                          {event.published ? 'Unpublish' : 'Publish'}
                        </button>
                        {event.status === 'upcoming' && (
                          <button type="button" onClick={() => moveEvent(event.id, 'past')} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" /> Past
                          </button>
                        )}
                        {event.status === 'past' && (
                          <button type="button" onClick={() => moveEvent(event.id, 'upcoming')} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" /> Upcoming
                          </button>
                        )}
                        <Link
                          href={`/dashboard/events/registrations?eventId=${event.id}&eventTitle=${encodeURIComponent(event.title)}`}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" /> Registrations
                        </Link>
                        <button type="button" onClick={() => openEdit(event)} className="ml-auto p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(event.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Past events summary ── */}
      {pastEvents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-3">Past Events</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pastEvents.map((event) => (
              <div key={event.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <p className="text-xs font-semibold text-gray-700 line-clamp-1">{event.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(event.date).toLocaleDateString()}</p>
                <div className="flex gap-1 mt-2">
                  <Link href={`/dashboard/events/registrations?eventId=${event.id}&eventTitle=${encodeURIComponent(event.title)}`} className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" /> Regs
                  </Link>
                  <button type="button" onClick={() => openEdit(event)} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">Edit</button>
                  <button type="button" onClick={() => moveEvent(event.id, 'upcoming')} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-0.5">
                    <ArrowLeft className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Schedule New Event'}</h2>
              <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <Label htmlFor="event-title">Event Title *</Label>
                <input id="event-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <Label htmlFor="event-description">Description *</Label>
                <Textarea id="event-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="event-category">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['networking', 'workshop', 'conference', 'webinar', 'social', 'fundraiser', 'other'].map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="event-date">Date *</Label>
                  <input id="event-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <Label htmlFor="event-start">Start *</Label>
                  <input id="event-start" type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <Label htmlFor="event-end">End *</Label>
                  <input id="event-end" type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="event-location">Location *</Label>
                <input id="event-location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Virtual, NYC" required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_virtual" checked={formData.is_virtual} onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })} className="w-4 h-4" aria-label="Virtual event" />
                <Label htmlFor="is_virtual">This is a virtual event</Label>
              </div>
              {formData.is_virtual && (
                <div>
                  <Label htmlFor="virtual_link">Virtual Link</Label>
                  <input id="virtual_link" type="url" value={formData.virtual_link} onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })} placeholder="https://zoom.us/..."
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" />
                </div>
              )}
              <div>
                <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
                <input id="max_attendees" type="number" value={formData.max_attendees} onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="Unlimited" />
              </div>
              <div>
                <Label htmlFor="flyer">Event Flyer</Label>
                <input id="flyer" type="file" accept="image/*" onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                {flyerFile && <p className="text-xs text-gray-500 mt-1">Selected: {flyerFile.name}</p>}
              </div>
              <div>
                <Label htmlFor="images">Event Photos</Label>
                <input id="images" type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                {imageFiles.length > 0 && <p className="text-xs text-gray-500 mt-1">{imageFiles.length} file(s) selected</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="published" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="w-4 h-4" aria-label="Publish event" />
                <Label htmlFor="published">Publish this event</Label>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Upload className="h-4 w-4" /> {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

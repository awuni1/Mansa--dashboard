'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Image as ImageIcon, Upload, Trash2, Eye, Edit, ArrowRight, ArrowLeft, CheckCircle, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import api, { Event } from '@/lib/api'
import { toast } from 'sonner'

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'networking',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_virtual: false,
    virtual_link: '',
    max_attendees: '',
    published: false
  })
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.getEvents()
      if (response.data) {
        // Ensure we have an array - handle both direct array and paginated response
        const eventsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).results || []
        setEvents(eventsData)
      } else if (response.error) {
        console.error('Error fetching events:', response.error)
        setEvents([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      // Handle max_attendees - convert empty string to empty value, or keep the number
      if (key === 'max_attendees') {
        if (value && String(value).trim() !== '') {
          eventData.append(key, String(value))
        }
        // Don't append if empty - let backend handle as null
      } else if (key === 'is_virtual' || key === 'published') {
        // Handle booleans - convert to proper boolean values
        eventData.append(key, value ? 'true' : 'false')
      } else {
        eventData.append(key, String(value))
      }
    })
    
    if (flyerFile) {
      eventData.append('flyer', flyerFile)
    }
    
    imageFiles.forEach((file) => {
      eventData.append('images', file)
    })

    try {
      const response = editingEvent 
        ? await api.updateEvent(editingEvent.id, eventData)
        : await api.createEvent(eventData)

      if (response.data) {
        await fetchEvents()
        resetForm()
        setActiveTab('list')
        toast.success(`Event ${editingEvent ? 'updated' : 'created'} successfully!`, {
          description: `The event "${formData.title}" has been ${editingEvent ? 'updated' : 'created'}.`
        })
      } else if (response.error) {
        console.error('Error saving event:', response.error)
        console.error('Full response:', response)
        // Check if it's an authentication error
        if (response.error.includes('Session expired') || response.error.includes('Authentication')) {
          toast.error('Session expired', {
            description: 'Your session has expired. Please log in again.'
          })
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else {
          toast.error(`Failed to ${editingEvent ? 'update' : 'create'} event`, {
            description: response.error
          })
        }
      }
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error('An unexpected error occurred', {
        description: 'Please try again or contact support if the issue persists.'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'networking',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      is_virtual: false,
      virtual_link: '',
      max_attendees: '',
      published: false
    })
    setFlyerFile(null)
    setImageFiles([])
    setEditingEvent(null)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      is_virtual: event.is_virtual,
      virtual_link: event.virtual_link || '',
      max_attendees: event.max_attendees?.toString() || '',
      published: event.published
    })
    setActiveTab('create')
  }

  const handleDelete = async (eventId: string | number) => {
    toast.warning('Are you sure you want to delete this event?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const response = await api.deleteEvent(eventId)

            if (response.data) {
              await fetchEvents()
              toast.success('Event deleted successfully')
            } else if (response.error) {
              console.error('Error deleting event:', response.error)
              toast.error('Failed to delete event', {
                description: response.error
              })
            }
          } catch (error) {
            console.error('Error deleting event:', error)
            toast.error('Failed to delete event', {
              description: 'An unexpected error occurred.'
            })
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  }

  const moveEvent = async (eventId: string | number, newStatus: 'upcoming' | 'past') => {
    try {
      const response = newStatus === 'past'
        ? await api.moveEventToPast(eventId)
        : await api.moveEventToUpcoming(eventId)

      if (response.data) {
        await fetchEvents()
        toast.success(`Event moved to ${newStatus}`)
      } else if (response.error) {
        console.error('Error moving event:', response.error)
        toast.error('Failed to move event', {
          description: response.error
        })
      }
    } catch (error) {
      console.error('Error moving event:', error)
      toast.error('Failed to move event', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const togglePublish = async (eventId: string | number) => {
    try {
      const response = await api.toggleEventPublish(eventId)

      if (response.data) {
        await fetchEvents()
        toast.success(
          response.data.published ? 'Event published' : 'Event unpublished',
          {
            description: response.data.published
              ? 'The event is now visible to the public.'
              : 'The event is now hidden from the public.'
          }
        )
      } else if (response.error) {
        console.error('Error toggling publish:', response.error)
        toast.error('Failed to toggle publish status', {
          description: response.error
        })
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
      toast.error('Failed to toggle publish status', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const filteredEvents = Array.isArray(events) ? events.filter(event => {
    if (filterStatus === 'all') return true
    return event.status === filterStatus
  }) : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Events Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage upcoming and past community events
          </p>
        </div>
        <Link href="/dashboard/events/registrations">
          <Button className="gap-2">
            <Users className="w-4 h-4" />
            View Registrations
          </Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => {
            setActiveTab('list')
            resetForm()
          }}
        >
          Events List
        </Button>
        <Button
          variant={activeTab === 'create' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('create')}
        >
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </Button>
      </div>

      {/* Events List */}
      {activeTab === 'list' && (
        <div>
          {/* Filter */}
          <div className="mb-6">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No events found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Event Flyer */}
                      <div className="flex-shrink-0">
                        <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          {event.flyer ? (
                            <Image
                              src={event.flyer}
                              alt={event.title}
                              width={192}
                              height={192}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{event.title}</h3>
                              <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                              {event.published && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Published
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline">{event.category}</Badge>
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {event.start_time} - {event.end_time}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <ImageIcon className="w-4 h-4" />
                            {event.images?.length || 0} photos
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePublish(event.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {event.published ? 'Unpublish' : 'Publish'}
                          </Button>
                          {event.status === 'upcoming' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveEvent(event.id, 'past')}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Move to Past
                            </Button>
                          )}
                          {event.status === 'past' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveEvent(event.id, 'upcoming')}
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Move to Upcoming
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Event Form */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
            <CardDescription>
              Fill in the details to {editingEvent ? 'update' : 'create'} an event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Virtual Event, NYC, London"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_virtual"
                    checked={formData.is_virtual}
                    onChange={(e) => setFormData({...formData, is_virtual: e.target.checked})}
                    className="w-4 h-4"
                    aria-label="This is a virtual event"
                  />
                  <Label htmlFor="is_virtual">This is a virtual event</Label>
                </div>

                {formData.is_virtual && (
                  <div>
                    <Label htmlFor="virtual_link">Virtual Event Link</Label>
                    <Input
                      id="virtual_link"
                      type="url"
                      value={formData.virtual_link}
                      onChange={(e) => setFormData({...formData, virtual_link: e.target.value})}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({...formData, max_attendees: e.target.value})}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Media</h3>
                
                <div>
                  <Label htmlFor="flyer">Event Flyer</Label>
                  <Input
                    id="flyer"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
                  />
                  {flyerFile && (
                    <p className="text-sm text-gray-600 mt-2">Selected: {flyerFile.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="images">Event Photos (Multiple)</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  />
                  {imageFiles.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {imageFiles.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>

              {/* Publishing */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({...formData, published: e.target.checked})}
                  className="w-4 h-4"
                  aria-label="Publish this event"
                />
                <Label htmlFor="published">Publish this event (make visible to public)</Label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button type="submit">
                  <Upload className="w-4 h-4 mr-2" />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

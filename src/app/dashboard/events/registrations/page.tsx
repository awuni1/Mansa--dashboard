'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users, Calendar, Download, Search, Filter,
  GraduationCap, UserCheck, CheckCircle, XCircle,
  Eye, Mail, Phone, Building, ArrowLeft, TrendingUp,
  FileText, UserPlus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import api from '@/lib/api'

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

interface RegistrationStats {
  total_registrations: number
  confirmed: number
  cancelled: number
  attended: number
  no_show: number
  students: number
  non_students: number
  members: number
  non_members: number
  by_event: Array<{
    event_id: string
    event_title: string
    count: number
  }>
}

export default function EventRegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [stats, setStats] = useState<RegistrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterStudent, setFilterStudent] = useState<string>('all')
  const [filterMember, setFilterMember] = useState<string>('all')

  useEffect(() => {
    fetchRegistrations()
    fetchStats()
  }, [])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      // Fetch all event registrations
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${apiUrl}/registrations/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const registrationsData = Array.isArray(data) ? data : (data.results || [])
        setRegistrations(registrationsData)
      } else {
        console.error('Failed to fetch registrations')
        setRegistrations([])
      }
    } catch (error) {
      console.error('Error fetching registrations:', error)
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Calculate stats from registrations
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${apiUrl}/registrations/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const registrationsData: EventRegistration[] = Array.isArray(data) ? data : (data.results || [])

        // Calculate statistics
        const totalRegistrations = registrationsData.length
        const confirmed = registrationsData.filter(r => r.status === 'confirmed').length
        const cancelled = registrationsData.filter(r => r.status === 'cancelled').length
        const attended = registrationsData.filter(r => r.status === 'attended').length
        const no_show = registrationsData.filter(r => r.status === 'no_show').length
        const students = registrationsData.filter(r => r.is_student).length
        const non_students = totalRegistrations - students
        const members = registrationsData.filter(r => r.is_member).length
        const non_members = totalRegistrations - members

        // Group by event
        const eventGroups = registrationsData.reduce((acc, reg) => {
          const existing = acc.find(e => e.event_id === reg.event_id)
          if (existing) {
            existing.count++
          } else {
            acc.push({
              event_id: reg.event_id,
              event_title: reg.event_title,
              count: 1
            })
          }
          return acc
        }, [] as Array<{ event_id: string; event_title: string; count: number }>)

        setStats({
          total_registrations: totalRegistrations,
          confirmed,
          cancelled,
          attended,
          no_show,
          students,
          non_students,
          members,
          non_members,
          by_event: eventGroups
        })
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch =
      reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone_number.includes(searchTerm) ||
      reg.event_title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEvent = filterEvent === 'all' || reg.event_id === filterEvent
    const matchesStatus = filterStatus === 'all' || reg.status === filterStatus
    const matchesStudent = filterStudent === 'all' ||
      (filterStudent === 'student' && reg.is_student) ||
      (filterStudent === 'non_student' && !reg.is_student)
    const matchesMember = filterMember === 'all' ||
      (filterMember === 'member' && reg.is_member) ||
      (filterMember === 'non_member' && !reg.is_member)

    return matchesSearch && matchesEvent && matchesStatus && matchesStudent && matchesMember
  })

  const handleExportCSV = () => {
    const csvData = [
      ['Event', 'Full Name', 'Email', 'Phone', 'Student', 'Institution', 'Member', 'Status', 'Registered Date'],
      ...filteredRegistrations.map(reg => [
        reg.event_title,
        reg.full_name,
        reg.email,
        reg.phone_number,
        reg.is_student ? 'Yes' : 'No',
        reg.institution_name || 'N/A',
        reg.is_member ? 'Yes' : 'No',
        reg.status,
        new Date(reg.registered_at).toLocaleDateString()
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `event-registrations-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      attended: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
    return styles[status as keyof typeof styles] || styles.confirmed
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading registrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/events">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Events
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Event Registrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and view all event registrations
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Registrations
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.total_registrations}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {stats.confirmed} confirmed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Students
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.students}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {stats.non_students} non-students
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Members
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.members}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {stats.non_members} non-members
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Attended
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.attended}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                {stats.no_show} no-shows
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registrations by Event */}
      {stats && stats.by_event.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registrations by Event</CardTitle>
            <CardDescription>Breakdown of registrations per event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_event.map((event) => (
                <div key={event.event_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {event.event_title}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {event.count} registration{event.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger>
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {stats?.by_event.map((event) => (
                  <SelectItem key={event.event_id} value={event.event_id}>
                    {event.event_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="non_student">Non-Students</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                  <SelectItem value="non_member">Non-Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Registrations ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            Showing {filteredRegistrations.length} of {registrations.length} registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No registrations found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Event
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Registrant
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Details
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {registration.event_title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(registration.event_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {registration.full_name}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3" />
                            {registration.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3" />
                            {registration.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {registration.is_student && (
                            <Badge variant="outline" className="gap-1">
                              <GraduationCap className="w-3 h-3" />
                              Student
                            </Badge>
                          )}
                          {registration.institution_name && (
                            <Badge variant="outline" className="gap-1">
                              <Building className="w-3 h-3" />
                              {registration.institution_name}
                            </Badge>
                          )}
                          {registration.is_member && (
                            <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <UserCheck className="w-3 h-3" />
                              Member
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadge(registration.status)}>
                          {registration.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(registration.registered_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

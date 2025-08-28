'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Eye,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';

interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  inviteLink: string;
  isActive: boolean;
  lastMessage?: Date;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'welcome' | 'announcement' | 'project' | 'event' | 'general';
  variables?: string[];
}

interface ScheduledMessage {
  id: string;
  content: string;
  targetGroups: string[];
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

export default function WhatsAppManagerPage() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Mock data - replace with real data from your database
  const [whatsappGroups] = useState<WhatsAppGroup[]>([
    {
      id: '1',
      name: 'Main Community',
      description: 'General discussion and announcements',
      memberCount: 1247,
      inviteLink: 'https://chat.whatsapp.com/ERMH6rdc1h52aTL6eib793',
      isActive: true,
      lastMessage: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '2',
      name: 'Tech Mentors',
      description: 'Technology mentorship and guidance',
      memberCount: 234,
      inviteLink: 'https://chat.whatsapp.com/tech-mentors-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: '3',
      name: 'Project Collaborators',
      description: 'Active project participants',
      memberCount: 156,
      inviteLink: 'https://chat.whatsapp.com/project-collab-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: '4',
      name: 'Students Hub',
      description: 'Student networking and support',
      memberCount: 567,
      inviteLink: 'https://chat.whatsapp.com/students-hub-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '5',
      name: 'Business Network',
      description: 'Business and entrepreneurship discussions',
      memberCount: 189,
      inviteLink: 'https://chat.whatsapp.com/business-network-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
      id: '6',
      name: 'Alumni Network',
      description: 'Graduated members and success stories',
      memberCount: 98,
      inviteLink: 'https://chat.whatsapp.com/alumni-network-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    }
  ]);

  const [messageTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Welcome New Members',
      content: '🎉 Welcome to Mansa-to-Mansa! We&apos;re excited to have you join our growing community of students and professionals. Feel free to introduce yourself and let us know what brings you here!',
      category: 'welcome'
    },
    {
      id: '2',
      name: 'New Project Announcement',
      content: '🚀 New Project Alert! We&apos;re launching a new project: {{PROJECT_NAME}}. This is a great opportunity to collaborate and build something amazing together. Applications are now open!',
      category: 'project',
      variables: ['PROJECT_NAME']
    },
    {
      id: '3',
      name: 'Event Reminder',
      content: '📅 Reminder: Don&apos;t forget about our upcoming {{EVENT_NAME}} on {{DATE}} at {{TIME}}. Looking forward to seeing everyone there!',
      category: 'event',
      variables: ['EVENT_NAME', 'DATE', 'TIME']
    },
    {
      id: '4',
      name: 'Weekly Update',
      content: '📊 Weekly Community Update:\\n\\n• New members this week: {{NEW_MEMBERS}}\\n• Active projects: {{ACTIVE_PROJECTS}}\\n• Upcoming events: {{UPCOMING_EVENTS}}\\n\\nKeep up the great work, Mansas!',
      category: 'announcement',
      variables: ['NEW_MEMBERS', 'ACTIVE_PROJECTS', 'UPCOMING_EVENTS']
    }
  ]);

  const [scheduledMessages] = useState<ScheduledMessage[]>([
    {
      id: '1',
      content: 'Monthly newsletter reminder - check your emails!',
      targetGroups: ['1', '2'],
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending',
      createdAt: new Date()
    }
  ]);

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === whatsappGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(whatsappGroups.map(group => group.id));
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessageContent(template.content);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || selectedGroups.length === 0) {
      alert('Please select groups and enter a message');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call - replace with actual WhatsApp Business API integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isScheduled && scheduleDate && scheduleTime) {
        // Handle scheduled message
        console.log('Scheduling message for:', new Date(`${scheduleDate}T${scheduleTime}`));
        alert(`Message scheduled for ${scheduleDate} at ${scheduleTime}`);
      } else {
        // Send immediately
        console.log('Sending message to groups:', selectedGroups);
        alert('Message sent successfully!');
      }
      
      // Reset form
      setMessageContent('');
      setSelectedGroups([]);
      setSelectedTemplate('');
      setIsScheduled(false);
      setScheduleDate('');
      setScheduleTime('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Manager</h1>
          <p className="text-gray-600 mt-1">
            Send messages to your WhatsApp community groups
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">{whatsappGroups.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {whatsappGroups.reduce((sum, group) => sum + group.memberCount, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <Send className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledMessages.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Composer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Compose Message</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {messageTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelection(template.id)}
                      className={`p-2 text-left text-sm rounded border ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {messageContent.length}/1000 characters
                </p>
              </div>

              {/* Scheduling Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Schedule message</span>
                </label>
                
                {isScheduled && (
                  <>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !messageContent.trim() || selectedGroups.length === 0}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isScheduled ? 'Schedule' : 'Send'} Message</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Message Preview */}
              {showPreview && messageContent && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Message Preview:</h4>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {messageContent}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Sending to: {selectedGroups.length} group(s)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Group Selection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Select Groups</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllGroups}
                >
                  {selectedGroups.length === whatsappGroups.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {whatsappGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroups.includes(group.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGroupSelection(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {group.memberCount.toLocaleString()} members
                          </span>
                          <span className="text-xs text-gray-500">
                            {group.lastMessage && formatLastMessageTime(group.lastMessage)}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => handleGroupSelection(group.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scheduled Messages */}
      {scheduledMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Scheduled Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledMessages.map((message) => (
                <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 truncate max-w-md">
                      {message.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Scheduled for: {message.scheduledTime.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      message.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : message.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {message.status}
                    </span>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Settings,
  Copy,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  inviteLink: string;
  isActive: boolean;
  lastMessage?: Date;
  createdAt: Date;
}

export default function WhatsAppGroupsPage() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([
    {
      id: '1',
      name: 'Main Community',
      description: 'General discussion and announcements for all Mansa-to-Mansa members',
      memberCount: 1247,
      inviteLink: 'https://chat.whatsapp.com/ERMH6rdc1h52aTL6eib793',
      isActive: true,
      lastMessage: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Tech Mentors',
      description: 'Technology mentorship and guidance for students and professionals',
      memberCount: 234,
      inviteLink: 'https://chat.whatsapp.com/tech-mentors-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Project Collaborators',
      description: 'Active project participants working on current initiatives',
      memberCount: 156,
      inviteLink: 'https://chat.whatsapp.com/project-collab-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdAt: new Date('2024-02-01')
    },
    {
      id: '4',
      name: 'Students Hub',
      description: 'Student networking, support, and academic discussions',
      memberCount: 567,
      inviteLink: 'https://chat.whatsapp.com/students-hub-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date('2024-01-25')
    },
    {
      id: '5',
      name: 'Business Network',
      description: 'Business and entrepreneurship discussions for professionals',
      memberCount: 189,
      inviteLink: 'https://chat.whatsapp.com/business-network-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 6 * 60 * 60 * 1000),
      createdAt: new Date('2024-02-10')
    },
    {
      id: '6',
      name: 'Alumni Network',
      description: 'Graduated members sharing success stories and career updates',
      memberCount: 98,
      inviteLink: 'https://chat.whatsapp.com/alumni-network-link',
      isActive: true,
      lastMessage: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date('2024-02-15')
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inviteLink: ''
  });

  const handleAddGroup = () => {
    if (!formData.name || !formData.description || !formData.inviteLink) {
      alert('Please fill in all fields');
      return;
    }

    const newGroup: WhatsAppGroup = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      memberCount: 0,
      inviteLink: formData.inviteLink,
      isActive: true,
      createdAt: new Date()
    };

    setGroups([...groups, newGroup]);
    setFormData({ name: '', description: '', inviteLink: '' });
    setShowAddForm(false);
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        inviteLink: group.inviteLink
      });
      setEditingGroup(groupId);
    }
  };

  const handleUpdateGroup = () => {
    if (!formData.name || !formData.description || !formData.inviteLink) {
      alert('Please fill in all fields');
      return;
    }

    setGroups(groups.map(group => 
      group.id === editingGroup 
        ? { ...group, name: formData.name, description: formData.description, inviteLink: formData.inviteLink }
        : group
    ));
    
    setFormData({ name: '', description: '', inviteLink: '' });
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      setGroups(groups.filter(group => group.id !== groupId));
    }
  };

  const handleToggleStatus = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, isActive: !group.isActive }
        : group
    ));
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
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
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage your WhatsApp community groups and invite links
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Group</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.reduce((sum, group) => sum + group.memberCount, 0).toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Active Groups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.filter(group => group.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Group Form */}
      {(showAddForm || editingGroup) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingGroup ? 'Edit Group' : 'Add New Group'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Invite Link
                </label>
                <Input
                  value={formData.inviteLink}
                  onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter group description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGroup(null);
                  setFormData({ name: '', description: '', inviteLink: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingGroup ? handleUpdateGroup : handleAddGroup}>
                {editingGroup ? 'Update Group' : 'Add Group'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 gap-6">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{group.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Members:</span>
                      <span className="ml-1 font-medium">{group.memberCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Message:</span>
                      <span className="ml-1 font-medium">
                        {group.lastMessage ? formatLastMessageTime(group.lastMessage) : 'No messages'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-1 font-medium">{group.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Invite Link:</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(group.inviteLink)}
                          className="flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(group.inviteLink, '_blank')}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(group.id)}
                    className="flex items-center space-x-1"
                  >
                    {group.isActive ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Activate</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGroup(group.id)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
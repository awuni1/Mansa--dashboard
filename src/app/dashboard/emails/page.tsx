'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, EmailTemplate, EmailCampaign, EmailLog, Member } from '@/lib/api';
import { Mail, Users, Send, Loader, Plus, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Edit3, Target, BarChart3, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'compose' | 'templates' | 'campaigns' | 'logs';

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('compose');
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    template_type: 'campaign',
    subject: '',
    html_content: '',
    text_content: '',
  });
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadMembers();
    if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'logs') {
      loadEmailLogs();
    }
  }, [activeTab]);

  const loadTemplates = async () => {
    const { data, error } = await api.getEmailTemplates();
    if (data && !error) {
      setTemplates(data.results);
    }
  };

  const loadMembers = async () => {
    let allMembers: Member[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await api.getPlatformMembers({ page });
      if (data && !error) {
        allMembers = [...allMembers, ...data.results];
        hasMore = data.next !== null;
        page++;
      } else {
        hasMore = false;
      }
    }
    setMembers(allMembers);
  };

  const loadCampaigns = async () => {
    const { data, error } = await api.getEmailCampaigns();
    if (data && !error) {
      setCampaigns(data.results);
    }
  };

  const loadEmailLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await api.getEmailLogs({ page: 1 });
    if (data && !error) {
      setEmailLogs(data.results);
    }
    setLogsLoading(false);
  };

  const getRecipientCount = () => {
    if (recipients === 'custom') {
      return customEmails.split(',').filter(e => e.trim()).length;
    }
    if (recipients === 'individual') {
      return selectedMemberIds.length;
    }
    return members.length;
  };

  const sendEmails = async () => {
    setSending(true);
    try {
      if (!selectedTemplate) {
        toast.error('Please select a template');
        setSending(false);
        return;
      }

      if (recipients === 'individual' && selectedMemberIds.length === 0) {
        toast.error('Please select at least one member');
        setSending(false);
        return;
      }

      const campaignData: any = {
        name: `Campaign - ${new Date().toISOString()}`,
        template: selectedTemplate.id,
        target_all_users: false,
        target_approved_users: false,
        target_pending_users: false,
        target_all_members: recipients === 'all_members',
        specific_member_emails: recipients === 'custom' 
          ? customEmails 
          : recipients === 'individual' 
            ? members.filter(m => selectedMemberIds.includes(m.id)).map(m => m.email).join(',')
            : '',
      };

      if (isScheduled && scheduledAt) {
        campaignData.scheduled_at = new Date(scheduledAt).toISOString();
      }

      const { data: campaign, error: campaignError } = await api.createEmailCampaign(campaignData);

      if (campaignError || !campaign) {
        toast.error('Failed to create campaign', { description: campaignError || 'Unknown error' });
        setSending(false);
        return;
      }

      if (isScheduled) {
        toast.success('Campaign scheduled successfully!', {
          description: `Will be sent on ${new Date(scheduledAt).toLocaleString()}`
        });
      } else {
        const { data: sentCampaign, error: sendError } = await api.sendEmailCampaign(campaign.id);
        if (sendError) {
          toast.error('Failed to send campaign', { description: sendError });
        } else {
          toast.success('Campaign sent successfully!', {
            description: `Sent to ${getRecipientCount()} recipient(s)`
          });
          loadCampaigns();
        }
      }

      if (recipients === 'individual') {
        setSelectedMemberIds([]);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Error occurred while sending emails');
    } finally {
      setSending(false);
    }
  };

  const createTemplate = async () => {
    const { data, error } = await api.createEmailTemplate(templateForm);
    if (error) {
      toast.error('Failed to create template', { description: error });
      return;
    }
    toast.success('Template created successfully!');
    setShowTemplateModal(false);
    loadTemplates();
    resetTemplateForm();
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    const { data, error } = await api.updateEmailTemplate(editingTemplate.id, templateForm);
    if (error) {
      toast.error('Failed to update template', { description: error });
      return;
    }
    toast.success('Template updated successfully!');
    setShowTemplateModal(false);
    setEditingTemplate(null);
    loadTemplates();
    resetTemplateForm();
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    const { error } = await api.deleteEmailTemplate(id);
    if (error) {
      toast.error('Failed to delete template', { description: error });
      return;
    }
    toast.success('Template deleted successfully!');
    loadTemplates();
  };

  const sendCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    const { error } = await api.sendEmailCampaign(id);
    if (error) {
      toast.error('Failed to send campaign', { description: error });
      return;
    }
    toast.success('Campaign sent successfully!');
    loadCampaigns();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    const { error } = await api.deleteEmailCampaign(id);
    if (error) {
      toast.error('Failed to delete campaign', { description: error });
      return;
    }
    toast.success('Campaign deleted successfully!');
    loadCampaigns();
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      template_type: 'campaign',
      subject: '',
      html_content: '',
      text_content: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-700 bg-green-50 border-green-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'sending': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'scheduled': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'queued': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'sending': return <Loader className="h-4 w-4 animate-spin" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
            </div>
            <p className="text-gray-600">Create, schedule, and track email campaigns</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
              <div className="text-sm text-gray-600">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{members.length}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card className="border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'compose', label: 'Compose', icon: Edit3 },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'campaigns', label: 'Campaigns', icon: Send },
              { id: 'logs', label: 'Activity Logs', icon: BarChart3 }
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                  Compose Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Template Selection */}
                <div>
                  <label htmlFor="email-template-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template *
                  </label>
                  <select
                    id="email-template-select"
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === parseInt(e.target.value));
                      setSelectedTemplate(template || null);
                      if (template) {
                        setSubject(template.subject);
                        setBody(template.text_content || template.html_content);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.template_type})
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No templates available. Create one in the Templates tab first.
                    </p>
                  )}
                </div>

                {/* Recipients */}
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-3">
                    Recipients *
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: 'all_members', label: 'All Community Members', count: members.length },
                      { value: 'individual', label: 'Select Individual Members', count: selectedMemberIds.length },
                      { value: 'custom', label: 'Custom Email Addresses', count: customEmails.split(',').filter(e => e.trim()).length }
                    ].map((option) => (
                      <label 
                        key={option.value}
                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border-2 transition-all ${
                          recipients === option.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        htmlFor={`recipient-${option.value}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            id={`recipient-${option.value}`}
                            type="radio"
                            name="recipients"
                            value={option.value}
                            checked={recipients === option.value}
                            onChange={(e) => setRecipients(e.target.value as any)}
                            className="w-4 h-4 text-indigo-600"
                            aria-label={option.label}
                          />
                          <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">
                          {option.count} recipients
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Individual Member Selection */}
                  {recipients === 'individual' && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Select Members ({selectedMemberIds.length} selected)
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberIds(members.map(m => m.id))}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded border border-indigo-200 hover:bg-indigo-50"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMemberIds([])}
                            className="text-xs font-medium text-gray-600 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {members.map((member) => (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                              selectedMemberIds.includes(member.id)
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            htmlFor={`member-${member.id}`}
                          >
                            <input
                              id={`member-${member.id}`}
                              type="checkbox"
                              checked={selectedMemberIds.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMemberIds([...selectedMemberIds, member.id]);
                                } else {
                                  setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded"
                              aria-label={`Select ${member.name}`}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Emails */}
                  {recipients === 'custom' && (
                    <div className="mt-4">
                      <label htmlFor="custom-emails-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Addresses (comma-separated)
                      </label>
                      <textarea
                        id="custom-emails-textarea"
                        value={customEmails}
                        onChange={(e) => setCustomEmails(e.target.value)}
                        rows={4}
                        placeholder="email1@example.com, email2@example.com, email3@example.com"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <div>
                  <label htmlFor="schedule-checkbox" className="flex items-center gap-2 mb-3">
                    <input
                      id="schedule-checkbox"
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                      aria-label="Schedule email for later"
                    />
                    <span className="text-sm font-medium text-gray-700">Schedule for later</span>
                  </label>
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      aria-label="Schedule date and time"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                </div>

                {/* Subject Line */}
                <div>
                  <label htmlFor="email-subject-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line *
                  </label>
                  <Input
                    id="email-subject-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject or select a template"
                    className="bg-white border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label htmlFor="email-body-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content *
                  </label>
                  <textarea
                    id="email-body-textarea"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white font-mono text-sm resize-y focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Enter your email content or select a template to start"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setSubject('');
                      setBody('');
                      setScheduledAt('');
                      setIsScheduled(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={sendEmails}
                    loading={sending}
                    disabled={!selectedTemplate || sending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {sending ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        {isScheduled ? 'Scheduling...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        {isScheduled ? <Calendar className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        {isScheduled ? 'Schedule Campaign' : 'Send Now'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">{getRecipientCount()}</div>
                  <p className="text-sm text-gray-600">Total Recipients</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Templates</span>
                    <span className="font-semibold text-gray-900">{templates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Campaigns</span>
                    <span className="font-semibold text-gray-900">{campaigns.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Community Members</span>
                    <span className="font-semibold text-gray-900">{members.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-indigo-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Best Practices</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Test your template before sending</li>
                      <li>• Review recipient count carefully</li>
                      <li>• Schedule campaigns during business hours</li>
                      <li>• Track engagement in Activity Logs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Email Templates
              </CardTitle>
              <Button
                onClick={() => {
                  resetTemplateForm();
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                          {template.template_type}
                        </span>
                      </div>
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Subject:</strong> {template.subject}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateForm({
                            name: template.name,
                            template_type: template.template_type,
                            subject: template.subject,
                            html_content: template.html_content,
                            text_content: template.text_content || '',
                          });
                          setShowTemplateModal(true);
                        }}
                        className="flex-1"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
                <p className="text-gray-600 mb-4">Create your first email template to get started.</p>
                <Button
                  onClick={() => {
                    resetTemplateForm();
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Email Campaigns
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                          {campaign.sent_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Sent {new Date(campaign.sent_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => sendCampaign(campaign.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Send
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
                <p className="text-gray-600">Campaigns will appear here once you start sending emails.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Activity Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {logsLoading ? (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-3" />
                <p className="text-gray-600">Loading activity logs...</p>
              </div>
            ) : emailLogs.length > 0 ? (
              <div className="space-y-3">
                {emailLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <h4 className="font-medium text-gray-900">{log.subject}</h4>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 ml-7">
                          {log.sent_at ? (
                            <span>Sent: {new Date(log.sent_at).toLocaleString()}</span>
                          ) : (
                            <span>Created: {new Date(log.created_at).toLocaleString()}</span>
                          )}
                        </div>
                        {log.error_message && (
                          <div className="mt-2 ml-7 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                <p className="text-gray-600">Email activity logs will appear here once you start sending campaigns.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close template modal"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label htmlFor="template-name-input" className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                <Input
                  id="template-name-input"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div>
                <label htmlFor="template-type-select" className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  id="template-type-select"
                  value={templateForm.template_type}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  aria-label="Template type"
                >
                  <option value="welcome">Welcome</option>
                  <option value="approval">Approval</option>
                  <option value="denial">Denial</option>
                  <option value="campaign">Campaign</option>
                  <option value="notification">Notification</option>
                </select>
              </div>

              <div>
                <label htmlFor="template-subject-input" className="block text-sm font-medium text-gray-700 mb-2">Subject Line *</label>
                <Input
                  id="template-subject-input"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="e.g., Welcome to our community!"
                />
              </div>

              <div>
                <label htmlFor="template-text-content" className="block text-sm font-medium text-gray-700 mb-2">Email Message *</label>
                <textarea
                  id="template-text-content"
                  value={templateForm.text_content}
                  onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })}
                  rows={10}
                  placeholder="Write your email message here... (No coding needed - just type your message)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  💡 Tip: Write naturally. You can use &#123;&#123;name&#125;&#125; to personalize with recipient&apos;s name
                </p>
              </div>

              <div>
                <label htmlFor="template-html-content" className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content (Optional - for advanced users)
                </label>
                <textarea
                  id="template-html-content"
                  value={templateForm.html_content}
                  onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                  rows={6}
                  placeholder="Leave empty to use plain text above, or add custom HTML formatting..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingTemplate ? updateTemplate : createTemplate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

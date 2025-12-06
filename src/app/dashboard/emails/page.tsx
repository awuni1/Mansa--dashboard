'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, EmailTemplate, EmailCampaign, EmailLog, Member } from '@/lib/api';
import { Mail, Users, Send, Loader, Plus, Eye, Trash2, FileText } from 'lucide-react';

type TabType = 'compose' | 'templates' | 'campaigns' | 'logs';

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('compose');

  // Compose state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<'all_users' | 'approved_users' | 'pending_users' | 'custom'>('all_users');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [sending, setSending] = useState(false);

  // Templates state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    template_type: 'campaign',
    subject: '',
    html_content: '',
    text_content: '',
  });

  // Campaigns state
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template: 0,
    target_all_users: true,
    target_approved_users: false,
    target_pending_users: false,
  });

  // Logs state
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
    const { data, error } = await api.getPlatformMembers();
    if (data && !error) {
      setMembers(data.results);
    }
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
    return members.length;
  };

  const sendEmails = async () => {
    setSending(true);

    try {
      // Using the backend API to send emails via campaigns
      if (!selectedTemplate) {
        alert('Please select a template');
        setSending(false);
        return;
      }

      // Create a campaign
      const campaignData = {
        name: `Campaign - ${new Date().toISOString()}`,
        template: selectedTemplate.id,
        target_all_users: recipients === 'all_users',
        target_approved_users: recipients === 'approved_users',
        target_pending_users: recipients === 'pending_users',
        specific_users: [],
      };

      const { data: campaign, error: campaignError } = await api.createEmailCampaign(campaignData);

      if (campaignError || !campaign) {
        alert(`Failed to create campaign: ${campaignError}`);
        setSending(false);
        return;
      }

      // Send the campaign
      const { data: sentCampaign, error: sendError } = await api.sendEmailCampaign(campaign.id);

      if (sendError) {
        alert(`Failed to send campaign: ${sendError}`);
      } else {
        alert(`Campaign sent successfully!`);
        loadCampaigns();
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert(`Error occurred while sending emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const createTemplate = async () => {
    const { data, error } = await api.createEmailTemplate(templateForm);
    if (error) {
      alert(`Failed to create template: ${error}`);
      return;
    }
    alert('Template created successfully!');
    setShowTemplateModal(false);
    loadTemplates();
    resetTemplateForm();
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    const { data, error } = await api.updateEmailTemplate(editingTemplate.id, templateForm);
    if (error) {
      alert(`Failed to update template: ${error}`);
      return;
    }
    alert('Template updated successfully!');
    setShowTemplateModal(false);
    setEditingTemplate(null);
    loadTemplates();
    resetTemplateForm();
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    const { error } = await api.deleteEmailTemplate(id);
    if (error) {
      alert(`Failed to delete template: ${error}`);
      return;
    }
    alert('Template deleted successfully!');
    loadTemplates();
  };

  const createCampaign = async () => {
    const { data, error } = await api.createEmailCampaign(campaignForm);
    if (error) {
      alert(`Failed to create campaign: ${error}`);
      return;
    }
    alert('Campaign created successfully!');
    setShowCampaignModal(false);
    loadCampaigns();
    resetCampaignForm();
  };

  const sendCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    const { error } = await api.sendEmailCampaign(id);
    if (error) {
      alert(`Failed to send campaign: ${error}`);
      return;
    }
    alert('Campaign sent successfully!');
    loadCampaigns();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    const { error } = await api.deleteEmailCampaign(id);
    if (error) {
      alert(`Failed to delete campaign: ${error}`);
      return;
    }
    alert('Campaign deleted successfully!');
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

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      template: 0,
      target_all_users: true,
      target_approved_users: false,
      target_pending_users: false,
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'sending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'sent':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'queued':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'bounced':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'opened':
        return `${baseClasses} bg-teal-100 text-teal-800`;
      case 'clicked':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
        <p className="mt-2 text-gray-600">Manage email templates, campaigns, and logs</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('compose')}
            className={`${
              activeTab === 'compose'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Mail className="inline h-4 w-4 mr-2" />
            Compose
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`${
              activeTab === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`${
              activeTab === 'campaigns'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Send className="inline h-4 w-4 mr-2" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`${
              activeTab === 'logs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Eye className="inline h-4 w-4 mr-2" />
            Logs
          </button>
        </nav>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compose Email Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === parseInt(e.target.value));
                      setSelectedTemplate(template || null);
                      if (template) {
                        setSubject(template.subject);
                        setBody(template.text_content || template.html_content);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.template_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipients"
                        value="all_users"
                        checked={recipients === 'all_users'}
                        onChange={(e) => setRecipients(e.target.value as any)}
                        className="mr-2"
                      />
                      All Users
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipients"
                        value="approved_users"
                        checked={recipients === 'approved_users'}
                        onChange={(e) => setRecipients(e.target.value as any)}
                        className="mr-2"
                      />
                      Approved Users Only
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipients"
                        value="pending_users"
                        checked={recipients === 'pending_users'}
                        onChange={(e) => setRecipients(e.target.value as any)}
                        className="mr-2"
                      />
                      Pending Users Only
                    </label>
                  </div>
                </div>

                <Input
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  disabled
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body Preview
                  </label>
                  <textarea
                    value={body}
                    readOnly
                    rows={12}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    placeholder="Select a template to preview..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={sendEmails}
                    loading={sending}
                    disabled={!selectedTemplate}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Templates</span>
                  <span className="font-medium">{templates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Platform Members</span>
                  <span className="font-medium">{members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Campaigns</span>
                  <span className="font-medium">{campaigns.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Email Templates</CardTitle>
              <Button
                onClick={() => {
                  resetTemplateForm();
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{template.name}</h3>
                      <p className="text-sm text-gray-600">Type: {template.template_type}</p>
                      <p className="text-sm text-gray-600">Subject: {template.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
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
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No templates found. Create your first template to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Email Campaigns</CardTitle>
              <Button
                onClick={() => {
                  resetCampaignForm();
                  setShowCampaignModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">Template ID: {campaign.template}</p>
                      <span className={getStatusBadge(campaign.status)}>{campaign.status}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                      {campaign.sent_at && (
                        <p className="text-xs text-gray-500">
                          Sent: {new Date(campaign.sent_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => sendCampaign(campaign.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No campaigns found. Create your first campaign to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8">
                <Loader className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                {emailLogs.map(log => (
                  <div key={log.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{log.subject}</p>
                        <p className="text-sm text-gray-600">Recipient ID: {log.recipient}</p>
                        <span className={getStatusBadge(log.status)}>{log.status}</span>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Sent: {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</p>
                        {log.opened_at && <p>Opened: {new Date(log.opened_at).toLocaleString()}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {emailLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No email logs found.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <div className="space-y-4">
                <Input
                  label="Template Name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={templateForm.template_type}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="approval">Approval</option>
                    <option value="denial">Denial</option>
                    <option value="project_approval">Project Approval</option>
                    <option value="campaign">Campaign</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HTML Content</label>
                  <textarea
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Content (optional)</label>
                  <textarea
                    value={templateForm.text_content}
                    onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })}
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? updateTemplate : createTemplate}>
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
              <div className="space-y-4">
                <Input
                  label="Campaign Name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={campaignForm.template}
                    onChange={(e) => setCampaignForm({ ...campaignForm, template: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_all_users}
                      onChange={(e) => setCampaignForm({ ...campaignForm, target_all_users: e.target.checked })}
                      className="mr-2"
                    />
                    Target All Users
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_approved_users}
                      onChange={(e) => setCampaignForm({ ...campaignForm, target_approved_users: e.target.checked })}
                      className="mr-2"
                    />
                    Target Approved Users Only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_pending_users}
                      onChange={(e) => setCampaignForm({ ...campaignForm, target_pending_users: e.target.checked })}
                      className="mr-2"
                    />
                    Target Pending Users Only
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCampaignModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createCampaign}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

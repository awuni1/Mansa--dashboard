'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, EmailTemplate, EmailCampaign, EmailLog, Member } from '@/lib/api';
import { Mail, Users, Send, Loader, Plus, Eye, Trash2, FileText, TrendingUp, Zap, Clock, CheckCircle, XCircle, AlertCircle, Edit3, Sparkles, Target, BarChart3, X } from 'lucide-react';

type TabType = 'compose' | 'templates' | 'campaigns' | 'logs';

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('compose');

  // Compose state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<'all_users' | 'approved_users' | 'pending_users' | 'individual' | 'custom'>('all_users');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
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
    // Fetch all members with pagination
    let allMembers: Member[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await api.getPlatformMembers({ page });
      if (data && !error) {
        allMembers = [...allMembers, ...data.results];
        // Check if there are more pages
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

      // Validate individual selection
      if (recipients === 'individual' && selectedMemberIds.length === 0) {
        alert('Please select at least one member');
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
        specific_users: recipients === 'individual' ? selectedMemberIds.map(id => parseInt(id)) : [],
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
        const recipientCount = recipients === 'individual' 
          ? selectedMemberIds.length 
          : recipients === 'all_users'
          ? members.length
          : recipients === 'approved_users'
          ? members.filter(m => (m as any).approval_status === 'approved').length
          : members.filter(m => (m as any).approval_status === 'pending').length;
        
        alert(`Campaign sent successfully to ${recipientCount} recipient(s)!`);
        loadCampaigns();
        
        // Reset individual selection
        if (recipients === 'individual') {
          setSelectedMemberIds([]);
        }
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
    const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border-2';
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-300`;
      case 'scheduled':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300`;
      case 'sending':
        return `${baseClasses} bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300`;
      case 'sent':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300`;
      case 'failed':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300`;
      case 'queued':
        return `${baseClasses} bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-300`;
      case 'bounced':
        return `${baseClasses} bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-300`;
      case 'opened':
        return `${baseClasses} bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-teal-300`;
      case 'clicked':
        return `${baseClasses} bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-300`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5" />;
      case 'sending': return <Clock className="h-3.5 w-3.5 animate-spin" />;
      case 'queued': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'opened': return <Eye className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Ultra-Professional Hero Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-4 sm:p-5 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl ring-2 ring-white/30">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
                  Email Command Center
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-purple-100 text-sm sm:text-base mt-1">Professional email campaigns & templates at your fingertips</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-white/30">
                <div className="text-white/90 text-xs font-medium">Templates</div>
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-1.5">
                  {templates.length}
                  <FileText className="h-4 w-4 text-blue-300" />
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-white/30">
                <div className="text-white/90 text-xs font-medium">Campaigns</div>
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-1.5">
                  {campaigns.length}
                  <Send className="h-4 w-4 text-green-300" />
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-white/30 col-span-2 lg:col-span-1">
                <div className="text-white/90 text-xs font-medium">Recipients</div>
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-1.5">
                  {members.length}
                  <Users className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <Card className="border-2 border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b-2 border-gray-200">
          <nav className="flex overflow-x-auto">
            {[
              { id: 'compose', label: 'Compose', icon: Edit3, color: 'indigo' },
              { id: 'templates', label: 'Templates', icon: FileText, color: 'purple' },
              { id: 'campaigns', label: 'Campaigns', icon: Send, color: 'blue' },
              { id: 'logs', label: 'Logs', icon: BarChart3, color: 'green' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all duration-300 flex items-center justify-center gap-3 relative ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-700 text-white shadow-lg scale-105 z-10`
                    : 'text-gray-600 hover:bg-white hover:text-indigo-600 hover:scale-102'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Compose Tab - Ultra Professional */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-2 border-indigo-100 shadow-2xl hover:shadow-3xl transition-all">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                  Compose Campaign
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Template Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                  <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
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
                    className="w-full border-2 border-indigo-300 rounded-xl px-4 py-3 text-base font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    aria-label="Select email template"
                    title="Choose a template for your email"
                  >
                    <option value="">🎨 Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        📧 {template.name} ({template.template_type})
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="mt-2 text-sm text-blue-600 font-medium">
                      💡 No templates available. Create one in the Templates tab first!
                    </p>
                  )}
                </div>

                {/* Recipients Selection */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  <label className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Target Audience
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'all_users', label: 'All Platform Users', icon: '👥', count: members.length },
                      { value: 'approved_users', label: 'Approved Members Only', icon: '✅', count: members.filter(m => (m as any).approval_status === 'approved').length },
                      { value: 'pending_users', label: 'Pending Users', icon: '⏳', count: members.filter(m => (m as any).approval_status === 'pending').length },
                      { value: 'individual', label: 'Select Individual Members', icon: '👤', count: selectedMemberIds.length }
                    ].map((option) => (
                      <label 
                        key={option.value}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                          recipients === option.value
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700 shadow-lg scale-105'
                            : 'bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipients"
                          value={option.value}
                          checked={recipients === option.value}
                          onChange={(e) => setRecipients(e.target.value as any)}
                          className="w-5 h-5"
                        />
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <span className="font-bold text-base">{option.label}</span>
                          <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold ${
                            recipients === option.value 
                              ? 'bg-white/20 text-white' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {option.count} recipients
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Individual Member Selection */}
                  {recipients === 'individual' && (
                    <div className="mt-4 border-2 border-purple-300 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-gray-700">
                          Select Members ({selectedMemberIds.length} selected)
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedMemberIds(members.map(m => m.id))}
                            className="text-xs font-medium text-purple-600 hover:text-purple-700 px-2 py-1 rounded border border-purple-300 hover:bg-purple-50"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedMemberIds([])}
                            className="text-xs font-medium text-gray-600 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded p-2">
                        {members.map((member) => (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                              selectedMemberIds.includes(member.id)
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMemberIds.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMemberIds([...selectedMemberIds, member.id]);
                                } else {
                                  setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {member.name}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              (member as any).approval_status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : (member as any).approval_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {(member as any).approval_status}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject Preview */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    Subject Line
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    disabled
                    className="text-base py-3 bg-gray-50 border-2"
                  />
                </div>

                {/* Body Preview */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Email Body Preview
                  </label>
                  <div className="relative">
                    <textarea
                      value={body}
                      readOnly
                      rows={8}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 font-mono text-sm resize-none"
                      placeholder="📝 Select a template to preview content..."
                      title="Email body preview"
                    />
                    {body && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-300">
                          ✓ Ready to send
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setSubject('');
                      setBody('');
                    }}
                    className="px-6"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={sendEmails}
                    loading={sending}
                    disabled={!selectedTemplate || sending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    {sending ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Sending Campaign...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Send Campaign Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <Card className="border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { label: 'Total Templates', value: templates.length, icon: FileText, color: 'purple' },
                  { label: 'Platform Members', value: members.length, icon: Users, color: 'blue' },
                  { label: 'Total Campaigns', value: campaigns.length, icon: Send, color: 'indigo' },
                  { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length, icon: Clock, color: 'yellow' }
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-${stat.color}-50 to-${stat.color}-100 border-2 border-${stat.color}-200 hover:scale-105 transition-transform`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${stat.color}-600 rounded-lg`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{stat.label}</span>
                    </div>
                    <span className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recipient Calculator */}
            <Card className="border-2 border-indigo-100 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Reach Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {getRecipientCount()}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mt-2">Recipients will receive this campaign</p>
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-indigo-700 font-medium">
                      💡 Make sure your template is ready before sending!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Templates Tab - Ultra Professional */}
      {activeTab === 'templates' && (
        <Card className="border-2 border-purple-100 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Email Templates Library
              </CardTitle>
              <Button
                onClick={() => {
                  resetTemplateForm();
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template, index) => (
                  <div 
                    key={template.id} 
                    className="border-2 border-purple-100 rounded-lg p-4 bg-gradient-to-br from-white to-purple-50 hover:shadow-2xl transition-all duration-300 hover:scale-102 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 group-hover:text-purple-600 transition-colors">
                            {template.name}
                          </h3>
                        </div>
                        <div className="space-y-2 ml-11">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-300">
                              <Sparkles className="h-3 w-3" />
                              {template.template_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            <Mail className="inline h-3.5 w-3.5 mr-1 text-purple-600" />
                            <span className="font-bold">Subject:</span> {template.subject}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {new Date(template.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t-2 border-purple-100">
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
                        className="flex-1 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
                  <FileText className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Templates Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Create your first email template to start building professional campaigns.
                </p>
                <Button
                  onClick={() => {
                    resetTemplateForm();
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card className="border-2 border-blue-100 shadow-xl">
          <CardHeader className="border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Email Campaigns
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage and track your email campaigns</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  resetCampaignForm();
                  setShowCampaignModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {campaigns.map((campaign, index) => (
                  <div 
                    key={campaign.id} 
                    className="group relative border-2 border-blue-100 rounded-lg p-4 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-2xl hover:scale-102 transition-all duration-300"
                  >
                    {/* Icon Badge */}
                    <div className="absolute -top-3 -right-3 p-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg border-2 border-white">
                      <Target className="h-4 w-4 text-white" />
                    </div>

                    <div className="flex flex-col space-y-3">
                      {/* Campaign Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {campaign.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Template ID: {campaign.template}</span>
                          </div>
                        </div>
                        {getStatusIcon(campaign.status)}
                      </div>

                      {/* Status Badge */}
                      <div>
                        <span className={getStatusBadge(campaign.status)}>{campaign.status}</span>
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-2 pt-2 border-t border-blue-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                        {campaign.sent_at && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Sent: {new Date(campaign.sent_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {campaign.status === 'draft' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => sendCampaign(campaign.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Send Now
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteCampaign(campaign.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-6">
                  <Target className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Campaigns Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Create your first email campaign to reach your audience effectively.
                </p>
                <Button
                  onClick={() => {
                    resetCampaignForm();
                    setShowCampaignModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="border-2 border-green-100 shadow-xl">
          <CardHeader className="border-b-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Email Logs
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Track delivery status and engagement</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {logsLoading ? (
              <div className="text-center py-20">
                <Loader className="h-12 w-12 animate-spin mx-auto text-green-600" />
                <p className="text-gray-600 mt-4">Loading email logs...</p>
              </div>
            ) : emailLogs.length > 0 ? (
              <div className="space-y-4">
                {emailLogs.map((log, index) => (
                  <div 
                    key={log.id} 
                    className="group relative border-2 border-green-100 rounded-lg p-4 bg-gradient-to-br from-white to-green-50/30 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Status Icon Badge */}
                    <div className="absolute -top-3 -right-3">
                      {getStatusIcon(log.status)}
                    </div>

                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        {/* Subject */}
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {log.subject}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>Recipient ID: {log.recipient}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span className={getStatusBadge(log.status)}>{log.status}</span>
                        </div>

                        {/* Error Message */}
                        {log.error_message && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{log.error_message}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Timestamps */}
                      <div className="space-y-2 text-sm lg:text-right">
                        <div className="flex lg:justify-end items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span>Sent: {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</span>
                        </div>
                        {log.opened_at && (
                          <div className="flex lg:justify-end items-center gap-2 text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Opened: {new Date(log.opened_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6">
                  <BarChart3 className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Logs Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Email delivery logs will appear here once you start sending campaigns.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-purple-100 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 border-b-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </h2>
                  <p className="text-purple-100 text-sm mt-0.5">
                    {editingTemplate ? 'Update your email template' : 'Design a new email template'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 group"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Template Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Template Name
                  </label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g., Welcome Email, Approval Notice"
                    className="border-2 border-gray-200 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Template Type
                  </label>
                  <select
                    value={templateForm.template_type}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:outline-none transition-colors"
                    aria-label="Select template type"
                    title="Choose the type of template"
                  >
                    <option value="welcome">📧 Welcome</option>
                    <option value="approval">✅ Approval</option>
                    <option value="denial">❌ Denial</option>
                    <option value="project_approval">🎯 Project Approval</option>
                    <option value="campaign">📢 Campaign</option>
                    <option value="other">📝 Other</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    Email Subject
                  </label>
                  <Input
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="e.g., Welcome to Mansa!"
                    className="border-2 border-gray-200 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* HTML Content */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Edit3 className="h-4 w-4 text-purple-600" />
                    HTML Content
                  </label>
                  <textarea
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                    rows={8}
                    placeholder="Enter your HTML email content here..."
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors font-mono text-sm"
                  />
                </div>

                {/* Text Content */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Text Content <span className="text-gray-400 text-xs font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={templateForm.text_content}
                    onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })}
                    rows={6}
                    placeholder="Plain text version for email clients that don't support HTML..."
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t-2 border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateModal(false)}
                className="border-2 hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingTemplate ? updateTemplate : createTemplate}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-blue-100 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-6 border-b-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Campaign</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Launch a new email campaign</p>
                </div>
              </div>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 group"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Campaign Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Campaign Name
                  </label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="e.g., Summer Newsletter 2024"
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Email Template
                  </label>
                  <select
                    value={campaignForm.template}
                    onChange={(e) => setCampaignForm({ ...campaignForm, template: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                    aria-label="Select email template"
                    title="Choose a template for this campaign"
                  >
                    <option value={0}>Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    Target Audience
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={campaignForm.target_all_users}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_all_users: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                          All Users
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all duration-300 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={campaignForm.target_approved_users}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_approved_users: e.target.checked })}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                          Approved Users Only
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50/50 transition-all duration-300 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={campaignForm.target_pending_users}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_pending_users: e.target.checked })}
                        className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-gray-700 group-hover:text-yellow-600 transition-colors">
                          Pending Users Only
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t-2 border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCampaignModal(false)}
                className="border-2 hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={createCampaign}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Zap className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase, Member, ProjectApplication } from '@/lib/supabase';
import { Mail, Users, Send, Loader } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    subject: 'Welcome to Mansa to Mansa!',
    body: `Dear {{name}},

Welcome to Mansa to Mansa! We're excited to have you join our community.

As a member, you'll have access to:
- Networking opportunities with professionals across Africa
- Collaborative project opportunities
- Knowledge sharing and learning resources

We'll be in touch soon with more information about upcoming events and opportunities.

Best regards,
The Mansa to Mansa Team
mansatomansa@gmail.com`
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    subject: 'Mansa to Mansa - Monthly Update',
    body: `Dear {{name}},

Here's what's new at Mansa to Mansa this month:

🎯 New Projects: We've launched several exciting new collaborative projects
👥 Community Growth: Welcome to our new members from across Africa
📚 Resources: Check out our latest knowledge sharing sessions

Stay connected and keep building the future of Africa!

Best regards,
The Mansa to Mansa Team
mansatomansa@gmail.com`
  },
  {
    id: 'project_update',
    name: 'Project Update',
    subject: 'Project Update - {{project_title}}',
    body: `Dear {{name}},

We have an update regarding your project application: {{project_title}}

{{status_message}}

If you have any questions, please don't hesitate to reach out to us.

Best regards,
The Mansa to Mansa Team
mansatomansa@gmail.com`
  }
];

export default function EmailsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [recipients, setRecipients] = useState<'all_members' | 'pending_applications' | 'custom'>('all_members');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState(selectedTemplate.subject);
  const [body, setBody] = useState(selectedTemplate.body);
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body);
  }, [selectedTemplate]);

  const loadData = async () => {
    try {
      const [membersResult, applicationsResult] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('project_applications').select('*').eq('status', 'pending')
      ]);

      setMembers(membersResult.data || []);
      setApplications(applicationsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getRecipientList = () => {
    switch (recipients) {
      case 'all_members':
        return members.map(m => ({ email: m.email, name: m.full_name }));
      case 'pending_applications':
        return applications.map(a => ({ email: a.email, name: a.full_name }));
      case 'custom':
        return customEmails.split(',').map(email => ({
          email: email.trim(),
          name: email.trim().split('@')[0]
        })).filter(r => r.email);
      default:
        return [];
    }
  };

  const personalizeContent = (content: string, recipient: { email: string; name: string }) => {
    return content
      .replace(/{{name}}/g, recipient.name)
      .replace(/{{email}}/g, recipient.email);
  };

  const sendEmails = async () => {
    setSending(true);
    const recipientList = getRecipientList();
    
    if (recipientList.length === 0) {
      alert('No recipients selected');
      setSending(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: recipientList,
          subject: subject,
          body: body,
          fromEmail: 'mansatomansa@gmail.com'
        }),
      });

      const result = await response.json();

      if (result.useMailto) {
        // Fallback to mailto if SMTP is not configured
        const emailPromises = recipientList.map(recipient => {
          const personalizedSubject = encodeURIComponent(personalizeContent(subject, recipient));
          const personalizedBody = encodeURIComponent(personalizeContent(body, recipient));
          
          return new Promise(resolve => {
            setTimeout(() => {
              const mailtoLink = `mailto:${recipient.email}?subject=${personalizedSubject}&body=${personalizedBody}&from=mansatomansa@gmail.com`;
              window.open(mailtoLink);
              resolve(true);
            }, 500);
          });
        });

        await Promise.all(emailPromises);
        alert(`SMTP not configured. Email client opened for ${recipientList.length} recipients using mansatomansa@gmail.com`);
      } else if (result.success) {
        alert(`Successfully sent ${result.sent} emails${result.failed > 0 ? ` (${result.failed} failed)` : ''} from mansatomansa@gmail.com`);
        
        // Show detailed results if there were failures
        if (result.failed > 0) {
          console.log('Email results:', result);
          const failedEmails = result.errors.map((err: any) => err.email).join(', ');
          alert(`Failed to send emails to: ${failedEmails}`);
        }
      } else {
        throw new Error(result.message || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert(`Error occurred while sending emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Center</h1>
        <p className="mt-2 text-gray-600">Send emails to members and applicants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composition */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template
                </label>
                <select
                  value={selectedTemplate.id}
                  onChange={(e) => {
                    const template = EMAIL_TEMPLATES.find(t => t.id === e.target.value);
                    if (template) setSelectedTemplate(template);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {EMAIL_TEMPLATES.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipients"
                      value="all_members"
                      checked={recipients === 'all_members'}
                      onChange={(e) => setRecipients(e.target.value as any)}
                      className="mr-2"
                    />
                    All Members ({members.length})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipients"
                      value="pending_applications"
                      checked={recipients === 'pending_applications'}
                      onChange={(e) => setRecipients(e.target.value as any)}
                      className="mr-2"
                    />
                    Pending Applications ({applications.length})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipients"
                      value="custom"
                      checked={recipients === 'custom'}
                      onChange={(e) => setRecipients(e.target.value as any)}
                      className="mr-2"
                    />
                    Custom Email List
                  </label>
                </div>

                {recipients === 'custom' && (
                  <textarea
                    placeholder="Enter email addresses separated by commas"
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    rows={3}
                    className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                )}
              </div>

              {/* Subject */}
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Email content..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{name}}`} and {`{{email}}`} for personalization
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubject(selectedTemplate.subject);
                    setBody(selectedTemplate.body);
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={sendEmails}
                  loading={sending}
                  disabled={!subject || !body || getRecipientList().length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Emails ({getRecipientList().length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Applications</span>
                <span className="font-medium">{applications.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected Recipients</span>
                <span className="font-medium">{getRecipientList().length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Recipients Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Recipients Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getRecipientList().slice(0, 5).map((recipient, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-gray-500 truncate">{recipient.email}</div>
                  </div>
                ))}
                {getRecipientList().length > 5 && (
                  <div className="text-xs text-gray-500">
                    +{getRecipientList().length - 5} more recipients
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email
                </label>
                <p className="text-sm text-gray-900">mansatomansa@gmail.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <p className="text-sm text-gray-900">Mansa to Mansa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
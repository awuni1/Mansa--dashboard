'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Shield, Bell, Palette, Database, Save, RefreshCw, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [blurIntensity, setBlurIntensity] = useState(80);
  const [blurDepth, setBlurDepth] = useState(16);
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Profile fields loaded from API
  const [profileData, setProfileData] = useState({
    fullName: '',
    alias: '',
    title: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bio: '',
    email: '',
  });

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) setAvatarUrl(savedAvatar);

    api.getMe().then(({ data }) => {
      if (data) {
        setProfileData(prev => ({
          ...prev,
          fullName: [data.first_name, data.last_name].filter(Boolean).join(' '),
          bio: data.bio || '',
          email: data.email || '',
        }));
      }
    });
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const avatarData = reader.result as string;
      setAvatarUrl(avatarData);
      localStorage.setItem('userAvatar', avatarData);
      window.dispatchEvent(new CustomEvent('avatarChanged', { detail: avatarData }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-upload')?.click();
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const nameParts = profileData.fullName.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    const { error } = await api.updateMe({ first_name, last_name, bio: profileData.bio, email: profileData.email });
    if (error) {
      toast.error(error);
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      toast.success('Profile saved.');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current || !passwordForm.newPass) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    const { error } = await api.changePassword({ old_password: passwordForm.current, new_password: passwordForm.newPass });
    setPasswordSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Password updated successfully.');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const accentColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Admin Control</p>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">Systems Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your administrative instance, security protocols, and visual preferences across the Mansa network.
        </p>
      </div>

      {/* 2-column layout: sidebar + content */}
      <div className="flex gap-5 items-start">
        {/* Left sidebar nav */}
        <div className="w-44 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-2 border-l-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              {/* Administrator Profile card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-gray-900">Administrator Profile</h2>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {saveStatus === 'saving' ? (
                      <><RefreshCw className="h-3 w-3 animate-spin" /> SAVING...</>
                    ) : saveStatus === 'saved' ? (
                      <><Save className="h-3 w-3" /> SAVED</>
                    ) : (
                      <><Save className="h-3 w-3" /> SAVE CHANGES</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-5">Update your public identity within the Mansa ecosystem.</p>

                {/* Avatar + description */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Profile Identity</p>
                  <div className="flex items-start gap-4">
                    <div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-2xl font-bold cursor-pointer overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors flex-shrink-0"
                      onClick={triggerFileInput}
                    >
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" width={80} height={80} />
                      ) : (
                        'AM'
                      )}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Upload avatar image"
                      title="Upload avatar image"
                    />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Admin&apos;s space photo. Recommended size 650×650px. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="full-name" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      value={profileData.fullName}
                      onChange={e => setProfileData(p => ({ ...p, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="primary-alias" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Username / Alias
                    </label>
                    <input
                      id="primary-alias"
                      value={profileData.alias}
                      onChange={e => setProfileData(p => ({ ...p, alias: e.target.value }))}
                      placeholder="e.g. john_doe"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="command-title" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Job Title
                    </label>
                    <input
                      id="command-title"
                      value={profileData.title}
                      onChange={e => setProfileData(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Lead Architect"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="timezone" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Timezone
                    </label>
                    <input
                      id="timezone"
                      value={profileData.timezone}
                      onChange={e => setProfileData(p => ({ ...p, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                    Bio / Mission Statement
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Visual Engine card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-2">Visual Engine</p>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
                        {(['auto', 'light', 'dark'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTheme(t)}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                              theme === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-700">UI Blur Intensity</p>
                        <span className="text-xs font-bold text-blue-600">{blurIntensity}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={blurIntensity} onChange={e => setBlurIntensity(Number(e.target.value))} className="w-full accent-blue-600 h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-700">Backdrop Blur Depth</p>
                        <span className="text-xs font-bold text-blue-600">{blurDepth}px</span>
                      </div>
                      <input type="range" min="0" max="50" value={blurDepth} onChange={e => setBlurDepth(Number(e.target.value))} className="w-full accent-blue-600 h-1.5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-3">Interface Accent</p>
                    <div className="flex gap-2 flex-wrap mb-6">
                      {accentColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAccentColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            accentColor === color ? 'border-gray-700 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select accent color ${color}`}
                        />
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        Accent: <span style={{ color: accentColor }}>{accentColor}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2FA Warning panel */}
              {showSecurityBanner && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Two Factor Authentication Disabled</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Your administrator account is currently vulnerable. Enable multi-factor authentication to secure the command center.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('security')}
                      className="px-4 py-2 bg-amber-500 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      ENFORCE SECURITY
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSecurityBanner(false)}
                      className="px-4 py-2 border border-amber-300 text-amber-700 text-xs font-bold tracking-wider rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      DISMISS THREAT
                    </button>
                  </div>
                </div>
              )}

              {/* Regional Governance & Data */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">Regional Governance &amp; Data</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-700 mb-1">Export Data Vault</p>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Request a full archive of your platform data and configurations.
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.info('Data export requested — you will receive it by email when ready.')}
                      className="px-3 py-1.5 border border-gray-300 text-xs font-bold text-gray-700 rounded-lg hover:bg-white transition-colors"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-700 mb-1">Audit Marking</p>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      View and mark your NID tags or access audit logs and entries.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('data')}
                      className="px-3 py-1.5 border border-gray-300 text-xs font-bold text-gray-700 rounded-lg hover:bg-white transition-colors"
                    >
                      AUDIT LOG
                    </button>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-red-700 mb-1">Terminate Instance</p>
                    <p className="text-xs text-red-500 mb-4 leading-relaxed">
                      Permanently delete your account, profile and data from the instance.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you absolutely sure? This will permanently delete your account and cannot be undone.')) {
                          toast.error('Account termination requested. Contact your system administrator to complete this action.');
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      PURGE
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
              <h2 className="text-base font-bold text-gray-900">Security Settings</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Change Password
                </h3>
                <div>
                  <label htmlFor="security-current-password" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="security-current-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="security-new-password" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                    New Password
                  </label>
                  <input
                    id="security-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwordForm.newPass}
                    onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="security-confirm-password" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="security-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Two-Factor Authentication</h3>
                <p className="text-xs text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    Status: <span className="text-red-600">Disabled</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.info('Two-factor authentication setup is not yet available. Contact your system administrator.')}
                    className="px-4 py-2 bg-amber-500 text-white text-xs font-bold tracking-wider rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    ENFORCE SECURITY
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordSaving}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {passwordSaving ? 'Updating...' : 'Update Security'}
              </button>
            </div>
          )}

          {/* ── EMAIL TAB ── */}
          {activeTab === 'email' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-gray-900">Email Configuration</h2>
              <div>
                <label htmlFor="email-primary" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                  Primary Email
                </label>
                <input
                  id="email-primary"
                  value={profileData.email}
                  onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email-reply-to" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                  Reply-To Email
                </label>
                <input
                  id="email-reply-to"
                  defaultValue="noreply@mansatomansa.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email-signature" className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                  Email Signature
                </label>
                <textarea
                  id="email-signature"
                  rows={5}
                  defaultValue={`Best regards,\nMansa to Mansa Team\n\nConnecting African Professionals Worldwide`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Email Settings
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-2">
                {[
                  { id: 'newMembers', label: 'New Member Registrations', description: 'Get notified when someone joins the platform', checked: true },
                  { id: 'newApplications', label: 'New Project Applications', description: 'Alert when members apply to projects', checked: true },
                  { id: 'approvals', label: 'Approval Required', description: 'Notify when actions need admin approval', checked: true },
                  { id: 'systemAlerts', label: 'System Alerts', description: 'Important system messages and updates', checked: true },
                  { id: 'weeklyReport', label: 'Weekly Reports', description: 'Receive weekly analytics summary', checked: false },
                  { id: 'marketing', label: 'Marketing Updates', description: 'News and updates about new features', checked: false },
                ].map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{notif.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        defaultChecked={notif.checked}
                        className="sr-only peer"
                        aria-label={`Toggle ${notif.label}`}
                        title={`Enable or disable ${notif.label}`}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
              <h2 className="text-base font-bold text-gray-900">Appearance Settings</h2>

              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Visual Engine</p>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
                  {(['auto', 'light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        theme === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">Interface Accent</p>
                <div className="flex gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                        accentColor === color ? 'border-gray-700 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select accent color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-700">UI Blur Intensity</p>
                  <span className="text-xs font-bold text-blue-600">{blurIntensity}%</span>
                </div>
                <input type="range" min="0" max="100" value={blurIntensity} onChange={e => setBlurIntensity(Number(e.target.value))} className="w-full accent-blue-600 h-1.5" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-700">Backdrop Blur Depth</p>
                  <span className="text-xs font-bold text-blue-600">{blurDepth}px</span>
                </div>
                <input type="range" min="0" max="50" value={blurDepth} onChange={e => setBlurDepth(Number(e.target.value))} className="w-full accent-blue-600 h-1.5" />
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Settings
              </button>
            </div>
          )}

          {/* ── DATA TAB ── */}
          {activeTab === 'data' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Regional Governance &amp; Data</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-700 mb-1">Export Data Vault</p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Request a full archive of your platform data and configurations.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.info('Data export requested — you will receive it by email when ready.')}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-bold text-gray-700 rounded-lg hover:bg-white transition-colors"
                  >
                    DOWNLOAD
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-700 mb-1">Audit Marking</p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    View and mark your NID tags or access audit logs and entries.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.info('Audit log viewer coming soon.')}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-bold text-gray-700 rounded-lg hover:bg-white transition-colors"
                  >
                    AUDIT LOG
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-red-700 mb-1">Terminate Instance</p>
                  <p className="text-xs text-red-500 mb-4 leading-relaxed">
                    Permanently delete your account, profile and data from the instance.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you absolutely sure? This will permanently delete your account and cannot be undone.')) {
                        toast.error('Account termination requested. Contact your system administrator to complete this action.');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    PURGE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

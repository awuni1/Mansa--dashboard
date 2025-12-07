'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, User, Mail, Shield, Bell, Palette, Database, Lock, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, or GIF)');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const avatarData = reader.result as string;
      setAvatarUrl(avatarData);
      // Save to localStorage so it persists across pages
      localStorage.setItem('userAvatar', avatarData);
      // Trigger custom event to update header immediately
      window.dispatchEvent(new CustomEvent('avatarChanged', { detail: avatarData }));
      alert('Avatar updated! Your new avatar will appear in the header.');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-upload')?.click();
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Settings className="h-10 w-10 animate-spin-slow" />
            Dashboard Settings
          </h1>
          <p className="mt-2 text-purple-100 text-lg">Customize your admin dashboard experience</p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto bg-gradient-to-r from-gray-50 to-purple-50">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'data', label: 'Data', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-white hover:text-purple-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <>
            <Card className="border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Admin Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl leading-none overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      'AU'
                    )}
                  </div>
                  <div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Upload avatar image"
                      title="Upload avatar image"
                    />
                    <Button 
                      variant="outline" 
                      className="mb-2"
                      onClick={triggerFileInput}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500">JPG, PNG or GIF (max. 2MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <Input defaultValue="Admin User" className="text-base py-6" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                    <Input defaultValue="admin" className="text-base py-6" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <Input type="email" defaultValue="admin@mansatomansa.com" className="text-base py-6" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                    <Input type="tel" defaultValue="+1 234 567 8900" className="text-base py-6" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                      defaultValue="Admin of Mansa to Mansa platform"
                      aria-label="User bio"
                      title="Enter your bio"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="flex-1 py-6 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1 py-6 text-base">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <>
            <Card className="border-2 border-red-100 shadow-xl hover:shadow-2xl transition-all lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-100">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="text-base py-6 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="text-base py-6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="text-base py-6"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Two-Factor Authentication
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add an extra layer of security to your account. You'll need to enter a verification code in addition to your password when signing in.
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Status: <span className="text-red-600">Disabled</span></p>
                      <p className="text-sm text-gray-500">Not configured yet</p>
                    </div>
                    <Button variant="outline" className="bg-white">
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 py-6 text-base bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                    <Save className="h-5 w-5 mr-2" />
                    Update Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Email Configuration */}
        {activeTab === 'email' && (
          <>
            <Card className="border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  Company Email
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Primary Email</label>
                  <Input defaultValue="mansatomansa@gmail.com" className="text-base py-6" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Reply-To Email</label>
                  <Input defaultValue="noreply@mansatomansa.com" className="text-base py-6" />
                </div>
                <Button className="w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Save className="h-5 w-5 mr-2" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  Email Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Signature</label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    rows={6}
                    defaultValue="Best regards,&#10;Mansa to Mansa Team&#10;&#10;Connecting African Professionals Worldwide"
                    aria-label="Email signature"
                    title="Enter your email signature"
                  />
                </div>
                <Button className="w-full py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Save className="h-5 w-5 mr-2" />
                  Update Signature
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <Card className="border-2 border-yellow-100 shadow-xl hover:shadow-2xl transition-all lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {[
                  { id: 'newMembers', label: 'New Member Registrations', description: 'Get notified when someone joins the platform', checked: true },
                  { id: 'newApplications', label: 'New Project Applications', description: 'Alert when members apply to projects', checked: true },
                  { id: 'approvals', label: 'Approval Required', description: 'Notify when actions need admin approval', checked: true },
                  { id: 'systemAlerts', label: 'System Alerts', description: 'Important system messages and updates', checked: true },
                  { id: 'weekly Report', label: 'Weekly Reports', description: 'Receive weekly analytics summary', checked: false },
                  { id: 'marketing', label: 'Marketing Updates', description: 'News and updates about new features', checked: false }
                ].map(notif => (
                  <div key={notif.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-100 hover:border-yellow-300 transition-all">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{notif.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input 
                        type="checkbox" 
                        defaultChecked={notif.checked} 
                        className="sr-only peer" 
                        aria-label={`Toggle ${notif.label}`}
                        title={`Enable or disable ${notif.label}`}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-600 peer-checked:to-amber-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 py-6 text-base bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700">
                <Save className="h-5 w-5 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <Card className="border-2 border-indigo-100 shadow-xl hover:shadow-2xl transition-all lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Theme</label>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 border-4 border-indigo-600 rounded-xl bg-white hover:shadow-xl transition-all">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-lg border-2 border-gray-300"></div>
                    </div>
                    <p className="font-bold text-indigo-600">Light Theme</p>
                    <p className="text-sm text-gray-500 mt-1">Current</p>
                  </button>
                  <button className="p-6 border-2 border-gray-200 rounded-xl bg-gray-900 hover:shadow-xl transition-all opacity-50">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-lg"></div>
                    </div>
                    <p className="font-bold text-white">Dark Theme</p>
                    <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Items Per Page</label>
                <select 
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-base font-medium"
                  aria-label="Items per page"
                  title="Select items per page"
                >
                  <option value="10">10 items</option>
                  <option value="25" selected>25 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Sidebar Position</label>
                <select 
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none text-base font-medium"
                  aria-label="Sidebar position"
                  title="Select sidebar position"
                >
                  <option value="left" selected>Left Side</option>
                  <option value="right">Right Side</option>
                </select>
              </div>

              <Button className="w-full py-6 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Save className="h-5 w-5 mr-2" />
                Apply Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Data Management */}
        {activeTab === 'data' && (
          <Card className="border-2 border-cyan-100 shadow-xl hover:shadow-2xl transition-all lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-100">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Export Data</h3>
                <p className="text-gray-600 mb-4">Download all platform data in various formats</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="flex-1">Export as CSV</Button>
                  <Button variant="outline" className="flex-1">Export as JSON</Button>
                  <Button variant="outline" className="flex-1">Export as PDF</Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-100">
                <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-yellow-600" />
                  Cache Management
                </h3>
                <p className="text-gray-600 mb-4">Clear cached data to improve performance</p>
                <Button variant="outline" className="bg-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200">
                <h3 className="font-bold text-lg text-red-900 mb-2">Danger Zone</h3>
                <p className="text-red-700 mb-4">These actions are irreversible. Please be careful.</p>
                <div className="space-y-3">
                  <Button variant="danger" className="w-full">
                    Delete All Logs
                  </Button>
                  <Button variant="danger" className="w-full">
                    Reset Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
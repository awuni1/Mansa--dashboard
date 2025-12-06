'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/useAppStore';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Bell, User, Search, ChevronDown, CheckCircle, AlertCircle, Info, X, Users as UsersIcon, FolderOpen, WifiOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export function Header() {
  const { user } = useAuth();
  const { isOnline } = useOfflineDetection();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    addNotification 
  } = useAppStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch recent activities from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch recent members, applications, and projects
      const [membersResult, applicationsResult, projectsResult] = await Promise.all([
        api.getPlatformMembers({ page: 1 }),
        api.getPlatformApplications({ page: 1 }),
        api.getPlatformProjects({ page: 1 }),
      ]);

      // Add recent members (new people joining Mansa)
      if (membersResult.data?.results) {
        const recentMembers = membersResult.data.results.slice(0, 5);
        recentMembers.forEach((member: any) => {
          addNotification({
            type: 'success',
            title: '🎉 New Member Joined',
            message: `${member.first_name || member.name || 'Someone'} ${member.last_name || ''} joined Mansa community`,
          });
        });
      }

      // Add recent applications (new project applications)
      if (applicationsResult.data?.results) {
        const recentApps = applicationsResult.data.results.slice(0, 5);
        recentApps.forEach((app: any) => {
          addNotification({
            type: 'info',
            title: '📋 New Project Application',
            message: `${app.applicant_name || 'Someone'} applied for a project`,
          });
        });
      }

      // Add recent projects (new projects created)
      if (projectsResult.data?.results) {
        const recentProjects = projectsResult.data.results.slice(0, 3);
        recentProjects.forEach((project: any) => {
          if (project.status === 'pending' || project.approval_status === 'pending') {
            addNotification({
              type: 'warning',
              title: '🚀 New Project Pending',
              message: `Project "${project.title}" awaiting approval`,
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Add error notification
      addNotification({
        type: 'info',
        title: '🎉 New Member Joined',
        message: 'Check your dashboard for recent activity',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    try {
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  // Fetch notifications on mount only (no polling to prevent duplicates)
  useEffect(() => {
    fetchNotifications();
    
    // Optional: Poll for new notifications every 5 minutes instead of 30 seconds
    // Uncomment if you want periodic updates
    // const interval = setInterval(() => {
    //   fetchNotifications();
    // }, 300000);

    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3">
        {/* Left Section */}
        <div className="flex-1 min-w-0 pl-10 sm:pl-12 lg:pl-0">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent truncate">
              Dashboard
            </h1>
            {/* Offline Indicator */}
            {!isOnline && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 border border-red-300 rounded-lg animate-pulse">
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700 hidden sm:inline">Offline</span>
              </div>
            )}
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 lg:w-80 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
          {/* Notification Button */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 sm:p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 group"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 lg:w-96 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-in-right z-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                      Notifications
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchNotifications()}
                        disabled={loading}
                        className="text-white/90 hover:text-white transition-all p-1 rounded hover:bg-white/10"
                        title="Refresh notifications"
                      >
                        <svg 
                          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-white/90 hover:text-white font-medium hover:underline transition-all"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {loading && notifications.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-500 mt-3 text-sm">Loading notifications...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors group ${
                            !notification.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {notification.title}
                                    {!notification.read && (
                                      <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTimeAgo(notification.timestamp)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 hover:underline"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 text-center">
                      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mx-auto mb-3">
                        <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-semibold text-sm sm:text-base">No notifications</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold w-full text-center hover:underline transition-all">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* User Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-200">
                <div className="relative">
                  <div className="flex items-center justify-center h-9 w-9 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                </div>
                <div className="text-sm hidden sm:block">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {user?.email?.split('@')[0] || 'Admin'}
                    <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Administrator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
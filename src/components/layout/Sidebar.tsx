'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  ChevronRight,
  Calendar,
  GraduationCap,
  // MessageSquare, // Removed - WhatsApp functionality disabled
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  // { name: 'WhatsApp Manager', href: '/dashboard/whatsapp', icon: MessageSquare },
  { name: 'Mentorship', href: '/dashboard/mentorship', icon: GraduationCap, badge: true },
  { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  // { name: 'Project Applications', href: '/dashboard/applications', icon: FolderOpen },
  { name: 'Form Submissions', href: '/dashboard/forms', icon: FileText },
  { name: 'Email Center', href: '/dashboard/emails', icon: Mail },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center p-2.5 rounded-xl text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg border border-gray-200 transition-all duration-200"
        >
          {mobileMenuOpen ? (
            <X className="block h-5 w-5" />
          ) : (
            <Menu className="block h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={clsx(
        "flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 transition-all duration-300 ease-in-out lg:translate-x-0",
        "fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-72 shadow-2xl",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]"></div>
          <div className="relative">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Mansa <span className="font-light">Admin</span>
            </h1>
            <div className="h-0.5 w-12 bg-cyan-400 mt-1 rounded-full mx-auto"></div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200',
                      isActive ? 'text-white scale-110' : 'text-gray-400 group-hover:text-white group-hover:scale-110'
                    )}
                  />
                  <span className={clsx(
                    'transition-all duration-200',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-white/80" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Sign Out Section */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/20"
          >
            <div className="flex items-center">
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-400 transition-all duration-200 group-hover:translate-x-1" />
              <span>Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
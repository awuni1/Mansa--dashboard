'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  Calendar,
  GraduationCap,
  Newspaper,
  Zap,
  ListOrdered,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mentorship', href: '/dashboard/mentorship', icon: GraduationCap, badge: true },
  { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Form Submissions', href: '/dashboard/forms', icon: FileText },
  { name: 'Email Center', href: '/dashboard/emails', icon: Mail },
  { name: 'Automation', href: '/dashboard/automation', icon: Zap },
  { name: 'Cadences', href: '/dashboard/cadences', icon: ListOrdered },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Blog', href: '/dashboard/blog', icon: Newspaper },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center p-2.5 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg border border-gray-200 transition-all duration-200"
        >
          {mobileMenuOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            role="presentation"
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={clsx(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out lg:translate-x-0',
        'fixed lg:static inset-y-0 left-0 z-50 w-56 shadow-sm',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex flex-col justify-center h-14 px-5 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-900 uppercase tracking-[0.15em]">MANSA ADMIN</p>
          <p className="text-[10px] text-gray-400 mt-0.5">mansafomansa / Administrator</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'group flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={clsx(
                    'h-[15px] w-[15px] flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={clsx(
                    'px-1.5 py-0.5 text-[9px] font-bold rounded-full',
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  )}>
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-2.5 py-3 border-t border-gray-100">
          <button
            onClick={async () => { await signOut(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="h-[15px] w-[15px]" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

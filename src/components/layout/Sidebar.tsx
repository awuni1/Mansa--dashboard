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
  MessageSquare,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'WhatsApp Manager', href: '/dashboard/whatsapp', icon: MessageSquare },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Project Applications', href: '/dashboard/applications', icon: FolderOpen },
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
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 bg-white hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 shadow-lg border border-gray-200"
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
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={clsx(
        "flex flex-col bg-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0",
        "fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-64",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Mansa Admin</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="px-2 py-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
          Sign Out
        </button>
      </div>
      </div>
    </>
  );
}
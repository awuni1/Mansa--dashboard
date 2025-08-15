'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, User } from 'lucide-react';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex-1 min-w-0 pl-12 lg:pl-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
            Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-full">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm hidden sm:block">
              <div className="font-medium text-gray-900">
                {user?.email || 'Admin'}
              </div>
              <div className="text-gray-500">Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
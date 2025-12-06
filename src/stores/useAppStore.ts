import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'member' | 'application' | 'project' | 'email';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface AppState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Search
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Notifications
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
        };
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      deleteNotification: (id) => set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      }),
      
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // UI State
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      // Search
      globalSearchTerm: '',
      setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),
    }),
    {
      name: 'mansa-dashboard-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

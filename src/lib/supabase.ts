import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://adnteftmqytcnieqmlma.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbnRlZnRtcXl0Y25pZXFtbG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0NTUsImV4cCI6MjA2ODY2OTQ1NX0.w4oLhu7sVeMvXGbr0oX1MtWk3CEdS97Saonwz7WENrw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  profession?: string;
  location?: string;
  interests?: string;
  skills?: string;
  project_experience?: string;
  availability?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectApplication {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  project_title: string;
  project_description: string;
  skills_required?: string;
  timeline?: string;
  budget_range?: string;
  project_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface FormSubmission {
  id: string;
  form_type: 'contact' | 'membership' | 'project' | 'other';
  form_data: Record<string, any>;
  email?: string;
  name?: string;
  created_at: string;
}
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
  name: string; // Database field name
  email: string;
  phone?: string; // Database field name
  country?: string;
  city?: string;
  linkedin?: string;
  experience?: string;
  areaOfExpertise?: string;
  school?: string;
  level?: string;
  occupation?: string;
  jobtitle?: string;
  industry?: string;
  major?: string;
  gender?: string;
  membershiptype?: string;
  skills?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  
  // Computed properties for backwards compatibility
  full_name?: string;
  phone_number?: string;
  profession?: string;
  location?: string;
}

export interface ProjectApplication {
  id: string;
  project_id: number;
  applicant_name: string; // Database field name
  applicant_email: string; // Database field name
  skills: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_date: string;
  reviewed_date?: string;
  reviewer_notes?: string;
  member_id?: string;
  created_at: string;
  updated_at?: string;
  
  // Computed properties for backwards compatibility
  full_name?: string;
  email?: string;
  project_title?: string;
  project_description?: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  created_by?: string;
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

// Helper functions to transform data for backwards compatibility
export const transformMemberData = (member: Member): Member => ({
  ...member,
  full_name: member.name,
  phone_number: member.phone,
  profession: member.jobtitle || member.occupation,
  location: member.city && member.country ? `${member.city}, ${member.country}` : (member.city || member.country),
});

export const transformApplicationData = async (application: ProjectApplication): Promise<ProjectApplication> => {
  // Try to get project details
  let projectTitle = `Project #${application.project_id}`;
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('title, description')
      .eq('id', application.project_id)
      .single();
    
    if (project) {
      projectTitle = project.title;
    }
  } catch (error) {
    console.log('Could not fetch project details:', error);
  }

  return {
    ...application,
    full_name: application.applicant_name,
    email: application.applicant_email,
    project_title: projectTitle,
    project_description: application.motivation,
  };
};
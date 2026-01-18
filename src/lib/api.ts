// Django Backend API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  detail?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired or invalid, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            return { error: errorData.detail || errorData.message || 'Request failed' };
          }
          
          // Handle empty response (e.g., 204 No Content for DELETE requests)
          const contentType = retryResponse.headers.get('content-type');
          if (retryResponse.status === 204 || !contentType || !contentType.includes('application/json')) {
            return { data: {} as T };
          }

          const data = await retryResponse.json();
          return { data };
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.setToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token');
            // Don't redirect immediately if we're already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?error=session_expired';
            }
          }
          return { error: 'Session expired. Please log in again.' };
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.detail || errorData.message || 'Request failed' };
      }

      // Handle empty response (e.g., 204 No Content for DELETE requests)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return { data: {} as T };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null;

    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/users/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ access: string; refresh: string }>> {
    const response = await this.request<{ access: string; refresh: string }>('/users/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.setToken(response.data.access);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
    }

    return response;
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me/');
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  // User management methods
  async getUsers(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<User>>(`/users/admin/users/${query ? `?${query}` : ''}`);
  }

  async approveUser(userId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/users/admin/users/${userId}/approve/`, {
      method: 'POST',
    });
  }

  async denyUser(userId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/users/admin/users/${userId}/deny/`, {
      method: 'POST',
    });
  }

  async getPendingUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/users/admin/users/pending/');
  }

  // Platform data methods (Supabase data via Django)
  async getPlatformMembers(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<Member>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Member>>(`/platform/members/${query ? `?${query}` : ''}`);
  }

  async getPlatformProjects(params?: {
    page?: number;
    search?: string;
    status?: string;
    project_type?: string
  }): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.project_type) searchParams.set('project_type', params.project_type);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Project>>(`/platform/projects/${query ? `?${query}` : ''}`);
  }

  async getPlatformApplications(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<ProjectApplication>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<ProjectApplication>>(`/platform/applications/${query ? `?${query}` : ''}`);
  }

  async getCommunityMembers(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<Member>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Member>>(`/platform/community-members/${query ? `?${query}` : ''}`);
  }

  async getMemberLocations(): Promise<ApiResponse<MemberLocationData>> {
    return this.request<MemberLocationData>('/platform/members/locations/');
  }

  async getResearchCohort(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<CohortApplication>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<CohortApplication>>(`/platform/research-cohort/${query ? `?${query}` : ''}`);
  }

  async getEducationCohort(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<CohortApplication>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<CohortApplication>>(`/platform/education-cohort/${query ? `?${query}` : ''}`);
  }

  // Project management methods (Django managed projects)
  async getProjects(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Project>>(`/projects/${query ? `?${query}` : ''}`);
  }

  async approveProject(projectId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/projects/${projectId}/approve/`, {
      method: 'POST',
    });
  }

  async denyProject(projectId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/projects/${projectId}/deny/`, {
      method: 'POST',
    });
  }

  async createProject(project: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(projectId: number, project: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${projectId}/`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(projectId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/projects/${projectId}/`, {
      method: 'DELETE',
    });
  }

  // Application management methods
  async getProjectApplications(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<ProjectApplication>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<ProjectApplication>>(`/applications/${query ? `?${query}` : ''}`);
  }

  async approveApplication(applicationId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/applications/${applicationId}/approve/`, {
      method: 'POST',
    });
  }

  async denyApplication(applicationId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/applications/${applicationId}/deny/`, {
      method: 'POST',
    });
  }

  // Event management methods
  async getEvents(params?: { page?: number; search?: string; status?: string; published?: boolean }): Promise<ApiResponse<Event[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.published !== undefined) searchParams.set('published', params.published.toString());

    const query = searchParams.toString();
    return this.request<Event[]>(`/events/${query ? `?${query}` : ''}`);
  }

  async createEvent(eventData: FormData): Promise<ApiResponse<Event>> {
    const url = `${this.baseUrl}/events/`;
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: eventData,
      });

      if (response.status === 401) {
        // Token expired or invalid, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: eventData,
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            return { error: errorData.detail || errorData.message || 'Request failed' };
          }
          
          const data = await retryResponse.json();
          return { data };
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.setToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?error=session_expired';
            }
          }
          return { error: 'Session expired. Please log in again.' };
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Log full error details for debugging
        console.error('Backend validation error:', data);
        // Try to extract detailed error messages
        const errorMessage = data.detail || data.message || JSON.stringify(data) || 'Request failed';
        return { error: errorMessage };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async updateEvent(eventId: string | number, eventData: FormData): Promise<ApiResponse<Event>> {
    const url = `${this.baseUrl}/events/${eventId}/`;
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: eventData,
      });

      if (response.status === 401) {
        // Token expired or invalid, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            method: 'PUT',
            headers,
            body: eventData,
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            return { error: errorData.detail || errorData.message || 'Request failed' };
          }
          
          const data = await retryResponse.json();
          return { data };
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.setToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?error=session_expired';
            }
          }
          return { error: 'Session expired. Please log in again.' };
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Log full error details for debugging
        console.error('Backend validation error:', data);
        // Try to extract detailed error messages
        const errorMessage = data.detail || data.message || JSON.stringify(data) || 'Request failed';
        return { error: errorMessage };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async deleteEvent(eventId: string | number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/events/${eventId}/`, {
      method: 'DELETE',
    });
  }

  async moveEventToPast(eventId: string | number): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/events/${eventId}/move_to_past/`, {
      method: 'POST',
    });
  }

  async moveEventToUpcoming(eventId: string | number): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/events/${eventId}/move_to_upcoming/`, {
      method: 'POST',
    });
  }

  async toggleEventPublish(eventId: string | number): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/events/${eventId}/toggle_publish/`, {
      method: 'POST',
    });
  }

  async deleteApplication(applicationId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/applications/${applicationId}/`, {
      method: 'DELETE',
    });
  }

  // Email management methods
  async getEmailTemplates(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<EmailTemplate>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<EmailTemplate>>(`/emails/templates/${query ? `?${query}` : ''}`);
  }

  async createEmailTemplate(template: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> {
    return this.request<EmailTemplate>('/emails/templates/', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateEmailTemplate(templateId: number, template: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> {
    return this.request<EmailTemplate>(`/emails/templates/${templateId}/`, {
      method: 'PATCH',
      body: JSON.stringify(template),
    });
  }

  async deleteEmailTemplate(templateId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/emails/templates/${templateId}/`, {
      method: 'DELETE',
    });
  }

  async getEmailCampaigns(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<EmailCampaign>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<EmailCampaign>>(`/emails/campaigns/${query ? `?${query}` : ''}`);
  }

  async createEmailCampaign(campaign: Partial<EmailCampaign>): Promise<ApiResponse<EmailCampaign>> {
    return this.request<EmailCampaign>('/emails/campaigns/', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  }

  async updateEmailCampaign(campaignId: number, campaign: Partial<EmailCampaign>): Promise<ApiResponse<EmailCampaign>> {
    return this.request<EmailCampaign>(`/emails/campaigns/${campaignId}/`, {
      method: 'PATCH',
      body: JSON.stringify(campaign),
    });
  }

  async deleteEmailCampaign(campaignId: number): Promise<ApiResponse<{ detail: string }>> {
    return this.request<{ detail: string }>(`/emails/campaigns/${campaignId}/`, {
      method: 'DELETE',
    });
  }

  async sendEmailCampaign(campaignId: number): Promise<ApiResponse<EmailCampaign>> {
    return this.request<EmailCampaign>(`/emails/campaigns/${campaignId}/send/`, {
      method: 'POST',
    });
  }

  async getEmailLogs(params?: { page?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<EmailLog>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<EmailLog>>(`/emails/logs/${query ? `?${query}` : ''}`);
  }

  // Analytics methods
  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
    return this.request<AnalyticsOverview>('/admin/analytics/overview/');
  }

  async getUserAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    return this.request<UserAnalytics>('/admin/analytics/users/');
  }

  async getProjectAnalytics(): Promise<ApiResponse<ProjectAnalytics>> {
    return this.request<ProjectAnalytics>('/admin/analytics/projects/');
  }

  async getEmailAnalytics(): Promise<ApiResponse<EmailAnalytics>> {
    return this.request<EmailAnalytics>('/admin/analytics/emails/');
  }

  // Recent activities for notifications
  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return this.request<RecentActivity[]>(`/admin/recent-activities/?limit=${limit}`);
  }
}

// Type definitions
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'super_admin';
  approval_status: 'pending' | 'approved' | 'denied';
  phone_number?: string;
  profile_picture?: string;
  bio?: string;
  date_joined: string;
  date_approved?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  linkedin?: string;
  experience?: string;
  areaofexpertise?: string; // Note: lowercase in database
  areaOfExpertise?: string; // Alias for backwards compatibility
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
  
  // Fields from unified members table (formerly community_members)
  joined_date?: string;
  profile_picture?: string;
  bio?: string;
  location?: string;
  motivation?: string;

  // Computed properties for backwards compatibility
  full_name?: string;
  phone_number?: string;
  profession?: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  detailed_description?: string;
  image?: string;
  admission_start_date?: string;
  admission_end_date?: string;
  status?: string;
  approval_status?: string;
  created_by?: number;
  approved_by?: number;
  max_participants?: number;
  current_participants?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectApplication {
  id: string | number;
  project_id?: number;
  project?: number;
  user?: number;
  applicant_name?: string;
  applicant_email?: string;
  application_data?: Record<string, any>;
  skills?: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'denied' | 'rejected' | 'waitlist';
  applied_date?: string;
  applied_at?: string;
  reviewed_date?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  review_notes?: string;
  member_id?: string;
  created_at: string;
  updated_at?: string;

  // Computed properties for backwards compatibility
  full_name?: string;
  email?: string;
  project_title?: string;
  project_description?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: number;
  name: string;
  template: number;
  target_all_users: boolean;
  target_approved_users: boolean;
  target_pending_users: boolean;
  specific_users: number[];
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  created_by: number;
  created_at: string;
}

export interface EmailLog {
  id: number;
  recipient: number;
  campaign?: number;
  template?: number;
  subject: string;
  status: 'queued' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  error_message?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AnalyticsOverview {
  total_users: number;
  pending_users: number;
  approved_users: number;
  total_projects: number;
  active_projects: number;
  total_applications: number;
  pending_applications: number;
  total_emails_sent: number;
}

export interface UserAnalytics {
  new_registrations_this_month: number;
  total_approved_users: number;
  total_pending_users: number;
  user_growth_rate: number;
  recent_registrations: User[];
}

export interface ProjectAnalytics {
  total_projects: number;
  pending_projects: number;
  approved_projects: number;
  total_applications: number;
  application_approval_rate: number;
  recent_projects: Project[];
}

export interface EmailAnalytics {
  total_campaigns: number;
  total_emails_sent: number;
  total_templates: number;
  recent_campaigns: EmailCampaign[];
  email_open_rate: number;
}

export interface CohortApplication {
  id: string | number;
  applicant_name: string;
  applicant_email: string;
  cohort_type: 'research' | 'education';
  application_data?: Record<string, any>;
  status: 'pending' | 'approved' | 'denied' | 'waitlist';
  applied_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface RecentActivity {
  id: number;
  type: 'new_member' | 'new_application' | 'new_project' | 'project_update';
  title: string;
  message: string;
  created_at: string;
  entity_id?: number;
  entity_type?: string;
}

export interface MemberLocationData {
  total_members: number;
  total_countries: number;
  locations: Array<{
    country: string;
    count: number;
    members: Array<{
      id: string;
      name: string;
      email: string;
      city?: string;
      membershipType?: string;
    }>;
  }>;
}

export interface Event {
  id: string | number;
  title: string;
  description: string;
  category: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  virtual_link?: string;
  status: 'upcoming' | 'past';
  max_attendees?: number;
  attendee_count: number;
  flyer?: string;
  images: Array<{
    id: string;
    image: string;
    caption: string;
  }>;
  published: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);
export default api;
# Mansa to Mansa - API Endpoints Quick Reference

## 🌐 Base URL
```
Production: https://mansa-backend-1rr8.onrender.com/api
Local Dev:  http://127.0.0.1:8000/api
```

## 🔐 Authentication Endpoints

### 1. User Registration
```typescript
POST /users/register/
Body: {
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  role?: 'user' | 'admin'
}
Response: { id, email, first_name, last_name, role, approval_status }
```

### 2. Login (Get JWT Token)
```typescript
POST /users/token/
Body: { email: string, password: string }
Response: { access: string, refresh: string }
```

### 3. Refresh Token
```typescript
POST /users/token/refresh/
Body: { refresh: string }
Response: { access: string }
```

### 4. Get Current User
```typescript
GET /users/me/
Headers: { Authorization: 'Bearer <token>' }
Response: User object
```

## 👥 Platform Data Endpoints (Supabase)

### 5. Get Platform Members
```typescript
GET /platform/members/
Query: ?page=1&search=keyword
Response: { count, next, previous, results: Member[] }
// Returns 120 members from Supabase
```

### 6. Get Community Members
```typescript
GET /platform/community-members/
Query: ?page=1&search=keyword
Response: { count, results: Member[] }
// Returns 120 community members
```

### 7. Get Platform Projects
```typescript
GET /platform/projects/
Query: ?page=1&search=keyword&status=active&project_type=research
Response: { count, results: Project[] }
// Returns 18 projects
```

### 8. Get Platform Applications
```typescript
GET /platform/applications/
Query: ?page=1&search=keyword
Response: { count, results: ProjectApplication[] }
// Returns 41 applications
```

### 9. Get Research Cohort
```typescript
GET /platform/research-cohort/
Query: ?page=1&search=keyword
Response: { count, results: CohortApplication[] }
```

### 10. Get Education Cohort
```typescript
GET /platform/education-cohort/
Query: ?page=1&search=keyword
Response: { count, results: CohortApplication[] }
```

## 👤 User Management Endpoints

### 11. Get All Users (Admin)
```typescript
GET /users/admin/users/
Query: ?page=1&search=keyword
Response: { count, results: User[] }
```

### 12. Get Pending Users (Admin)
```typescript
GET /users/admin/users/pending/
Response: User[]
```

### 13. Approve User (Admin)
```typescript
POST /users/admin/users/{id}/approve/
Response: { detail: 'User approved successfully' }
```

### 14. Deny User (Admin)
```typescript
POST /users/admin/users/{id}/deny/
Response: { detail: 'User denied successfully' }
```

## 📊 Projects Management Endpoints

### 15. Get Projects (Django)
```typescript
GET /projects/
Query: ?page=1&search=keyword
Response: { count, results: Project[] }
```

### 16. Create Project
```typescript
POST /projects/
Body: {
  title: string,
  description: string,
  detailed_description?: string,
  max_participants?: number,
  admission_start_date?: string,
  admission_end_date?: string,
  status?: 'draft' | 'active' | 'closed'
}
Response: Project object
```

### 17. Update Project
```typescript
PATCH /projects/{id}/
Body: Partial<Project>
Response: Project object
```

### 18. Delete Project
```typescript
DELETE /projects/{id}/
Response: 204 No Content
```

### 19. Approve Project
```typescript
POST /projects/{id}/approve/
Response: { detail: 'Project approved' }
```

### 20. Deny Project
```typescript
POST /projects/{id}/deny/
Response: { detail: 'Project denied' }
```

## 📝 Applications Management Endpoints

### 21. Get Applications (Django)
```typescript
GET /applications/
Query: ?page=1&search=keyword
Response: { count, results: ProjectApplication[] }
```

### 22. Approve Application
```typescript
POST /applications/{id}/approve/
Response: { detail: 'Application approved' }
```

### 23. Deny Application
```typescript
POST /applications/{id}/deny/
Response: { detail: 'Application denied' }
```

### 24. Delete Application
```typescript
DELETE /applications/{id}/
Response: 204 No Content
```

## 📧 Email Management Endpoints

### 25. Get Email Templates
```typescript
GET /emails/templates/
Query: ?page=1&search=keyword
Response: { count, results: EmailTemplate[] }
```

### 26. Create Email Template
```typescript
POST /emails/templates/
Body: {
  name: string,
  template_type: string,
  subject: string,
  html_content: string,
  text_content?: string,
  is_active?: boolean
}
Response: EmailTemplate object
```

### 27. Update Email Template
```typescript
PATCH /emails/templates/{id}/
Body: Partial<EmailTemplate>
Response: EmailTemplate object
```

### 28. Delete Email Template
```typescript
DELETE /emails/templates/{id}/
Response: 204 No Content
```

### 29. Get Email Campaigns
```typescript
GET /emails/campaigns/
Query: ?page=1
Response: { count, results: EmailCampaign[] }
```

### 30. Create Email Campaign
```typescript
POST /emails/campaigns/
Body: {
  name: string,
  template: number,
  target_all_users?: boolean,
  target_approved_users?: boolean,
  target_pending_users?: boolean,
  specific_users?: number[],
  scheduled_at?: string
}
Response: EmailCampaign object
```

### 31. Send Email Campaign
```typescript
POST /emails/campaigns/{id}/send/
Response: EmailCampaign object (status: 'sending')
```

### 32. Get Email Logs
```typescript
GET /emails/logs/
Query: ?page=1&search=keyword
Response: { count, results: EmailLog[] }
```

## 📈 Analytics Endpoints

### 33. Get Analytics Overview
```typescript
GET /admin/analytics/overview/
Response: {
  total_users: number,
  pending_users: number,
  approved_users: number,
  total_projects: number,
  active_projects: number,
  total_applications: number,
  pending_applications: number,
  total_emails_sent: number
}
```

### 34. Get User Analytics
```typescript
GET /admin/analytics/users/
Response: {
  new_registrations_this_month: number,
  total_approved_users: number,
  total_pending_users: number,
  user_growth_rate: number,
  recent_registrations: User[]
}
```

### 35. Get Project Analytics
```typescript
GET /admin/analytics/projects/
Response: {
  total_projects: number,
  pending_projects: number,
  approved_projects: number,
  total_applications: number,
  application_approval_rate: number,
  recent_projects: Project[]
}
```

### 36. Get Email Analytics
```typescript
GET /admin/analytics/emails/
Response: {
  total_campaigns: number,
  total_emails_sent: number,
  total_templates: number,
  email_open_rate: number,
  recent_campaigns: EmailCampaign[]
}
```

## 🏥 System Endpoints

### 37. Health Check
```typescript
GET /health/
Response: {
  status: 'healthy',
  database: 'connected',
  timestamp: string
}
```

### 38. API Schema (OpenAPI)
```typescript
GET /schema/
Response: OpenAPI 3.0 schema
```

### 39. Swagger Documentation
```typescript
GET /docs/
Response: Interactive API documentation (HTML)
```

## 📋 Data Models

### Member
```typescript
{
  id: string,
  name: string,
  email: string,
  phone?: string,
  country?: string,
  city?: string,
  linkedin?: string,
  experience?: string,
  areaOfExpertise?: string,
  school?: string,
  level?: string,
  occupation?: string,
  jobtitle?: string,
  industry?: string,
  major?: string,
  gender?: string,
  membershiptype?: string,
  skills?: string,
  is_active?: boolean,
  created_at: string,
  updated_at?: string
}
```

### Project
```typescript
{
  id: number,
  title: string,
  description?: string,
  detailed_description?: string,
  image?: string,
  admission_start_date?: string,
  admission_end_date?: string,
  status?: 'draft' | 'active' | 'closed' | 'archived',
  approval_status?: string,
  created_by?: number,
  approved_by?: number,
  max_participants?: number,
  current_participants?: number,
  created_at: string,
  updated_at?: string
}
```

### ProjectApplication
```typescript
{
  id: string | number,
  project_id?: number,
  project?: number,
  user?: number,
  applicant_name?: string,
  applicant_email?: string,
  application_data?: object,
  skills?: string,
  motivation?: string,
  status: 'pending' | 'approved' | 'denied' | 'rejected' | 'waitlist',
  applied_date?: string,
  applied_at?: string,
  reviewed_date?: string,
  reviewed_at?: string,
  reviewer_notes?: string,
  review_notes?: string,
  created_at: string,
  updated_at?: string
}
```

### EmailTemplate
```typescript
{
  id: number,
  name: string,
  template_type: string,
  subject: string,
  html_content: string,
  text_content?: string,
  created_by: number,
  is_active: boolean,
  created_at: string,
  updated_at: string
}
```

### EmailCampaign
```typescript
{
  id: number,
  name: string,
  template: number,
  target_all_users: boolean,
  target_approved_users: boolean,
  target_pending_users: boolean,
  specific_users: number[],
  scheduled_at?: string,
  sent_at?: string,
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
  created_by: number,
  created_at: string
}
```

### EmailLog
```typescript
{
  id: number,
  recipient: number,
  campaign?: number,
  template?: number,
  subject: string,
  status: 'queued' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked',
  error_message?: string,
  sent_at?: string,
  opened_at?: string,
  clicked_at?: string,
  created_at: string
}
```

## 🔑 Authentication Flow

1. **Login**: POST `/users/token/` → Get `access` and `refresh` tokens
2. **Store Tokens**: Save in localStorage
3. **API Calls**: Include `Authorization: Bearer <access_token>` header
4. **Token Expired** (401): POST `/users/token/refresh/` with refresh token
5. **Get New Access**: Retry failed request with new access token
6. **Refresh Failed**: Redirect to login

## 📊 Current Data Summary

- **Members**: 120 platform members
- **Community**: 120 community members  
- **Projects**: 18 total projects
- **Applications**: 41 total applications
- **Cohorts**: Research + Education cohorts available

## 🎯 Usage in Dashboard

All endpoints are accessible through the API client:

```typescript
import { api } from '@/lib/api';

// Get members
const { data, error } = await api.getPlatformMembers({ page: 1 });

// Create project
const result = await api.createProject({
  title: 'New Project',
  description: 'Description'
});

// Approve application
await api.approveApplication(applicationId);
```

## 🚀 Testing Endpoints

Use the interactive Swagger UI at:
```
https://mansa-backend-1rr8.onrender.com/api/docs/
```

---

**All endpoints are deployed and functional on Render!** ✅

# 🧪 Dashboard Testing Guide

## Quick Test Checklist

Run through this checklist to verify everything is working correctly.

---

## 1️⃣ Initial Setup Test

### Start the Dashboard
```bash
npm install
npm run dev
```

**Expected**: Server starts on http://localhost:3000

### Check Console
✅ No error messages  
✅ Compilation successful  
✅ Ready message displayed  

---

## 2️⃣ Authentication Test

### Login Page (http://localhost:3000/login)

**Test Valid Login:**
1. Enter admin email
2. Enter admin password
3. Click "Sign In"

✅ Should redirect to `/dashboard`  
✅ No error messages  
✅ Token stored in localStorage  

**Test Invalid Login:**
1. Enter wrong credentials
2. Click "Sign In"

✅ Should show error message  
✅ Should stay on login page  

---

## 3️⃣ Main Dashboard Test (/)

### Visual Check
✅ 8 stat cards displayed  
✅ All numbers populated (not 0)  
✅ Recent members section visible  
✅ Recent applications section visible  
✅ Recent projects section visible  
✅ Quick actions panel visible  

### Data Verification
✅ Platform Members shows ~120  
✅ Community Members shows ~120  
✅ Total Projects shows 18  
✅ Applications shows 41  
✅ Pending Users shows actual count  
✅ Research Cohort count displayed  
✅ Education Cohort count displayed  
✅ Emails Sent count displayed  

### Recent Activity
✅ Recent members list shows 5 members  
✅ Each member has name, email, location  
✅ Recent applications list shows 5 apps  
✅ Each app has status badge  
✅ Recent projects shows up to 5 projects  

### Interactions
✅ Refresh Data button works  
✅ Quick action buttons navigate correctly  
✅ All stat cards display properly  

---

## 4️⃣ Members Page Test (/dashboard/members)

### Display
✅ Member list loads  
✅ Shows multiple members  
✅ Pagination controls visible  
✅ Total count displayed  

### Search
1. Type in search box
2. Press Enter or wait

✅ Results filter in real-time  
✅ Pagination resets to page 1  

### Pagination
1. Click "Next" button

✅ Shows next page of results  
✅ URL updates with page number  

### Member Details
1. Click "View" (eye icon) on any member

✅ Modal opens with details  
✅ Shows full member information  
✅ All fields populated  
✅ Close button works  

### Email Function
1. Click "Mail" (envelope icon) on any member

✅ Opens email composer or mailto link  
✅ Pre-fills recipient email  

---

## 5️⃣ Projects Page Test (/dashboard/projects)

### Display
✅ Project list loads  
✅ Shows 18 projects  
✅ Each project shows title, description  
✅ Status badges visible  

### Filter
1. Select status filter (Active/Draft/Closed)

✅ Projects filter by status  
✅ Count updates  

### View Project
1. Click "View" on any project

✅ Shows project details  
✅ All information displayed  

### Create Project (if enabled)
1. Click "Create Project" button
2. Fill in form
3. Submit

✅ Form validates required fields  
✅ Success message on creation  
✅ New project appears in list  

---

## 6️⃣ Applications Page Test (/dashboard/applications)

### Display
✅ Application list loads  
✅ Shows 41 applications  
✅ Status badges colored correctly:
  - Yellow for pending
  - Green for approved
  - Red for denied

### Filter
1. Select status filter

✅ Applications filter correctly  
✅ Count updates  

### Search
1. Type applicant name or email

✅ Results filter  
✅ Shows matching applications  

### View Details
1. Click "View" on any application

✅ Modal opens with full details  
✅ Shows applicant information  
✅ Shows motivation, skills  

### Approve/Deny
1. Click "Approve" or "Deny"
2. Confirm action

✅ Status updates  
✅ Badge color changes  
✅ Success notification  

---

## 7️⃣ Analytics Page Test (/dashboard/analytics)

### Overview Section
✅ All stat cards display  
✅ Numbers match dashboard  
✅ Icons render correctly  

### User Analytics
✅ Shows new registrations count  
✅ Shows growth rate  
✅ Recent registrations list  

### Project Analytics
✅ Shows project counts  
✅ Shows approval rate  
✅ Recent projects list  

### Email Analytics
✅ Shows campaign count  
✅ Shows emails sent  
✅ Shows open rate (if available)  
✅ Recent campaigns list  

---

## 8️⃣ Emails Page Test (/dashboard/emails)

### Templates Tab
✅ Template list loads  
✅ Can create new template  
✅ Can edit template  
✅ Can delete template  

### Campaigns Tab
✅ Campaign list loads  
✅ Can create campaign  
✅ Can select template  
✅ Can target user groups  
✅ Can send campaign  

### Logs Tab
✅ Email logs load  
✅ Shows delivery status  
✅ Shows timestamps  
✅ Color-coded by status  

### Compose Email
1. Go to compose tab
2. Select recipients
3. Write subject and body
4. Click send

✅ Recipient count updates  
✅ Form validates  
✅ Email sends or opens mailto  

---

## 9️⃣ Settings Page Test (/dashboard/settings)

### User List
✅ Shows dashboard users  
✅ Displays roles  
✅ Shows approval status  

### Pending Users
✅ Shows users awaiting approval  
✅ Can approve users  
✅ Can deny users  

### Approve/Deny
1. Click approve on pending user

✅ User status updates  
✅ Moves to approved list  
✅ Success notification  

---

## 🔟 Navigation Test

### Sidebar
✅ Dashboard link works  
✅ Members link works  
✅ Projects link works  
✅ Applications link works  
✅ Analytics link works  
✅ Emails link works  
✅ Forms link works  
✅ Settings link works  
✅ WhatsApp link works  

### Header
✅ Shows current user info  
✅ Logout button works  
✅ Redirects to login after logout  

---

## 1️⃣1️⃣ Responsive Design Test

### Desktop (1920px)
✅ Layout fills screen  
✅ Sidebar fully visible  
✅ All cards in proper grid  

### Tablet (768px)
✅ Layout adjusts  
✅ Sidebar toggles or collapses  
✅ Cards stack appropriately  

### Mobile (375px)
✅ Single column layout  
✅ Hamburger menu for navigation  
✅ Cards stack vertically  
✅ Touch-friendly buttons  

---

## 1️⃣2️⃣ Error Handling Test

### Network Error
1. Turn off backend or use wrong URL
2. Try to load data

✅ Shows error message  
✅ Doesn't crash  
✅ Offers retry option  

### Authentication Error
1. Clear localStorage
2. Try to access protected page

✅ Redirects to login  
✅ Shows appropriate message  

### Validation Error
1. Submit form with invalid data

✅ Shows validation errors  
✅ Highlights problem fields  
✅ Prevents submission  

---

## 1️⃣3️⃣ Performance Test

### Load Times
✅ Dashboard loads in < 3 seconds  
✅ Navigation is instant  
✅ API calls complete quickly  

### Pagination
✅ Next/prev page loads smoothly  
✅ No unnecessary re-renders  

### Search
✅ Search filters quickly  
✅ Debounced (doesn't search every keystroke)  

---

## 1️⃣4️⃣ Data Integrity Test

### Verify Actual Numbers
Go to backend to verify:

```bash
# Check health
curl https://mansa-backend-1rr8.onrender.com/api/health/

# Check members count
curl -H "Authorization: Bearer <token>" \
  https://mansa-backend-1rr8.onrender.com/api/platform/members/

# Check projects count  
curl -H "Authorization: Bearer <token>" \
  https://mansa-backend-1rr8.onrender.com/api/platform/projects/

# Check applications count
curl -H "Authorization: Bearer <token>" \
  https://mansa-backend-1rr8.onrender.com/api/platform/applications/
```

✅ Dashboard numbers match API responses  
✅ Recent items match API data  
✅ Timestamps are accurate  

---

## 1️⃣5️⃣ Browser Compatibility Test

### Chrome
✅ All features work  
✅ UI renders correctly  

### Firefox
✅ All features work  
✅ UI renders correctly  

### Safari
✅ All features work  
✅ UI renders correctly  

### Edge
✅ All features work  
✅ UI renders correctly  

---

## 🐛 Common Issues & Solutions

### Issue: "Network Error"
**Solution**: 
- Verify backend is running
- Check `.env.local` has correct URL
- Check browser console for CORS errors

### Issue: "Authentication Failed"
**Solution**:
- Clear localStorage
- Re-login with valid credentials
- Verify user has admin role

### Issue: "No Data Displayed"
**Solution**:
- Check backend has data
- Verify API endpoint URLs
- Check network tab for failed requests

### Issue: "Pagination Not Working"
**Solution**:
- Check API returns pagination data
- Verify page query parameter in URL
- Check console for errors

---

## ✅ Final Verification

### Pre-Production Checklist
- [ ] All tests above passed
- [ ] No console errors
- [ ] No console warnings (critical ones)
- [ ] All images load
- [ ] All icons display
- [ ] All buttons clickable
- [ ] All forms submit
- [ ] All modals open/close
- [ ] Logout works correctly
- [ ] Login works correctly

### Production Ready When:
✅ All automated tests pass  
✅ All manual tests pass  
✅ No critical bugs  
✅ Performance acceptable  
✅ Security verified  
✅ Documentation complete  

---

## 📊 Test Results Template

Copy this and fill it out:

```
Dashboard Test Results - [DATE]

Environment:
- Node Version: [version]
- Browser: [browser name/version]
- Backend: [URL]

Tests Passed: [X] / [Total]
Tests Failed: [Y] / [Total]

Failed Tests:
1. [Test name] - [Reason] - [Fix applied]
2. [Test name] - [Reason] - [Fix applied]

Critical Issues: [Number]
Minor Issues: [Number]

Status: [PASS/FAIL/NEEDS WORK]

Tested By: [Name]
Date: [Date]
```

---

## 🎯 Quick Test (5 minutes)

If you're short on time, do this quick test:

1. ✅ Login works
2. ✅ Dashboard loads with numbers
3. ✅ Members page shows 120 members
4. ✅ Projects page shows 18 projects
5. ✅ Applications page shows 41 apps
6. ✅ Analytics shows data
7. ✅ No console errors
8. ✅ Logout works

If all 8 pass → **Dashboard is working!** ✅

---

## 📞 Need Help?

If tests fail:
1. Check `INTEGRATION_SUMMARY.md`
2. Review `DASHBOARD_INTEGRATION_GUIDE.md`
3. Check `API_ENDPOINTS_REFERENCE.md`
4. Look at browser console errors
5. Verify backend is running

---

**Happy Testing!** 🧪✨

Last Updated: December 6, 2025

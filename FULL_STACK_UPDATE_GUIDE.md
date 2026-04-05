# CIVIC MODEL - Full Stack Update Guide

## ✅ COMPLETED UPDATES

### Backend (Flask)
- ✅ Updated `/api/upload` to save complaints to Supabase
- ✅ Created `/api/complaints` endpoint with role-based filtering
- ✅ Created `/api/complaints/<id>` endpoint for status updates
- ✅ Created `/api/analytics` endpoint
- ✅ Created `/api/user-complaints` endpoint
- ✅ Full error handling and logging

### Frontend (React)
- ✅ Real Supabase authentication (email/password signup & login)
- ✅ Role-based redirection after login
- ✅ Fixed logout to redirect to HOME (not login page)
- ✅ Added "Reported Issues" page for citizens
- ✅ Updated Navbar with proper role-based links
- ✅ Updated API calls to include user info (email, role, department)
- ✅ Updated Report.jsx to send user email with complaint

### PAGES READY
- ✅ `/` - Home
- ✅ `/report` - Report Issue (with AI classification)
- ✅ `/reported-issues` - Citizen's issue tracking (NEW)
- ✅ `/dashboard` - Officer/Admin dashboard
- ✅ `/admin` - Admin analytics
- ✅ `/issues` - All issues list
- ✅ `/login` - Real Supabase login/signup

---

## 📋 SUPABASE SETUP REQUIRED

### 1. Create `complaints` Table

Run this SQL in Supabase:

```sql
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., "pothole", "garbage"
  confidence DECIMAL(5, 4) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Urgent
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255), -- From reverse geocoding
  department VARCHAR(100), -- Department responsible
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, assigned, in_progress, waiting_approval, resolved, rejected
  notes TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('submitted', 'assigned', 'in_progress', 'waiting_approval', 'resolved', 'rejected')),
  CONSTRAINT valid_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'))
);

CREATE INDEX idx_complaints_user_email ON complaints(user_email);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_department ON complaints(department);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
```

### 2. Create `users` Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'citizen', -- citizen, officer, admin
  department VARCHAR(100), -- For officers
  office_location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('citizen', 'officer', 'admin'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on complaints table
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Citizens can only see their own complaints
CREATE POLICY "citizens_see_own_complaints" ON complaints
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Officers can see complaints for their department
CREATE POLICY "officers_see_department_complaints" ON complaints
  FOR SELECT
  USING (
    CASE 
      WHEN (SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'officer'
      THEN department = (SELECT department FROM users WHERE email = auth.jwt() ->> 'email')
      ELSE false
    END
  );

-- Admins can see all complaints
CREATE POLICY "admins_see_all_complaints" ON complaints
  FOR SELECT
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

-- Allow inserts for authenticated users
CREATE POLICY "users_insert_complaints" ON complaints
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Allow officers/admins to update complaints
CREATE POLICY "officers_update_complaints" ON complaints
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE email = auth.jwt() ->> 'email') IN ('officer', 'admin')
  );

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "users_see_own_profile" ON users
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Admins can see all users
CREATE POLICY "admins_see_all_users" ON users
  FOR SELECT
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');
```

### 4. Create Test Users (for testing)

Go to Supabase Dashboard → Authentication → Users and create these test accounts:

| Email | Password | Role | Department |
|-------|----------|------|-----------|
| citizen@test.com | Test@123 | citizen | - |
| officer@test.com | Test@123 | officer | Road Department |
| admin@test.com | Test@123 | admin | - |

Then insert into `users` table:

```sql
INSERT INTO users (email, role, department) VALUES
  ('citizen@test.com', 'citizen', NULL),
  ('officer@test.com', 'officer', 'Road Department'),
  ('admin@test.com', 'admin', NULL);
```

---

## 🚀 TESTING THE API

### Test Complaint Upload

```bash
curl -X POST http://127.0.0.1:5000/api/upload \
  -F "image=@/path/to/image.jpg" \
  -F "priority=High" \
  -F "user_email=citizen@test.com" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

### Test Fetch Complaints (Officer)

```bash
curl "http://127.0.0.1:5000/api/complaints?user_email=officer@test.com&user_role=officer&user_dept=Road%20Department"
```

### Test Fetch Complaints (Admin)

```bash
curl "http://127.0.0.1:5000/api/complaints?user_email=admin@test.com&user_role=admin"
```

### Test Update Complaint

```bash
curl -X PATCH http://127.0.0.1:5000/api/complaints/COMPLAINT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Started work"
  }' \
  -G \
  --data-urlencode "user_email=officer@test.com" \
  --data-urlencode "user_role=officer"
```

---

## 🎯 FEATURES BY ROLE

### 👤 Citizen
- ✅ Sign up/Login with email
- ✅ Report civic issues with image & AI classification
- ✅ View all their reported issues with status
- ✅ See issue details (location, priority, confidence)

### 🧑‍💼 Officer
- ✅ View complaints for their department
- ✅ Update complaint status
- ✅ Assign complaints (needs worker list from Supabase)
- ✅ See analytics for their department

### 👨‍💻 Admin
- ✅ View all complaints system-wide
- ✅ Update any complaint status
- ✅ View system-wide analytics
- ✅ See all issues page

---

## 📱 FRONTEND FLOWS

### Citizen Flow
1. Sign Up/Login
2. Redirects to `/` (home) or `/report`
3. Can report issues on `/report`
4. Can view reported issues on `/reported-issues`
5. Logout redirects to `/`

### Officer Flow
1. Sign Up (gets 'citizen' role) OR Admin adds as 'officer'
2. Login → Redirects to `/dashboard`
3. Sees complaints for their department
4. Can update status and assign work
5. Logout redirects to `/`

### Admin Flow
1. Sign Up (gets 'citizen' role) OR created directly as 'admin'
2. Login → Redirects to `/admin`
3. Can access `/dashboard` and `/issues`
4. See system-wide analytics
5. Logout redirects to `/`

---

## 🔧 STILL TODO (Optional Enhancements)

### Backend
- [ ] Reverse geocoding for location names
- [ ] Bilingual support (English + Telugu) middleware
- [ ] Worker assignment system
- [ ] Status change notifications
- [ ] File upload to cloud storage
- [ ] Rate limiting

### Frontend
- [ ] Language toggle (English/Telugu translation)
- [ ] Reverse geocoding integration
- [ ] Worker list/assignment UI
- [ ] Department reassignment feature
- [ ] Advanced filters and search
- [ ] Export reports
- [ ] Mobile app version

### Database
- [ ] Department approval workflows
- [ ] Activity logs/audit trail
- [ ] Worker time tracking
- [ ] Budget tracking per department

---

## 🐛 TROUBLESHOOTING

### API Returns 404
- Check that `complaints_api.py` is registered in Flask
- Verify endpoint URLs match frontend calls

### "Failed to fetch complaints"
- Check Supabase credentials in `supabase_client.py`
- Verify RLS policies are correct
- Check user role is in accepted list

### Login fails
- Verify Supabase auth is enabled
- Check email/password are correct
- Ensure user exists in `users` table

### Role not assigned
- Make sure user exists in `users` table with correct role
- Check RLS policies aren't blocking access
- Login again to refresh token

---

## 📚 FILE STRUCTURE

```
civic_model/
├── app.py (Updated - with Supabase endpoints)
├── complaints_api.py (NEW - API endpoints)
├── supabase_client.py (Existing)
├── config.py (Existing)
│
├── frontend/src/
│   ├── App.jsx (Updated - added /reported-issues route)
│   ├── context/
│   │   └── AuthContext.jsx (Updated - real Supabase auth)
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Report.jsx (Updated - sends user email)
│   │   ├── ReportedIssues.jsx (NEW - citizen issue tracking)
│   │   ├── Dashboard.jsx (Updated - real API calls)
│   │   ├── Admin.jsx (Updated - real API calls)
│   │   ├── Issues.jsx (Updated - real API calls)
│   │   ├── Login.jsx (Updated - real Supabase auth)
│   │   └── WorkerDashboard.jsx
│   ├── components/
│   │   ├── Navbar.jsx (Updated - logout fix, new links)
│   │   └── ... (other components)
│   └── services/
│       └── api.js (Updated - user params in API calls)
```

---

## ✨ NEXT STEPS

1. **Create Supabase tables** using SQL scripts above
2. **Create test users** in Supabase auth
3. **Update Supabase credentials** if using different project
4. **Test login flow** with test users
5. **Test complaint upload** with `/api/upload`
6. **Test dashboard** with officer/admin accounts
7. **Deploy** to production

---

**Everything is ready!** Just need Supabase setup and you're good to go. 🚀

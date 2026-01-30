# RemontCo Database Setup Guide

This guide explains how to set up the database for the RemontCo platform using Supabase.

## Prerequisites

1. A Supabase account (free tier is sufficient for development)
2. A Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: RemontCo
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your location
5. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long JWT token)
3. Create a `.env` file in the project root (copy from `.env.example`)
4. Paste your credentials:
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

### 3. Run Database Migrations

Execute the SQL files in order using the Supabase SQL Editor:

#### Step 1: Create Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste and click **Run**
5. Wait for confirmation (should create all tables)

#### Step 2: Apply RLS Policies
1. Create another **New Query**
2. Copy the entire contents of `database/rls_policies.sql`
3. Paste and click **Run**
4. Verify all policies are created

#### Step 3: Seed Initial Data
1. Create another **New Query**
2. Copy the entire contents of `database/seed_data.sql`
3. Paste and click **Run**
4. This will create service categories

### 4. Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider (should be enabled by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL**: `http://localhost:3000` (for development)
5. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback.html`
   - `http://localhost:3000/**` (for wildcard)

### 5. Create Admin User

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email**: `admin@remontco.bg`
   - **Password**: `Admin123!` (or your choice)
   - **Auto Confirm User**: ✓ (checked)
4. Click **Create user**

5. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@remontco.bg');
   ```

### 6. Enable Storage (Optional)

If you want to upload images:

1. Go to **Storage** in Supabase
2. Create buckets:
   - `company-logos`
   - `job-images`
   - `review-images`
   - `verification-documents`
3. Set bucket policies (public or private as needed)

### 7. Verify Setup

Run these queries to verify everything is set up:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check categories
SELECT COUNT(*) as category_count FROM service_categories;

-- Check admin user
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

## Database Structure

### Core Tables

- **profiles** - User profiles (extends auth.users)
- **companies** - Registered companies
- **company_members** - Company team members
- **service_categories** - Hierarchical service categories
- **company_services** - Services offered by companies
- **jobs** - Consumer job postings
- **quotes** - Company offers/quotes
- **projects** - Accepted jobs in progress
- **reviews** - Project reviews
- **media** - File uploads
- **messages** - Direct messaging

### User Roles

- `consumer` - End users posting jobs
- `company_admin` - Company owner
- `company_member` - Company employee
- `admin` - Platform administrator

### Job/Ad Statuses

- `draft` - Not yet published
- `pending` - Awaiting admin approval
- `approved` - Visible to companies
- `rejected` - Rejected by admin
- `closed` - No longer accepting offers
- `completed` - Job finished

## Security

All tables have Row Level Security (RLS) enabled. Key policies:

- Users can only see their own data
- Company members can access their company's data
- Only approved jobs are visible to companies
- Admins have full access
- Public can view verified companies

## Troubleshooting

### Problem: Tables not created
- **Solution**: Make sure you ran `schema.sql` first
- Check the SQL editor for error messages

### Problem: RLS policies failing
- **Solution**: Verify policies were created with `rls_policies.sql`
- Check user is authenticated properly

### Problem: Can't insert data
- **Solution**: Check RLS policies
- Verify user has correct role

### Problem: Categories not showing
- **Solution**: Run `seed_data.sql` to populate categories
- Check `is_active = TRUE` in queries

## Next Steps

After database setup:

1. Test authentication by registering a user
2. Create a test company
3. Create service categories if needed
4. Test RLS policies by trying unauthorized access

---

**Need Help?**

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- RemontCo Issues: Create an issue in the repository

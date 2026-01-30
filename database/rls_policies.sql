-- Row Level Security (RLS) Policies for RemontCo
-- These policies ensure data access is controlled based on user roles

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

-- Anyone can view verified companies
CREATE POLICY "Anyone can view verified companies"
  ON companies FOR SELECT
  USING (is_verified = TRUE AND status = 'approved');

-- Company owners can view their own company
CREATE POLICY "Owners can view own company"
  ON companies FOR SELECT
  USING (owner_id = auth.uid());

-- Company owners can update their own company
CREATE POLICY "Owners can update own company"
  ON companies FOR UPDATE
  USING (owner_id = auth.uid());

-- Company members can view their company
CREATE POLICY "Members can view their company"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = companies.id AND user_id = auth.uid()
    )
  );

-- Anyone authenticated can create a company
CREATE POLICY "Authenticated users can create company"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Admins can view all companies
CREATE POLICY "Admins can view all companies"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any company
CREATE POLICY "Admins can update any company"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMPANY MEMBERS POLICIES
-- =====================================================

-- Company owners can manage members
CREATE POLICY "Owners can manage members"
  ON company_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_members.company_id AND owner_id = auth.uid()
    )
  );

-- Members can view other members of their company
CREATE POLICY "Members can view company members"
  ON company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SERVICE CATEGORIES POLICIES
-- =====================================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
  ON service_categories FOR SELECT
  USING (is_active = TRUE);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON service_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMPANY SERVICES POLICIES
-- =====================================================

-- Anyone can view company services for verified companies
CREATE POLICY "Anyone can view verified company services"
  ON company_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_services.company_id 
      AND is_verified = TRUE 
      AND status = 'approved'
    )
  );

-- Company owners/members can manage their services
CREATE POLICY "Company can manage own services"
  ON company_services FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- JOBS POLICIES
-- =====================================================

-- Consumers can view their own jobs
CREATE POLICY "Consumers can view own jobs"
  ON jobs FOR SELECT
  USING (consumer_id = auth.uid());

-- Consumers can create jobs
CREATE POLICY "Consumers can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    consumer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'consumer'
    )
  );

-- Consumers can update their own jobs
CREATE POLICY "Consumers can update own jobs"
  ON jobs FOR UPDATE
  USING (consumer_id = auth.uid());

-- Consumers can delete their own draft jobs
CREATE POLICY "Consumers can delete own draft jobs"
  ON jobs FOR DELETE
  USING (consumer_id = auth.uid() AND status = 'draft');

-- Company members can view approved jobs
CREATE POLICY "Companies can view approved jobs"
  ON jobs FOR SELECT
  USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      UNION
      SELECT 1 FROM companies
      WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any job
CREATE POLICY "Admins can update any job"
  ON jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- QUOTES POLICIES
-- =====================================================

-- Consumers can view quotes for their jobs
CREATE POLICY "Consumers can view quotes for their jobs"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = quotes.job_id AND jobs.consumer_id = auth.uid()
    )
  );

-- Company members can view their company's quotes
CREATE POLICY "Companies can view own quotes"
  ON quotes FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Company members can create quotes for approved jobs
CREATE POLICY "Companies can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    offered_by = auth.uid() AND
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM jobs
      WHERE id = quotes.job_id AND status = 'approved'
    )
  );

-- Company members can update their company's quotes
CREATE POLICY "Companies can update own quotes"
  ON quotes FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Consumers can update quotes for their jobs (to accept/reject)
CREATE POLICY "Consumers can respond to quotes"
  ON quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = quotes.job_id AND jobs.consumer_id = auth.uid()
    )
  );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Consumers can view their projects
CREATE POLICY "Consumers can view own projects"
  ON projects FOR SELECT
  USING (consumer_id = auth.uid());

-- Companies can view their projects
CREATE POLICY "Companies can view own projects"
  ON projects FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Projects are created automatically when quote is accepted
CREATE POLICY "System can create projects"
  ON projects FOR INSERT
  WITH CHECK (TRUE);

-- Both parties can update project
CREATE POLICY "Parties can update project"
  ON projects FOR UPDATE
  USING (
    consumer_id = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (TRUE);

-- Consumers can create reviews for their completed projects
CREATE POLICY "Consumers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    consumer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = reviews.project_id 
      AND consumer_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Consumers can update their own reviews
CREATE POLICY "Consumers can update own reviews"
  ON reviews FOR UPDATE
  USING (consumer_id = auth.uid());

-- =====================================================
-- MEDIA POLICIES
-- =====================================================

-- Users can view media they uploaded
CREATE POLICY "Users can view own media"
  ON media FOR SELECT
  USING (uploaded_by = auth.uid());

-- Users can upload media
CREATE POLICY "Users can upload media"
  ON media FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own media
CREATE POLICY "Users can delete own media"
  ON media FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Users can update messages they received (mark as read)
CREATE POLICY "Recipients can update messages"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================

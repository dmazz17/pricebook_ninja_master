
-- Drop existing tables to start fresh
DROP TABLE IF EXISTS "project_time_blocks";
DROP TABLE IF EXISTS "project_tasks";
DROP TABLE IF EXISTS "project_comments";
DROP TABLE IF EXISTS "project_events";
DROP TABLE IF EXISTS "project_metadata";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "company_contacts";
DROP TABLE IF EXISTS "companies";
DROP TABLE IF EXISTS "user_assigned_pricebooks";
DROP TABLE IF EXISTS "product_pricebook_assignments";

-- Create Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    address TEXT
);

-- Create Company Contacts Table
CREATE TABLE company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    job_title TEXT
);

-- Create Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT,
    priority TEXT,
    start_date DATE,
    target_date DATE
);

-- Create Project Metadata Table
CREATE TABLE project_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    estimated_hours NUMERIC,
    purchased_hours NUMERIC,
    hours_used NUMERIC,
    tags TEXT[]
);

-- Create Project Events Table
CREATE TABLE project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT,
    event_date TIMESTAMPTZ DEFAULT now()
);

-- Create Project Comments Table
CREATE TABLE project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES company_contacts(id) ON DELETE SET NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Project Tasks Table
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES company_contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Project Time Blocks Table
CREATE TABLE project_time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES company_contacts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    hours_logged NUMERIC,
    completed_items TEXT
);

-- Create Product-Pricebook Assignments Table
CREATE TABLE product_pricebook_assignments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id TEXT NOT NULL UNIQUE,
    pricebook_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create User-Assigned Pricebooks Table
CREATE TABLE user_assigned_pricebooks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_email TEXT NOT NULL,
    stripe_transaction_id TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    pricebook_url TEXT NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricebook_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assigned_pricebooks ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies to allow public access (for server-side operations with anon key)
CREATE POLICY "Allow public read access on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access on company_contacts" ON company_contacts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read access on project_metadata" ON project_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read access on project_events" ON project_events FOR SELECT USING (true);
CREATE POLICY "Allow public read/write access on project_comments" ON project_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access on project_tasks" ON project_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access on project_time_blocks" ON project_time_blocks FOR SELECT USING (true);

-- Policies for Pricebook Management
CREATE POLICY "Allow public read access on product_pricebook_assignments" ON product_pricebook_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on product_pricebook_assignments" ON product_pricebook_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access on user_assigned_pricebooks" ON user_assigned_pricebooks FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on user_assigned_pricebooks" ON user_assigned_pricebooks FOR ALL USING (true) WITH CHECK (true);


-- Create Storage Bucket Policies
-- This policy allows anyone to upload files to the 'pricebooks' bucket.
-- In a real production app, you would likely restrict this to authenticated admin users.
CREATE POLICY "Allow public uploads to pricebooks bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'pricebooks' );

-- This policy allows anyone to read files from the 'pricebooks' bucket.
CREATE POLICY "Allow public reads from pricebooks bucket"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'pricebooks' );

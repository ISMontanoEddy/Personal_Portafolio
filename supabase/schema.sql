-- ==============================================================================
-- INTERNAL DEVELOPER PORTAL (IDP) & DEVOPS CONTROL CENTER
-- Supabase PostgreSQL Schema with Row Level Security (RLS) & Storage Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- 3.1 PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  client_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('web', 'mobile', 'fullstack')),
  status TEXT NOT NULL DEFAULT 'development' CHECK (status IN ('development', 'production', 'maintenance', 'archived')),
  tech_stack TEXT[] DEFAULT '{}'::TEXT[],
  prod_url TEXT,
  staging_url TEXT,
  hosting_provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 MULTI-REPOSITORIES (1:N with Projects)
CREATE TABLE IF NOT EXISTS public.project_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  label TEXT NOT NULL, -- e.g., 'Frontend', 'Backend', 'Mobile App', 'Infrastructure'
  repo_url TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 MOBILE RELEASES (.apk version management)
CREATE TABLE IF NOT EXISTS public.mobile_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  version_name TEXT NOT NULL, -- e.g., 'v1.2.0'
  build_number INTEGER NOT NULL, -- e.g., 42
  environment TEXT NOT NULL DEFAULT 'release' CHECK (environment IN ('debug', 'release', 'beta', 'staging')),
  changelog TEXT,
  apk_url TEXT NOT NULL, -- Public/Signed URL or external storage link
  storage_path TEXT, -- Internal bucket path if stored in Supabase Storage
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 SUPABASE INSTANCES (Multi-Account Keep-Alive & Deep Links)
CREATE TABLE IF NOT EXISTS public.supabase_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  account_email TEXT NOT NULL,
  project_ref VARCHAR(20) NOT NULL, -- 20 chars project ref
  supabase_url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  keep_alive_table TEXT NOT NULL DEFAULT '_keep_alive',
  last_ping_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('healthy', 'unhealthy', 'pending', 'error')),
  last_response_time_ms INTEGER,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 ZERO-KNOWLEDGE CLIENT CREDENTIALS VAULT
CREATE TABLE IF NOT EXISTS public.vault_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL, -- e.g., 'Gmail Admin', 'AWS Console', 'Vercel Team', 'Stripe Live'
  login_email TEXT,
  encrypted_password TEXT NOT NULL, -- Base64 AES-256-GCM ciphertext
  iv TEXT NOT NULL, -- Base64 12-byte initialization vector
  salt TEXT NOT NULL, -- Base64 16-byte PBKDF2 salt
  recovery_email TEXT,
  encrypted_notes TEXT, -- Base64 ciphertext for 2FA backup codes or recovery keys
  notes_iv TEXT, -- Base64 IV for notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ==============================================================================
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_supabase_instances_updated_at ON public.supabase_instances;
CREATE TRIGGER trigger_supabase_instances_updated_at
  BEFORE UPDATE ON public.supabase_instances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_vault_credentials_updated_at ON public.vault_credentials;
CREATE TRIGGER trigger_vault_credentials_updated_at
  BEFORE UPDATE ON public.vault_credentials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_repos_project_id ON public.project_repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_mobile_releases_project_id ON public.mobile_releases(project_id);
CREATE INDEX IF NOT EXISTS idx_supabase_instances_user_id ON public.supabase_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_credentials_user_id ON public.vault_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_credentials_project_id ON public.vault_credentials(project_id);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supabase_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_credentials ENABLE ROW LEVEL SECURITY;

-- 6.1 PROJECTS RLS
CREATE POLICY "Admin users can select own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- 6.2 REPOSITORIES RLS
CREATE POLICY "Admin users can select own repositories"
  ON public.project_repositories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert own repositories"
  ON public.project_repositories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update own repositories"
  ON public.project_repositories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can delete own repositories"
  ON public.project_repositories FOR DELETE
  USING (auth.uid() = user_id);

-- 6.3 MOBILE RELEASES RLS
CREATE POLICY "Admin users can select own mobile releases"
  ON public.mobile_releases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert own mobile releases"
  ON public.mobile_releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update own mobile releases"
  ON public.mobile_releases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can delete own mobile releases"
  ON public.mobile_releases FOR DELETE
  USING (auth.uid() = user_id);

-- 6.4 SUPABASE INSTANCES RLS
CREATE POLICY "Admin users can select own supabase instances"
  ON public.supabase_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert own supabase instances"
  ON public.supabase_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update own supabase instances"
  ON public.supabase_instances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can delete own supabase instances"
  ON public.supabase_instances FOR DELETE
  USING (auth.uid() = user_id);

-- 6.5 VAULT CREDENTIALS RLS
CREATE POLICY "Admin users can select own vault credentials"
  ON public.vault_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can insert own vault credentials"
  ON public.vault_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update own vault credentials"
  ON public.vault_credentials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can delete own vault credentials"
  ON public.vault_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. SUPABASE STORAGE: PRIVATE BUCKET 'apks' & POLICIES
-- ==============================================================================

-- Create bucket 'apks' as private if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apks',
  'apks',
  false,
  104857600, -- 100MB limit per APK file
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- 7.1 STORAGE RLS POLICIES FOR OBJECTS
-- Authenticated users can read/download APKs from bucket 'apks'
CREATE POLICY "Authenticated users can read apks"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'apks' AND auth.uid() IS NOT NULL);

-- Authenticated users can upload APKs to bucket 'apks'
CREATE POLICY "Authenticated users can upload apks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'apks' AND auth.uid() IS NOT NULL);

-- Authenticated users can update/replace APKs in bucket 'apks'
CREATE POLICY "Authenticated users can update apks"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'apks' AND auth.uid() IS NOT NULL);

-- Authenticated users can delete APKs from bucket 'apks'
CREATE POLICY "Authenticated users can delete apks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'apks' AND auth.uid() IS NOT NULL);

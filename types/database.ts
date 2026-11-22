export type ProjectType = 'web' | 'mobile' | 'fullstack';
export type ProjectStatus = 'development' | 'production' | 'maintenance' | 'archived';
export type ReleaseEnvironment = 'debug' | 'release' | 'beta' | 'staging';
export type SupabaseStatus = 'healthy' | 'unhealthy' | 'pending' | 'error';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name?: string | null;
  type: ProjectType;
  status: ProjectStatus;
  tech_stack: string[];
  prod_url?: string | null;
  staging_url?: string | null;
  hosting_provider?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRepository {
  id: string;
  project_id: string;
  user_id: string;
  label: string;
  repo_url: string;
  branch: string;
  created_at: string;
}

export interface MobileRelease {
  id: string;
  project_id: string;
  user_id: string;
  version_name: string;
  build_number: number;
  environment: ReleaseEnvironment;
  changelog?: string | null;
  apk_url: string;
  storage_path?: string | null;
  file_size_bytes?: number | null;
  created_at: string;
}

export interface SupabaseInstance {
  id: string;
  user_id: string;
  project_id?: string | null;
  name: string;
  account_email: string;
  project_ref: string;
  supabase_url: string;
  anon_key: string;
  keep_alive_table: string;
  last_ping_at?: string | null;
  last_status?: SupabaseStatus | null;
  last_response_time_ms?: number | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultCredential {
  id: string;
  user_id: string;
  project_id?: string | null;
  service_name: string;
  login_email?: string | null;
  encrypted_password: string;
  iv: string;
  salt: string;
  recovery_email?: string | null;
  encrypted_notes?: string | null;
  notes_iv?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecryptedCredential extends VaultCredential {
  decrypted_password?: string;
  decrypted_notes?: string;
}

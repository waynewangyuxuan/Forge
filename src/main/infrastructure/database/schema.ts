/**
 * SQLite Schema Definitions
 * All table creation SQL statements
 */

/**
 * Schema version for migrations
 */
export const SCHEMA_VERSION = 3

/**
 * Projects table - stores project metadata
 * v2: Added github_repo and github_owner columns for GitHub-first design
 */
export const CREATE_PROJECTS_TABLE = `
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  path          TEXT NOT NULL UNIQUE,
  github_repo   TEXT,
  github_owner  TEXT,
  created_at    TEXT NOT NULL,
  archived_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived_at);
CREATE INDEX IF NOT EXISTS idx_projects_github ON projects(github_owner, github_repo);
`

/**
 * Migration SQL from schema version 1 to 2
 * Adds GitHub columns to projects table
 */
export const MIGRATION_V1_TO_V2 = `
ALTER TABLE projects ADD COLUMN github_repo TEXT;
ALTER TABLE projects ADD COLUMN github_owner TEXT;
CREATE INDEX IF NOT EXISTS idx_projects_github ON projects(github_owner, github_repo);
`

/**
 * Versions table - stores project versions (linked to git branches)
 */
export const CREATE_VERSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS versions (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_name    TEXT NOT NULL,
  branch_name     TEXT NOT NULL,
  dev_status      TEXT NOT NULL,
  runtime_status  TEXT NOT NULL,
  created_at      TEXT NOT NULL,

  UNIQUE(project_id, version_name)
);

CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
`

/**
 * Executions table - stores code generation execution records
 */
export const CREATE_EXECUTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS executions (
  id              TEXT PRIMARY KEY,
  version_id      TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  status          TEXT NOT NULL,
  total_tasks     INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  current_task_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_executions_version ON executions(version_id);
`

/**
 * Task attempts table - stores individual task execution attempts
 */
export const CREATE_TASK_ATTEMPTS_TABLE = `
CREATE TABLE IF NOT EXISTS task_attempts (
  id              TEXT PRIMARY KEY,
  execution_id    TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  task_id         TEXT NOT NULL,
  attempt_number  INTEGER NOT NULL,
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  status          TEXT NOT NULL,
  error_message   TEXT,

  UNIQUE(execution_id, task_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_task_attempts_execution ON task_attempts(execution_id);
`

/**
 * Runtime configs table - stores runtime configuration for versions
 */
export const CREATE_RUNTIME_CONFIGS_TABLE = `
CREATE TABLE IF NOT EXISTS runtime_configs (
  version_id      TEXT PRIMARY KEY REFERENCES versions(id) ON DELETE CASCADE,
  trigger_type    TEXT NOT NULL,
  cron_expression TEXT,
  credentials     TEXT,
  updated_at      TEXT NOT NULL
);
`

/**
 * Runs table - stores runtime execution records
 */
export const CREATE_RUNS_TABLE = `
CREATE TABLE IF NOT EXISTS runs (
  id              TEXT PRIMARY KEY,
  version_id      TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  triggered_at    TEXT NOT NULL,
  triggered_by    TEXT NOT NULL,
  completed_at    TEXT,
  status          TEXT NOT NULL,
  exit_code       INTEGER,
  log_path        TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_version ON runs(version_id);
CREATE INDEX IF NOT EXISTS idx_runs_triggered ON runs(triggered_at);
`

/**
 * Credentials table - stores credential metadata (values in keychain)
 */
export const CREATE_CREDENTIALS_TABLE = `
CREATE TABLE IF NOT EXISTS credentials (
  id          TEXT PRIMARY KEY,
  nickname    TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
`

/**
 * Settings table - stores application settings
 */
export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
`

/**
 * Feedback table - stores review feedback for versions
 * v3: Added feedback table for M5 Review flow
 */
export const CREATE_FEEDBACK_TABLE = `
CREATE TABLE IF NOT EXISTS feedback (
  id          TEXT PRIMARY KEY,
  version_id  TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE(version_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_version ON feedback(version_id);
`

/**
 * Migration SQL from schema version 2 to 3
 * Adds feedback table for M5 Review flow
 */
export const MIGRATION_V2_TO_V3 = `
CREATE TABLE IF NOT EXISTS feedback (
  id          TEXT PRIMARY KEY,
  version_id  TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE(version_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_version ON feedback(version_id);
`

/**
 * Schema version table for migrations
 */
export const CREATE_SCHEMA_VERSION_TABLE = `
CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER PRIMARY KEY,
  applied_at  TEXT NOT NULL
);
`

/**
 * All tables in order of creation (respecting foreign key dependencies)
 */
export const ALL_TABLES = [
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_PROJECTS_TABLE,
  CREATE_VERSIONS_TABLE,
  CREATE_EXECUTIONS_TABLE,
  CREATE_TASK_ATTEMPTS_TABLE,
  CREATE_RUNTIME_CONFIGS_TABLE,
  CREATE_RUNS_TABLE,
  CREATE_CREDENTIALS_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_FEEDBACK_TABLE,
]

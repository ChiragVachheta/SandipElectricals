/*
# Admin sessions table

## Purpose
Stores opaque session tokens issued by the admin-login edge function and
checked by admin-api on every request. Supports revocation (logout) and
expiry.

## New Tables
- admin_sessions
  - token (uuid, primary key)
  - expires_at (timestamptz)
  - revoked (boolean, default false)
  - created_at (timestamptz)

## Security
RLS enabled but no policies — this table is only ever accessed via the
service role inside edge functions, never from the browser.
*/

CREATE TABLE IF NOT EXISTS admin_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

/*
  # Create scheduled_content table

  1. New Tables
    - `scheduled_content`
      - `id` (bigint, primary key, auto-increment)
      - `created_at` (timestamp with timezone, default now())
      - `user_id` (bigint, foreign key to users)
      - `content_id` (bigint, foreign key to contents)
      - `status` (text, default 'pending')
      - `scheduled_at` (timestamp with timezone)
      - `posted_at` (timestamp with timezone, nullable)

  2. Security
    - Enable RLS on `scheduled_content` table
    - Add policies for authenticated and anonymous users
*/

-- Create scheduled_content table
CREATE TABLE IF NOT EXISTS scheduled_content (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id bigint REFERENCES users(id),
  content_id bigint REFERENCES contents(id),
  status text DEFAULT 'pending',
  scheduled_at timestamptz,
  posted_at timestamptz
);

-- Enable RLS
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view all scheduled content"
  ON scheduled_content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert scheduled content"
  ON scheduled_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scheduled content"
  ON scheduled_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete scheduled content"
  ON scheduled_content
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for anonymous users (for demo purposes)
CREATE POLICY "Anonymous users can view all scheduled content"
  ON scheduled_content
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert scheduled content"
  ON scheduled_content
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update scheduled content"
  ON scheduled_content
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete scheduled content"
  ON scheduled_content
  FOR DELETE
  TO anon
  USING (true);
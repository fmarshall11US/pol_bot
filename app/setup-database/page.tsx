"use client";

import { useState } from "react";
import { Database, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupDatabasePage() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Expert Override System Schema
-- Run this in your Supabase SQL editor

-- Create expert overrides table
CREATE TABLE IF NOT EXISTS expert_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_question TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  corrected_answer TEXT NOT NULL,
  expert_explanation TEXT,
  expert_id TEXT NOT NULL,
  
  -- Embedding for semantic matching
  question_embedding vector(1536),
  
  -- Metadata
  confidence_threshold FLOAT DEFAULT 0.85,
  is_active BOOLEAN DEFAULT true,
  applies_to_all_documents BOOLEAN DEFAULT false,
  document_ids UUID[] DEFAULT '{}',
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create override usage history table
CREATE TABLE IF NOT EXISTS override_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID REFERENCES expert_overrides(id) ON DELETE CASCADE,
  question_asked TEXT NOT NULL,
  similarity_score FLOAT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create override versions table (for tracking changes)
CREATE TABLE IF NOT EXISTS override_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id UUID REFERENCES expert_overrides(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  corrected_answer TEXT NOT NULL,
  expert_explanation TEXT,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_overrides_active ON expert_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_overrides_embedding ON expert_overrides USING ivfflat (question_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_override_usage_override_id ON override_usage(override_id);
CREATE INDEX IF NOT EXISTS idx_override_usage_created_at ON override_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_override_versions_override_id ON override_versions(override_id);

-- Function to search for relevant overrides
CREATE OR REPLACE FUNCTION search_expert_overrides(
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.85,
  document_ids UUID[] DEFAULT NULL,
  limit_count INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  original_question TEXT,
  corrected_answer TEXT,
  expert_explanation TEXT,
  similarity FLOAT,
  times_used INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    eo.id,
    eo.original_question,
    eo.corrected_answer,
    eo.expert_explanation,
    1 - (eo.question_embedding <=> query_embedding) AS similarity,
    eo.times_used
  FROM expert_overrides eo
  WHERE 
    eo.is_active = true
    AND (1 - (eo.question_embedding <=> query_embedding)) >= GREATEST(similarity_threshold, eo.confidence_threshold)
    AND (
      eo.applies_to_all_documents = true
      OR (document_ids IS NOT NULL AND eo.document_ids && document_ids)
      OR (document_ids IS NULL AND array_length(eo.document_ids, 1) = 0)
    )
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$;

-- Function to record override usage
CREATE OR REPLACE FUNCTION record_override_usage(
  override_id_param UUID,
  question_asked_param TEXT,
  similarity_score_param FLOAT,
  user_id_param TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert usage record
  INSERT INTO override_usage (override_id, question_asked, similarity_score, user_id)
  VALUES (override_id_param, question_asked_param, similarity_score_param, user_id_param);
  
  -- Update override statistics
  UPDATE expert_overrides
  SET 
    times_used = times_used + 1,
    last_used_at = NOW()
  WHERE id = override_id_param;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_expert_overrides_updated_at ON expert_overrides;
CREATE TRIGGER update_expert_overrides_updated_at
BEFORE UPDATE ON expert_overrides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Database Setup Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Run this SQL script in your Supabase dashboard to enable expert overrides
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Expert Override Schema Setup
            </CardTitle>
            <CardDescription>
              Copy and run this SQL script in your Supabase SQL Editor to create the required tables and functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
                <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                  <li>Copy the SQL script below</li>
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Paste and run the script</li>
                  <li>Expert overrides will be enabled!</li>
                </ol>
              </div>

              <div className="relative">
                <Button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 z-10"
                  size="sm"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy SQL
                    </>
                  )}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {sqlScript}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/dashboard">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
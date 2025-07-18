-- Underwriter knowledge/hints system
-- Run this after the main schema

-- Create underwriter hints table
CREATE TABLE IF NOT EXISTS underwriter_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  underwriter_id TEXT NOT NULL, -- In production, reference to user table
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('coverage_interpretation', 'exclusions', 'claims_handling', 'policy_notes', 'risk_assessment', 'regulatory_notes', 'general')),
  tags TEXT[], -- Array of tags for easier searching
  is_global BOOLEAN DEFAULT FALSE, -- If true, applies to all similar policies
  embedding vector(1536), -- For semantic search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policy type knowledge base (global underwriter insights)
CREATE TABLE IF NOT EXISTS policy_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL, -- 'auto', 'cgl', 'property', etc.
  iso_form TEXT, -- ISO form number if applicable
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('coverage_interpretation', 'exclusions', 'claims_handling', 'underwriting_guidelines', 'regulatory_notes', 'common_issues')),
  tags TEXT[],
  underwriter_id TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for underwriter knowledge
CREATE INDEX idx_underwriter_hints_document_id ON underwriter_hints(document_id);
CREATE INDEX idx_underwriter_hints_category ON underwriter_hints(category);
CREATE INDEX idx_underwriter_hints_embedding ON underwriter_hints USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_underwriter_hints_global ON underwriter_hints(is_global);

CREATE INDEX idx_policy_knowledge_type ON policy_knowledge_base(policy_type);
CREATE INDEX idx_policy_knowledge_category ON policy_knowledge_base(category);
CREATE INDEX idx_policy_knowledge_embedding ON policy_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to search underwriter knowledge
CREATE OR REPLACE FUNCTION search_underwriter_knowledge(
  query_embedding vector(1536),
  document_id_param UUID DEFAULT NULL,
  policy_type_param TEXT DEFAULT NULL,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  source TEXT, -- 'document_hint' or 'policy_knowledge'
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Search document-specific hints
  SELECT
    uh.id,
    uh.title,
    uh.content,
    uh.category,
    'document_hint'::TEXT as source,
    1 - (uh.embedding <=> query_embedding) AS similarity
  FROM underwriter_hints uh
  WHERE 
    (document_id_param IS NULL OR uh.document_id = document_id_param)
    OR uh.is_global = true
  
  UNION ALL
  
  -- Search global policy knowledge
  SELECT
    pkb.id,
    pkb.title,
    pkb.content,
    pkb.category,
    'policy_knowledge'::TEXT as source,
    1 - (pkb.embedding <=> query_embedding) AS similarity
  FROM policy_knowledge_base pkb
  WHERE 
    policy_type_param IS NULL OR pkb.policy_type = policy_type_param
  
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
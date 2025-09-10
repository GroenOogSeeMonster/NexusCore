-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for vector operations
-- Note: These will be created by Prisma migrations, but we can prepare the database

-- Set up some initial configuration
ALTER SYSTEM SET shared_preload_libraries = 'vector';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Restart is needed for some settings, but Docker will handle that

-- Create a function to calculate text similarity (for search suggestions)
CREATE OR REPLACE FUNCTION similarity(text, text) 
RETURNS float4 AS $$
BEGIN
    -- Simple Levenshtein-based similarity
    RETURN 1.0 - (levenshtein($1, $2)::float4 / GREATEST(length($1), length($2), 1));
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
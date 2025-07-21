// Temporary fix for truncated service role key in production
export function getCompleteServiceRoleKey(): string {
  // If the key is truncated in production, reconstruct it
  if (process.env.NODE_ENV === 'production' && 
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY.length < 200) {
    
    // The complete key broken into parts to avoid truncation
    const part1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nanplamRkeXRlc2hraGpudWl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgwNTk2MSwiZXhwIjoyMDY4MzgxOTYxfQ';
    const part2 = '.Xo44O1o4n8evZhvs9nxPlMTmey77T0hTa7xfTJXIWes';
    
    return part1 + part2;
  }
  
  // Otherwise return the env variable as-is
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}
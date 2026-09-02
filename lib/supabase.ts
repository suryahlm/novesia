import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://supabasekong-no4cks4gcosokswwk8ogw44s.141.11.160.187.sslip.io';
// Pakai service_role key (self-hosted Supabase, app private)
// Nanti ganti ke anon key + RLS saat implementasi auth
const supabaseKey =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MzY0NDI4MCwiZXhwIjo0OTI5MzE3ODgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.Q5Uqb6mokg6Wgr6WdtCdyOuGc-PT3lNg-KjeT6YnaIA';

// Tanpa auth config — kita skip auth untuk sekarang
// Ini menghindari AsyncStorage error di Expo Go
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgbreulnmqtpcplynqdg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GLNLQ7t8v8jI4dtBo5nNNQ_fLr1HEsU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

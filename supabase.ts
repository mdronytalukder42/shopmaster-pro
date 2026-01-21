
import { createClient } from '@supabase/supabase-js';

// Vercel বা অন্যান্য প্ল্যাটফর্মে ডিপ্লয় করার সময় এই ভেরিয়েবলগুলো Environment Variables হিসেবে সেট করতে হবে।
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tnphspqtmdvrflsshpcd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BAvhFWVUbCuqbLEvAUfvUw_LcnVLGpo';

export const supabase = createClient(supabaseUrl, supabaseKey);

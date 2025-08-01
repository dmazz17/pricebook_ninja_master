import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  throw new Error("Missing or placeholder environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error("Missing or placeholder environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create a single, shared Supabase client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

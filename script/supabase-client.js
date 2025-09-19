const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
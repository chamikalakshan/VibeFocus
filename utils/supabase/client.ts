import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://nvwwxyozfioxrizxaskl.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52d3d4eW96ZmlveHJpenhhc2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTM2MzcsImV4cCI6MjA4MjcyOTYzN30.D9gwyoWq49_oaVwzIqP-q-hQKAJpr9J3h0lmHTxz3uE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

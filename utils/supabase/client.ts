import { createBrowserClient } from '@supabase/ssr'
import { getPublicEnv } from '@/lib/env'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } = getPublicEnv()

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

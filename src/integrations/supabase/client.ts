
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = "https://pzpwedpkifojwhqspibv.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cHdlZHBraWZvandocXNwaWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODI3NzAsImV4cCI6MjA1MDg1ODc3MH0.LnVN_WqmuwZrGkwTK0vKJH9qBRJbdpRCtUJWbVJq-v0"

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

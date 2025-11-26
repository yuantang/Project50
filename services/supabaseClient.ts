
import { createClient } from '@supabase/supabase-js';

// In a production build, these should be environment variables.
// For this demo/sandbox, we are using the provided credentials directly.
const SUPABASE_URL = 'https://bednkvrnafsuzofmzxgg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZG5rdnJuYWZzdXpvZm16eGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTgwNzIsImV4cCI6MjA3OTY5NDA3Mn0.Sgbc73eKKhI0GSB-9hwRtOtYfPWxMR0X8Q-e4SzP8Lk';

// Create a single supabase client for interacting with your database
// We check if the URL is valid to avoid crashing if config is missing
const isValidConfig = SUPABASE_URL && SUPABASE_URL.startsWith('http') && SUPABASE_KEY;

export const supabase = createClient(
  isValidConfig ? SUPABASE_URL : 'https://placeholder.supabase.co', 
  isValidConfig ? SUPABASE_KEY : 'placeholder'
);

export const isSupabaseConfigured = () => {
  return isValidConfig;
};

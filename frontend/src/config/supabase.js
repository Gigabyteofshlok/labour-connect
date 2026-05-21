// SUPABASE CLIENT INITIALIZATION AND CONFIGURATION
// Provides standard database replication and Realtime channel listeners.
// Gracefully returns null if parameters are missing to guarantee simulation fallback protection.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Using custom JWT authStore instead
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('✨ [SUPABASE] Realtime client initialized successfully.');
  } catch (err) {
    console.warn('⚠️ [SUPABASE] Client initialization failed:', err.message);
  }
} else {
  console.warn('⚠️ [SUPABASE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Operating in fallback simulator mode.');
}

export { supabase };

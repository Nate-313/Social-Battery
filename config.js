// Settings for the Friends feature. Leave these empty to run Battery without friends.
// Find both values in your Supabase project under Project Settings → API (see README.md).
// The anon / publishable key is meant to be public: the database only allows the
// battery_* functions in supabase/schema.sql, so it's safe to commit.
window.BATTERY_CONFIG = {
  supabaseUrl: '',     // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: '', // the "anon" or "publishable" key
};

// Settings for the Friends feature. Leave these empty to run Battery without friends.
// Find both values in your Supabase project under Project Settings → API (see README.md).
// The anon / publishable key is meant to be public: the database only allows the
// battery_* functions in supabase/schema.sql, so it's safe to commit.
window.BATTERY_CONFIG = {
  supabaseUrl: 'https://cektqnmufwjaljtbvlbi.supabase.co',     // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla3Rxbm11ZndqYWxqdGJ2bGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMjg4NDcsImV4cCI6MjEwNzYwNDg0N30.PzFVniTe-lvF7KwGMXmQDubUXEhzJFn04XiYYeQn_qQ', // the "anon" or "publishable" key
};

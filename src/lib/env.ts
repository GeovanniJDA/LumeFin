const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Check your .env file and ensure it contains ${key}=your_value`
    )
  }
})

export const env = {
  supabaseUrl: requiredEnvVars.VITE_SUPABASE_URL,
  supabaseAnonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
}

export const DEV_AUTH_COOKIE = "orgabuddy-dev-session";
export const DEV_AUTH_PASSWORD = process.env.DEV_AUTH_PASSWORD || "DemoPass123!";

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

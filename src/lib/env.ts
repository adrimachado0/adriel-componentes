// Public runtime configuration. Every variable here is NEXT_PUBLIC_* and ends up
// in the client bundle, so nothing secret may ever be added to this file.
// process.env.NEXT_PUBLIC_* must be referenced literally so Next can inline it.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name} (see .env.example)`);
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl: required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
  whatsappNumber: required(
    "NEXT_PUBLIC_WHATSAPP_NUMBER",
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  ),
  instagramUrl: required(
    "NEXT_PUBLIC_INSTAGRAM_URL",
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  ),
  contactEmail: required(
    "NEXT_PUBLIC_CONTACT_EMAIL",
    process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  ),
} as const;

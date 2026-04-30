import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import AdminMemberEditClient from "@/components/AdminMemberEditClient";

export const dynamic = "force-dynamic";

export default async function AdminMemberEditPage() {
  // ----------------------------
  // Supabase SSR client
  // ----------------------------
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // ----------------------------
  // Auth
  // ----------------------------
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) redirect("/login");

  // ----------------------------
  // Admin gate (server-side)
  // ----------------------------
  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (meError) {
    throw new Error(`DEBUG: failed loading current user profile: ${meError.message}`);
  }

  if (me?.role !== "admin") redirect("/dashboard");

  // ✅ If we got here, user is admin. Hand off to client editor that reads URL param.
  return <AdminMemberEditClient />;
}
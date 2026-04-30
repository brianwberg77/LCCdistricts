import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  cell_phone: string | null;
  member_number: string | null;
  cdga_number: string | null;
  role: string | null;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/login");

  const userId = userData.user.id;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found: " + (error?.message ?? ""));
  }

  async function saveProfile(formData: FormData) {
    "use server";

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
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {}
          },
        },
      }
    );

    // IMPORTANT: only update allowed fields
    const payload = {
      first_name: String(formData.get("first_name") || "").trim() || null,
      last_name: String(formData.get("last_name") || "").trim() || null,
      cell_phone: String(formData.get("cell_phone") || "").trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);

    if (error) {
      redirect("/profile?notice=" + encodeURIComponent("Save failed: " + error.message));
    }

    redirect("/profile?notice=" + encodeURIComponent("Profile updated."));
  }

  const p = profile as ProfileRow;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <h1 className="text-4xl font-serif text-[#0a2540]">My Profile</h1>
        <p className="text-gray-600">Update your contact info.</p>
      </div>

      {searchParams?.notice ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
          {searchParams.notice}
        </div>
      ) : null}

      <section className="bg-white rounded-2xl shadow-xl p-8">
        <form action={saveProfile} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                name="first_name"
                defaultValue={p.first_name ?? ""}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                name="last_name"
                defaultValue={p.last_name ?? ""}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cell Phone</label>
            <input
              name="cell_phone"
              defaultValue={p.cell_phone ?? ""}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Member Club #</label>
              <input
                value={p.member_number ?? ""}
                disabled
                className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Admin-controlled</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CDGA #</label>
              <input
                value={p.cdga_number ?? ""}
                disabled
                className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Admin-controlled</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={p.email ?? userData.user.email ?? ""}
              disabled
              className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Email changes require admin support.</p>
          </div>

          <button className="px-6 py-2 bg-[#0a2540] text-white rounded-lg hover:bg-black">
            Save Profile
          </button>
        </form>
      </section>
    </main>
  );
}
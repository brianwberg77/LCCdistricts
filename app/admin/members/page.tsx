import Link from "next/link";
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

export default async function AdminMembersPage({
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  const { data: members, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, cell_phone, member_number, cdga_number, role")
    .order("last_name", { ascending: true });

  if (error) throw new Error("Failed to load members: " + error.message);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">Admin – Members</h1>
          <p className="text-gray-600">Click Edit to modify a member profile.</p>
        </div>

        <Link href="/admin" className="text-sm text-blue-700">
          ← Back to Roster Builder
        </Link>
      </div>

      {searchParams?.notice ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
          {searchParams.notice}
        </div>
      ) : null}

      <section className="bg-white rounded-2xl shadow-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Edit Link (DEBUG)</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>

            <tbody>
              {(members as ProfileRow[]).map((m) => {
                const editHref = `/admin/members/${m.id}`;

                return (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {m.last_name ?? ""}{m.last_name && m.first_name ? ", " : ""}{m.first_name ?? ""}
                    </td>

                    <td className="py-3 px-4">{m.email ?? "—"}</td>

                    <td className="py-3 px-4 capitalize">{m.role ?? "member"}</td>

                    {/* DEBUG PROOF OF HREF */}
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {editHref}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={editHref}
                        prefetch={false}
                        className="text-blue-700 hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {(!members || members.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Debug note: Next.js can prefetch routes automatically; we disabled Link prefetch here to reduce noise. 
        </p>
      </section>
    </main>
  );
}
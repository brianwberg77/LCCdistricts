import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { formatEventDateTime, formatRsvpCutoff } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const { data: events, error } = await supabase
    .from("events")
    .select("id, date, hosting_club, opponent_club, rsvp_cutoff")
    .order("date");

  if (error) throw new Error(error.message);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-serif">Dashboard</h1>

      {events?.map((e) => (
        <div key={e.id} className="border rounded-xl p-6 bg-white">
          <h2 className="text-lg font-medium">
            {e.hosting_club} vs {e.opponent_club}
          </h2>

          <p className="text-sm text-gray-600">
            {formatEventDateTime(e.date)}
          </p>

          {e.rsvp_cutoff && (
            <p className="text-sm text-gray-500">
              RSVP cutoff: {formatRsvpCutoff(e.rsvp_cutoff)}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { formatEventDateTime, formatRsvpCutoff } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  date: string;
  hosting_club: string;
  hosting_location: string | null;
  opponent_club: string;
  cost: number;
  notes: string | null;
  rsvp_cutoff: string | null;
};

export default async function PublicSchedulePage() {
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

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, date, hosting_club, hosting_location, opponent_club, cost, notes, rsvp_cutoff"
    )
    .gte("date", new Date().toISOString())
    .order("date");

  if (error) throw new Error(error.message);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-4xl font-serif">Schedule</h1>
      <p className="text-gray-600">All times shown in Central Time (CT).</p>

      <div className="grid gap-6">
        {events?.map((e) => {
          const title =
            e.opponent_club === "BYE WEEK"
              ? `${e.hosting_club} — Bye Week`
              : e.opponent_club === "FINALS"
              ? `${e.hosting_club} — Finals`
              : `${e.hosting_club} vs ${e.opponent_club}`;

          const isHostingWeek =
            e.notes?.toLowerCase().includes("hosting") ?? false;

          return (
            <div
              key={e.id}
              className={`rounded-xl border p-6 bg-white ${
                isHostingWeek ? "border-yellow-400 ring-1 ring-yellow-400" : ""
              }`}
            >
              <h2 className="text-xl font-medium">{title}</h2>

              <p className="text-sm text-gray-600 mt-1">
                {formatEventDateTime(e.date)}
                {" • "}
                {e.hosting_location || "Location TBD"}
              </p>

              {isHostingWeek && (
                <span className="inline-block mt-2 text-xs font-semibold bg-yellow-100 px-3 py-1 rounded-full">
                  Hosting Week
                </span>
              )}

              <p className="mt-2 text-sm">Cost: ${e.cost}</p>

              {e.rsvp_cutoff && (
                <p className="text-sm text-gray-500">
                  RSVP cutoff:{" "}
                  <strong>{formatRsvpCutoff(e.rsvp_cutoff)}</strong>
	<a
				href={`/api/events/${e.id}/calendar`}
				className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
				>
				📅 Add to Calendar
				</a>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

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


const formatLocalICS = (d: Date) =>
  d
    .toLocaleString("sv-SE", { timeZone: "America/Chicago" })
    .replace(" ", "T")
    .replace(/[-:]/g, "");


  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, date, hosting_club, hosting_location, opponent_club, cost, notes"
    )
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  /* ----------------------------
     Build calendar fields
  ----------------------------- */

  const start = new Date(event.date);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000); // 4‑hour block

  const formatICSDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const title =
    event.opponent_club === "BYE WEEK"
      ? `${event.hosting_club} — Bye Week`
      : event.opponent_club === "FINALS"
      ? `${event.hosting_club} — Finals`
      : `${event.hosting_club} vs ${event.opponent_club}`;

  const descriptionParts = [];

  if (event.cost && event.cost > 0) {
    descriptionParts.push(`Cost: $${event.cost}`);
  }

  if (event.notes) {
    descriptionParts.push(event.notes);
  }

  const description = descriptionParts.join("\\n\\n");

  /* ----------------------------
     ICS payload
  ----------------------------- */

  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lincolnshire Country Club//District Roster//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${event.id}@lcc-district
DTSTAMP:${formatICSDate(new Date())}
DTSTART;TZID=America/Chicago:${formatLocalICS(start)}
DTEND;TZID=America/Chicago:${formatLocalICS(end)}
SUMMARY:${title}
LOCATION:${event.hosting_location || "TBD"}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR
`.trim();

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}.ics"`,
    },
  });
}
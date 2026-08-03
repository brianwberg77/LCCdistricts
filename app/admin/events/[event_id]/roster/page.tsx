import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RosterRow = {
    profile_id: string;
    role: "playing" | "alternate";
    selected_at: string;
    updated_at: string;
};

type ProfileRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    cell_phone: string | null;
    handicap_index: number | null;
};

type RosterStatus = "Draft" | "Sent" | "Changed";

export default async function RosterReviewPage({
    params,
}: {
    params: Promise<{ event_id: string }>;
}) {
    const { event_id } = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    /* ---------- Auth ---------- */
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) redirect("/login");

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) redirect("/dashboard");

    /* ---------- Load Event ---------- */
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select(
            "id, date, hosting_club, opponent_club, hosting_location, roster_last_emailed_at"
        )
        .eq("id", event_id)
        .single();

    if (eventError || !event) {
        console.error(eventError);
        throw new Error("Unable to load event");
    }

    /* ---------- Load Roster ---------- */
    const { data: rosterRows, error: rosterError } = await supabase
        .from("event_roster")
        .select("profile_id, role, selected_at, updated_at")
        .eq("event_id", event_id);

    if (rosterError) {
        console.error(rosterError);
        throw new Error("Unable to load roster");
    }

    let roster: (RosterRow & { profile: ProfileRow })[] = [];
    const rsvpMap = new Map<string, string>();

    if (rosterRows && rosterRows.length > 0) {
        const profileIds = rosterRows.map((r) => r.profile_id);

        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, cell_phone, handicap_index")
            .in("id", profileIds);

        if (profilesError) {
            console.error(profilesError);
            throw new Error("Unable to load profiles");
        }

        /* ---------- Load current RSVP status for rostered players ---------- */
        const { data: rsvps } = await supabase
            .from("rsvps")
            .select("profile_id, status")
            .eq("event_id", event_id)
            .in("profile_id", profileIds);

        (rsvps ?? []).forEach((r) => {
            rsvpMap.set(r.profile_id, r.status);
        });

        roster = rosterRows.map((r) => ({
            ...r,
            profile: profiles!.find((p) => p.id === r.profile_id)!,
        }));
    }

    const playing = roster.filter((r) => r.role === "playing");
    const alternates = roster.filter((r) => r.role === "alternate");

    /* ---------- Status Logic ---------- */
    let rosterStatus: RosterStatus = "Draft";

    if (event.roster_last_emailed_at) {
        const lastEmailedAt = new Date(event.roster_last_emailed_at);
        const changed = roster.some(
            (r) => new Date(r.updated_at) > lastEmailedAt
        );
        rosterStatus = changed ? "Changed" : "Sent";
    }

    const canSendRosterEmail = roster.length > 0 && rosterStatus !== "Sent";

    /* ---------- Conflict detection ---------- */
    const conflicts = roster.filter(
        (r) => rsvpMap.get(r.profile_id) === "No"
    );

    /* ---------- Render ---------- */
    return (
        <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10 space-y-6 md:space-y-8">
            <div className="text-sm text-gray-500 flex gap-4">
                <Link href="/admin" className="hover:underline">
                    &larr; Back to Builder
                </Link>

                <span className="text-gray-300">|</span>

                <Link href="/admin/events" className="hover:underline">
                    Back to Events
                </Link>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif">
                        Roster &ndash; {event.hosting_club} vs {event.opponent_club}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleString()} &bull;{" "}
                        {event.hosting_location}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`px-3 py-1 rounded text-sm font-medium ${rosterStatus === "Draft"
                                ? "bg-gray-100 text-gray-700"
                                : rosterStatus === "Sent"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                    >
                        {rosterStatus}
                    </span>

                    {canSendRosterEmail && (
                        <form
                            method="POST"
                            action={`/admin/events/${event_id}/roster/send-email`}
                        >
                            <button className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
                                Send Roster Email
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="text-sm text-gray-700">
                {playing.length} Playing &bull; {alternates.length} Alternates
            </div>

            {/* Conflict warning */}
            {conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
                    <div className="font-semibold mb-1">
                        Attention: {conflicts.length} rostered{" "}
                        {conflicts.length === 1 ? "player has" : "players have"} changed
                        their RSVP to No
                    </div>
                    <div>
                        {conflicts
                            .map(
                                (c) => `${c.profile.first_name} ${c.profile.last_name}`
                            )
                            .join(", ")}
                    </div>
                    <div className="mt-2 text-red-700">
                        Use the Remove button below to take them off this roster.
                    </div>
                </div>
            )}

            {roster.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
                    No players have been added to this roster yet.
                </div>
            )}

            {roster.length > 0 && (
                <div className="bg-white border rounded-lg overflow-x-auto">
                    <table className="min-w-[860px] w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left whitespace-nowrap">Name</th>
                                <th className="px-3 py-2 text-left">HCP</th>
                                <th className="px-3 py-2 text-left">RSVP</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Phone</th>
                                <th className="px-3 py-2 text-left"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.map((r) => {
                                const rsvpStatus = rsvpMap.get(r.profile_id) ?? "None";
                                const isConflict = rsvpStatus === "No";

                                return (
                                    <tr
                                        key={r.profile_id}
                                        className={`border-t ${isConflict ? "bg-red-50" : ""}`}
                                    >
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {r.profile.last_name}, {r.profile.first_name}
                                        </td>

                                        <td className="px-3 py-2">
                                            {r.profile.handicap_index ?? "—"}
                                        </td>

                                        <td className="px-3 py-2">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${rsvpStatus === "Yes"
                                                        ? "bg-green-100 text-green-800"
                                                        : rsvpStatus === "Maybe"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : rsvpStatus === "No"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {rsvpStatus}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2">
                                            <form
                                                method="POST"
                                                action={`/admin/events/${event_id}/roster/update-role`}
                                                className="inline-flex rounded border overflow-hidden"
                                            >
                                                <input type="hidden" name="event_id" value={event_id} />
                                                <input
                                                    type="hidden"
                                                    name="profile_id"
                                                    value={r.profile_id}
                                                />

                                                <button
                                                    type="submit"
                                                    name="role"
                                                    value="playing"
                                                    className={`px-3 py-1 text-sm ${r.role === "playing"
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-white text-gray-700"
                                                        }`}
                                                >
                                                    Playing
                                                </button>

                                                <button
                                                    type="submit"
                                                    name="role"
                                                    value="alternate"
                                                    className={`px-3 py-1 text-sm border-l ${r.role === "alternate"
                                                            ? "bg-yellow-500 text-white"
                                                            : "bg-white text-gray-700"
                                                        }`}
                                                >
                                                    Alternate
                                                </button>
                                            </form>
                                        </td>

                                        <td className="px-3 py-2 break-all">{r.profile.email}</td>

                                        <td className="px-3 py-2">
                                            {r.profile.cell_phone ?? "—"}
                                        </td>

                                        <td className="px-3 py-2">
                                            <form
                                                method="POST"
                                                action={`/admin/events/${event_id}/roster/remove`}
                                            >
                                                <input
                                                    type="hidden"
                                                    name="profile_id"
                                                    value={r.profile_id}
                                                />
                                                <button
                                                    type="submit"
                                                    className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                                                >
                                                    Remove
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

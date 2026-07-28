import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PlayerStat = {
    profile_id: string;
    first_name: string | null;
    last_name: string | null;
    times_played: number;
    times_alternate: number;
    last_played: string | null;
};

function formatDate(d: string | null) {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default async function PlayerUsageDashboardPage() {
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

    /* ---------- Load stats ---------- */
    const { data: stats, error } = await supabase.rpc("get_player_stats");

    if (error) {
        console.error(error);
        throw new Error("Failed to load player stats");
    }

    const players = (stats ?? []) as PlayerStat[];

    const totalPlayed = players.reduce((sum, p) => sum + p.times_played, 0);
    const neverPlayed = players.filter((p) => p.times_played === 0).length;

    return (
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-serif text-[#0a2540]">
                        Player Usage Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Play counts and fairness tracking for active golfers.
                    </p>
                </div>

                <Link href="/admin" className="text-sm text-blue-700 hover:underline">
                    &larr; Back to Roster Builder
                </Link>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Active Golfers</div>
                    <div className="text-2xl font-semibold">{players.length}</div>
                </div>
                <div className="bg-white border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Total Rounds Played</div>
                    <div className="text-2xl font-semibold">{totalPlayed}</div>
                </div>
                <div className="bg-white border rounded-xl p-4">
                    <div className="text-sm text-gray-500">Have Not Played Yet</div>
                    <div className="text-2xl font-semibold">{neverPlayed}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="min-w-[600px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Played</th>
                            <th className="px-3 py-2 text-left">Alternate</th>
                            <th className="px-3 py-2 text-left">Last Played</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((p) => {
                            const underused = p.times_played === 0;

                            return (
                                <tr
                                    key={p.profile_id}
                                    className={`border-t ${underused ? "bg-red-50" : ""}`}
                                >
                                    <td className="px-3 py-2">
                                        {p.last_name}, {p.first_name}
                                        {underused && (
                                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                Not yet played
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 font-medium">{p.times_played}</td>
                                    <td className="px-3 py-2">{p.times_alternate}</td>
                                    <td className="px-3 py-2">{formatDate(p.last_played)}</td>
                                </tr>
                            );
                        })}

                        {players.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-3 py-6 text-gray-500">
                                    No active golfers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500">
                Sorted by fewest rounds played to support fair roster selection.
            </p>
        </main>
    );
}

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/* ------------------------
   Types
------------------------- */
type ProfileLite = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type RSVPRow = {
  id: string
  event_id: string
  profile_id: string
  status: 'Yes' | 'Maybe' | 'No'
  comments?: string | null
  profiles: ProfileLite | ProfileLite[]
}

type EventRow = {
  id: string
  date: string
  rsvp_cutoff?: string | null
  hosting_club: string
  hosting_location?: string | null
  opponent_club: string
}

type RosterRow = {
  event_id: string
  profile_id: string
  role: string
}

/* ------------------------
   Helpers
------------------------- */
function formatDisplayDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatDisplayTime(d: string) {
  return new Date(d).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/* ------------------------
   Page
------------------------- */
export default async function AdminRosterPage() {
  /* ---------- Supabase ---------- */
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  /* ---------- Auth ---------- */
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/dashboard')

  /* ---------- Load data ---------- */
  const { data: events } = await supabase
    .from('events')
    .select('id, date, rsvp_cutoff, hosting_club, hosting_location, opponent_club')
    .order('date', { ascending: true })

  // ✅ Only RSVPs with ACTIVE golfers
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select(`
      id,
      event_id,
      profile_id,
      status,
      comments,
      profiles!inner (
        id,
        first_name,
        last_name,
        email,
        is_active
      )
    `)
    .eq('profiles.is_active', true)

  const { data: roster } = await supabase
    .from('event_roster')
    .select('event_id, profile_id, role')

  /* ---------- Build selected map ---------- */
  const selectedMap = new Map<string, Set<string>>()
  ;(roster ?? []).forEach((r: RosterRow) => {
    if (!selectedMap.has(r.event_id)) {
      selectedMap.set(r.event_id, new Set())
    }
    selectedMap.get(r.event_id)!.add(r.profile_id)
  })

  const now = new Date()

  /* ---------- Render ---------- */
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">
            Admin – Roster Builder
          </h1>
          <p className="text-gray-600">
            Select players from confirmed RSVPs.
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <Link href="/admin/events" className="text-[#0a2540] hover:underline">
            Manage Events →
          </Link>
          <Link href="/admin/members" className="text-[#0a2540] hover:underline">
            Manage Members →
                  </Link>
          <Link href="/admin/communications" className="text-[#0a2540] hover:underline">
                      Admin Communications →
          </Link>
        </div>
      </div>

      {/* Events */}
      {(events ?? []).map((event: EventRow) => {
        const eventRSVPs = (rsvps ?? []).filter(r => r.event_id === event.id)
        const yes = eventRSVPs.filter(r => r.status === 'Yes')
        const maybe = eventRSVPs.filter(r => r.status === 'Maybe')
        const no = eventRSVPs.filter(r => r.status === 'No')

        const cutoff = event.rsvp_cutoff ? new Date(event.rsvp_cutoff) : null
        const locked = cutoff ? now > cutoff : false
        const selected = selectedMap.get(event.id) ?? new Set<string>()

        return (
          <section
            key={event.id}
            className="bg-white rounded-2xl shadow-xl p-4 md:p-8 space-y-6"
          >
            {/* Event Header */}
            <div className="flex justify-between gap-6">
              <div>
                <h2 className="text-2xl font-medium">
                  {formatDisplayDate(event.date)}
                </h2>
                <div className="text-gray-600">
                  {event.hosting_club} vs {event.opponent_club}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDisplayTime(event.date)}
                  {event.hosting_location ? ` • ${event.hosting_location}` : ''}
                </div>
                {cutoff && (
                  <div
                    className={`text-sm mt-1 ${
                      locked ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    RSVP Cutoff: {cutoff.toLocaleString()} {locked && '🔒'}
                  </div>
                )}
              </div>

              {/* RSVP Summary */}
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                  ✅ Yes: {yes.length}
                </span>
                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                  ❓ Maybe: {maybe.length}
                </span>
                <span className="px-2 py-1 rounded bg-red-100 text-red-800">
                  ❌ No: {no.length}
                </span>
              </div>
			  
<Link
    href={`/admin/events/${event.id}/roster`}
    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 md:ml-auto"
  >
    View Roster
  </Link>


            </div>

            {/* ✅ YES CANDIDATES */}
            <div className="space-y-3">
              <h3 className="font-semibold">Roster Candidates (Yes)</h3>

              {yes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No confirmed availability yet.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {yes.map(r => {
                    const profile = Array.isArray(r.profiles)
                      ? r.profiles[0]
                      : r.profiles

                    if (!profile) return null
                    const isSelected = selected.has(profile.id)

                    return (
                      <div
                        key={r.id}
                        className="border rounded-lg p-3 flex justify-between items-start gap-3"
                      >
                        <div>
                          <div className="font-medium">
                            {profile.last_name}, {profile.first_name}
                          </div>
                          {r.comments && (
                            <div className="text-xs text-gray-500 italic">
                              “{r.comments}”
                            </div>
                          )}
                        </div>

                        <form action="/admin/events/roster/select" method="POST">
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="profile_id" value={profile.id} />
                          <input
                            type="hidden"
                            name="action"
                            value={isSelected ? 'remove' : 'add'}
                          />
                          <button
                            className={`px-3 py-2 rounded-lg text-sm ${
                              isSelected
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {isSelected ? 'Remove' : 'Select'}
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ✅ MAYBE CANDIDATES */}
            {maybe.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-yellow-800">
                  Possible Candidates (Maybe)
                </h3>

                <div className="grid md:grid-cols-2 gap-3">
                  {maybe.map(r => {
                    const profile = Array.isArray(r.profiles)
                      ? r.profiles[0]
                      : r.profiles

                    if (!profile) return null
                    const isSelected = selected.has(profile.id)

                    return (
                      <div
                        key={r.id}
                        className="border rounded-lg p-3 flex justify-between items-start gap-3 bg-yellow-50"
                      >
                        <div>
                          <div className="font-medium">
                            {profile.last_name}, {profile.first_name}
                          </div>
                          <div className="text-xs font-medium text-yellow-700">
                            RSVP: Maybe
                          </div>
                          {r.comments && (
                            <div className="text-xs text-gray-500 italic">
                              “{r.comments}”
                            </div>
                          )}
                        </div>

                        <form action="/admin/events/roster/select" method="POST">
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="profile_id" value={profile.id} />
                          <input
                            type="hidden"
                            name="action"
                            value={isSelected ? 'remove' : 'add'}
                          />
                          <button
                            className={`px-3 py-2 rounded-lg text-sm ${
                              isSelected
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                            }`}
                          >
                            {isSelected ? 'Remove' : 'Select'}
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </main>
  )
}
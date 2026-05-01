import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type RosterRow = {
  profile_id: string
  role: 'playing' | 'alternate'
  selected_at: string
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  cell_phone: string | null
  handicap_index: number | null
}

export default async function RosterReviewPage({
  params,
}: {
  params: Promise<{ event_id: string }>
}) {
  // ✅ REQUIRED in newer Next.js
  const { event_id } = await params

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  /* ---------- Auth ---------- */
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/dashboard')

  /* ---------- Load Event ---------- */
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, date, hosting_club, opponent_club, hosting_location')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    console.error(eventError)
    throw new Error('Unable to load event')
  }

  /* ---------- Load Roster ---------- */
  const { data: rosterRows, error: rosterError } = await supabase
    .from('event_roster')
    .select('profile_id, role, selected_at')
    .eq('event_id', event_id)

  if (rosterError) {
    console.error(rosterError)
    throw new Error('Unable to load roster')
  }

  let roster: (RosterRow & { profile: ProfileRow })[] = []

  if (rosterRows && rosterRows.length > 0) {
    const profileIds = rosterRows.map(r => r.profile_id)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, cell_phone, handicap_index')
      .in('id', profileIds)

    if (profilesError) {
      console.error(profilesError)
      throw new Error('Unable to load profiles')
    }

    roster = rosterRows.map(r => ({
      ...r,
      profile: profiles!.find(p => p.id === r.profile_id)!,
    }))
  }

  const playing = roster.filter(r => r.role === 'playing')
  const alternates = roster.filter(r => r.role === 'alternate')

  /* ---------- Render ---------- */
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Back */}
      <div className="text-sm text-gray-500">
        <Link href="/admin/events">← Back to Events</Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif">
            Roster – {event.hosting_club} vs {event.opponent_club}
          </h1>
          <p className="text-sm text-gray-600">
            {new Date(event.date).toLocaleString()} •{' '}
            {event.hosting_location}
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-gray-100 text-sm">
          Draft
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6 text-sm">
          <Link
            href={`/admin/events/${event_id}/roster`}
            className="pb-2 border-b-2 border-blue-600 text-blue-600"
          >
            Roster
          </Link>
          <Link
            href={`/admin/events/${event_id}/pairings`}
            className="pb-2 text-gray-400"
          >
            Pairings
          </Link>
          <Link
            href={`/admin/events/${event_id}/emails`}
            className="pb-2 text-gray-400"
          >
            Emails
          </Link>
        </nav>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-700">
        {playing.length} Playing • {alternates.length} Alternates
      </div>

      {/* Empty */}
      {roster.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
          No players have been added to this roster yet.
        </div>
      )}

      {/* Table */}
      {roster.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">HCP</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(r => (
                <tr key={r.profile_id} className="border-t">
                  <td className="px-3 py-2">
                    {r.profile.last_name}, {r.profile.first_name}
                  </td>
                  <td className="px-3 py-2">
                    {r.profile.handicap_index ?? '—'}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {r.role}
                  </td>
                  <td className="px-3 py-2">
                    {r.profile.email}
                  </td>
                  <td className="px-3 py-2">
                    {r.profile.cell_phone ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
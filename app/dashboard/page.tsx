import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import {
  formatEventDate,
  formatEventTime,
  formatRsvpCutoff,
} from '@/lib/dateUtils'

export const dynamic = 'force-dynamic'

type RsvpRow = {
  member_id: string
  status: 'Yes' | 'No' | 'Maybe'
  comments?: string | null
}

type EventRow = {
  id: string
  date: string
  rsvp_cutoff?: string | null
  hosting_club: string
  opponent_club: string
  rsvps?: RsvpRow[]
}

export default async function DashboardPage() {
  // ----------------------------
  // Supabase
  // ----------------------------
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

  // ----------------------------
  // Auth
  // ----------------------------
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const memberId = userData.user.id

  // ----------------------------
  // Load events + RSVPs
  // ----------------------------
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      date,
      rsvp_cutoff,
      hosting_club,
      opponent_club,
      rsvps (
        member_id,
        status,
        comments
      )
    `)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load dashboard: ${error.message}`)
  }

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-4xl font-serif">Dashboard</h1>
		
<a
    href="/league-info.pdf"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
  >
    ℹ️ League Info
  </a>

      {(events as EventRow[]).map(e => {
        const myRsvp = e.rsvps?.find(r => r.member_id === memberId)
        const rsvpClosed =
          e.rsvp_cutoff &&
          new Date(e.rsvp_cutoff).getTime() < Date.now()

        return (
          <div
            key={e.id}
            className="bg-white border rounded-xl p-5 space-y-2"
          >
            <div className="font-semibold">
              {e.hosting_club} vs {e.opponent_club}
            </div>

            <div className="text-sm text-gray-600">
              {formatEventDate(e.date)} at {formatEventTime(e.date)}
            </div>

            {e.rsvp_cutoff && (
              <div className="text-xs text-gray-500">
                RSVP cutoff: {formatRsvpCutoff(e.rsvp_cutoff)}
              </div>
            )}

            {/* CURRENT RSVP */}
            {myRsvp && (
              <div className="text-sm mt-2">
                Your response:{' '}
                <strong className="uppercase">{myRsvp.status}</strong>
              </div>
            )}

            {/* RSVP CLOSED */}
            {rsvpClosed && (
              <div className="text-sm text-gray-400 mt-2">
                RSVP is closed
              </div>
            )}

            {/* RSVP FORM */}
            {!rsvpClosed && (
              <form
                action="/dashboard/rsvp"
                method="POST"
                className="space-y-2 mt-2"
              >
                <input type="hidden" name="event_id" value={e.id} />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    name="status"
                    value="Yes"
                    className={`px-3 py-1 border rounded ${
                      myRsvp?.status === 'Yes'
                        ? 'bg-green-600 text-white'
                        : ''
                    }`}
                  >
                    Yes
                  </button>

                  <button
                    type="submit"
                    name="status"
                    value="Maybe"
                    className={`px-3 py-1 border rounded ${
                      myRsvp?.status === 'Maybe'
                        ? 'bg-yellow-500 text-white'
                        : ''
                    }`}
                  >
                    Maybe
                  </button>

                  <button
                    type="submit"
                    name="status"
                    value="No"
                    className={`px-3 py-1 border rounded ${
                      myRsvp?.status === 'No'
                        ? 'bg-red-600 text-white'
                        : ''
                    }`}
                  >
                    No
                  </button>
                </div>

                {/* COMMENTS */}
                <textarea
                  name="comments"
                  placeholder="Optional comments (pairing request, availability notes, etc.)"
                  defaultValue={myRsvp?.comments ?? ''}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </form>
            )}
          </div>
        )
      })}
    </main>
  )
}
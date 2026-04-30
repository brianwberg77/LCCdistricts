import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import {
  formatEventDate,
  formatEventTime,
  formatRsvpCutoff,
} from '@/lib/dateUtils'

export const dynamic = 'force-dynamic'

type EventRow = {
  id: string
  date: string
  rsvp_cutoff?: string | null
  hosting_club: string
  hosting_location?: string | null
  opponent_club: string
  cost?: number | null
  notes?: string | null
}

export default async function AdminEventsPage() {
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

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/dashboard')

  // ----------------------------
  // Load events
  // ----------------------------
  const { data: events, error } = await supabase
    .from('events')
    .select(
      'id, date, rsvp_cutoff, hosting_club, hosting_location, opponent_club, cost, notes'
    )
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load events: ${error.message}`)
  }

  // ----------------------------
  // Render (ALL JSX IS HERE)
  // ----------------------------
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <h1 className="text-4xl font-serif">Admin – Events</h1>

      {/* CREATE EVENT */}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-2xl font-medium">Add Event</h2>

        <form
          action="/admin/events/create"
          method="POST"
          className="grid md:grid-cols-2 gap-4"
        >
          <input type="datetime-local" name="date" required />
          <input type="datetime-local" name="rsvp_cutoff" />
          <input name="hosting_club" placeholder="Hosting Club" required />
          <input name="opponent_club" placeholder="Opponent Club" required />
          <input name="hosting_location" placeholder="Location" />
          <input name="cost" type="number" step="0.01" placeholder="Cost" />
          <textarea name="notes" placeholder="Notes" className="md:col-span-2" />
          <button className="md:col-span-2 bg-[#0a2540] text-white py-2 rounded">
            Create Event
          </button>
        </form>
      </section>

      {/* EVENTS LIST */}
      <section className="space-y-4">
        {(events as EventRow[]).map(e => (
          <div key={e.id} className="bg-white border rounded-xl p-5">
            <div className="font-semibold">
              {formatEventDate(e.date)}
            </div>

            <div>
              {e.hosting_club} vs {e.opponent_club}
            </div>

            <div className="text-sm text-gray-600">
              {formatEventTime(e.date)}
              {e.hosting_location ? ` • ${e.hosting_location}` : ''}
            </div>

            {e.rsvp_cutoff && (
              <div className="text-sm text-gray-500">
                RSVP cutoff: {formatRsvpCutoff(e.rsvp_cutoff)}
              </div>
            )}

            {/* EDIT */}
            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Edit event
              </summary>

              <form
                action="/admin/events/update"
                method="POST"
                className="grid md:grid-cols-2 gap-4 mt-3"
              >
                <input type="hidden" name="id" value={e.id} />
                <input
                  type="datetime-local"
                  name="date"
                  defaultValue={e.date.replace(' ', 'T').slice(0, 16)}
                  required
                />
                <input
                  type="datetime-local"
                  name="rsvp_cutoff"
                  defaultValue={
                    e.rsvp_cutoff
                      ? e.rsvp_cutoff.replace(' ', 'T').slice(0, 16)
                      : ''
                  }
                />
                <input name="hosting_club" defaultValue={e.hosting_club} required />
                <input name="opponent_club" defaultValue={e.opponent_club} required />
                <input
                  name="hosting_location"
                  defaultValue={e.hosting_location ?? ''}
                />
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue={e.cost ?? ''}
                />
                <textarea
                  name="notes"
                  defaultValue={e.notes ?? ''}
                  className="md:col-span-2"
                />
                <button className="md:col-span-2 bg-[#0a2540] text-white py-2 rounded">
                  Save Changes
                </button>
              </form>

              {/* DELETE */}
              <form
                action="/admin/events/delete"
                method="POST"
                className="mt-2"
              >
                <input type="hidden" name="id" value={e.id} />
                <button className="bg-red-100 text-red-800 px-4 py-2 rounded">
                  Delete Event
                </button>
              </form>
            </details>
          </div>
        ))}
      </section>
    </main>
  )
}
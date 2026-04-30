import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

type EventRow = {
  id: string;
  date: string;
  rsvp_cutoff?: string | null;
  hosting_club: string;
  hosting_location?: string | null;
  opponent_club: string;
  cost?: number | string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

function isoToDatetimeLocal(value?: string | null) {
  if (!value) return '';

  const d = new Date(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}


function formatDisplayDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDisplayTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
  // --------------------------------------------------
  // SSR Supabase client
  // --------------------------------------------------
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  // --------------------------------------------------
  // Auth + admin check
  // --------------------------------------------------
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect('/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/dashboard');

  // --------------------------------------------------
  // Server Actions
  // --------------------------------------------------
  async function createEvent(formData: FormData) {
    'use server';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) redirect('/login');

    const dateLocal = String(formData.get('date') || '');
    const cutoffLocal = String(formData.get('rsvp_cutoff') || '');
    const hosting_club = String(formData.get('hosting_club') || '');
    const opponent_club = String(formData.get('opponent_club') || '');
    const hosting_location = String(formData.get('hosting_location') || '');
    const costRaw = formData.get('cost');
    const notes = String(formData.get('notes') || '');

    if (!dateLocal || !hosting_club || !opponent_club) {
      redirect('/admin?notice=' + encodeURIComponent('Missing required fields (date, hosting club, opponent club).'));
    }

    const date = new Date(dateLocal).toISOString();
    const rsvp_cutoff = cutoffLocal ? new Date(cutoffLocal).toISOString() : null;
    const cost = costRaw === null || costRaw === '' ? null : Number(costRaw);

    const { error } = await supabase.from('events').insert({
      date,
      rsvp_cutoff,
      hosting_club,
      opponent_club,
      hosting_location,
      cost,
      notes,
      created_by: u.user.id,
    });

    if (error) {
      redirect('/admin?notice=' + encodeURIComponent('Create failed: ' + error.message));
    }

    redirect('/admin?notice=' + encodeURIComponent('Event created.'));
  }

  async function updateEvent(formData: FormData) {
    'use server';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const eventId = String(formData.get('event_id') || '');

    const dateLocal = String(formData.get('date') || '');
    const cutoffLocal = String(formData.get('rsvp_cutoff') || '');
    const hosting_club = String(formData.get('hosting_club') || '');
    const opponent_club = String(formData.get('opponent_club') || '');
    const hosting_location = String(formData.get('hosting_location') || '');
    const costRaw = formData.get('cost');
    const notes = String(formData.get('notes') || '');

    if (!eventId || !dateLocal || !hosting_club || !opponent_club) {
      redirect('/admin?notice=' + encodeURIComponent('Update failed: missing required fields.'));
    }

    const date = new Date(dateLocal).toISOString();
    const rsvp_cutoff = cutoffLocal ? new Date(cutoffLocal).toISOString() : null;
    const cost = costRaw === null || costRaw === '' ? null : Number(costRaw);

    const { error } = await supabase
      .from('events')
      .update({
        date,
        rsvp_cutoff,
        hosting_club,
        opponent_club,
        hosting_location,
        cost,
        notes,
      })
      .eq('id', eventId);

    if (error) {
      redirect('/admin?notice=' + encodeURIComponent('Update failed: ' + error.message));
    }

    redirect('/admin?notice=' + encodeURIComponent('Event updated.'));
  }

  async function deleteEvent(formData: FormData) {
    'use server';

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const eventId = String(formData.get('event_id') || '');
    if (!eventId) redirect('/admin?notice=' + encodeURIComponent('Delete failed: missing event_id.'));

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) redirect('/admin?notice=' + encodeURIComponent('Delete failed: ' + error.message));

    redirect('/admin?notice=' + encodeURIComponent('Event deleted.'));
  }

  // --------------------------------------------------
  // Load events
  // --------------------------------------------------
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (eventsError) throw new Error(`Failed to load events: ${eventsError.message}`);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">Admin – Events</h1>
          <p className="text-gray-600">Create, edit, delete events and RSVP cutoffs.</p>
        </div>
      </div>

      {searchParams?.notice ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
          {searchParams.notice}
        </div>
      ) : null}

      {/* Add Event */}
      <section className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-2xl font-medium">Add New Event</h2>

        <form action={createEvent} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Match Date & Time *</label>
            <input type="datetime-local" name="date" required className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RSVP Cutoff</label>
            <input type="datetime-local" name="rsvp_cutoff" className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hosting Club *</label>
            <input type="text" name="hosting_club" required className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opponent Club *</label>
            <input type="text" name="opponent_club" required className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input type="text" name="hosting_location" className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cost</label>
            <input type="number" step="0.01" name="cost" className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div className="md:col-span-2">
            <button className="px-6 py-2 bg-[#0a2540] text-white rounded-lg hover:bg-black">
              Create Event
            </button>
          </div>
        </form>
      </section>

      {/* Existing Events (with edit) */}
      <section className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-2xl font-medium">Existing Events</h2>

        {(events as unknown as EventRow[]).length === 0 ? (
          <p className="text-gray-600">No events yet.</p>
        ) : (
          <div className="space-y-4">
            {(events as unknown as EventRow[]).map((e) => (
              <div key={e.id} className="border rounded-xl p-4">
                <div className="flex justify-between gap-6">
                  <div>
                    <div className="font-semibold">{formatDisplayDate(e.date)}</div>
                    <div className="text-gray-600">{e.hosting_club} vs {e.opponent_club}</div>
                    <div className="text-sm text-gray-500">{formatDisplayTime(e.date)}</div>
                    {e.rsvp_cutoff ? (
                      <div className="text-sm text-gray-500">
                        Cutoff: {new Date(e.rsvp_cutoff).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Cutoff: (not set)</div>
                    )}
                  </div>

                  <form action={deleteEvent}>
                    <input type="hidden" name="event_id" value={e.id} />
                    <button className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200">
                      Delete
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      Deletes event + RSVPs (if FK cascade)
                    </div>
                  </form>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-[#0a2540]">
                    Edit this event
                  </summary>

                  <form action={updateEvent} className="grid md:grid-cols-2 gap-4 mt-4">
                    <input type="hidden" name="event_id" value={e.id} />

                    <div>
                      <label className="block text-sm font-medium mb-1">Match Date & Time *</label>
                      <input
                        type="datetime-local"
                        name="date"
                        required
                        defaultValue={isoToDatetimeLocal(e.date)}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">RSVP Cutoff</label>
                      <input
                        type="datetime-local"
                        name="rsvp_cutoff"
                        defaultValue={isoToDatetimeLocal(e.rsvp_cutoff)}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Hosting Club *</label>
                      <input
                        type="text"
                        name="hosting_club"
                        required
                        defaultValue={e.hosting_club}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Opponent Club *</label>
                      <input
                        type="text"
                        name="opponent_club"
                        required
                        defaultValue={e.opponent_club}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <input
                        type="text"
                        name="hosting_location"
                        defaultValue={e.hosting_location ?? ''}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        name="cost"
                        defaultValue={e.cost ?? ''}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea
                        name="notes"
                        rows={3}
                        defaultValue={e.notes ?? ''}
                        className="w-full border px-3 py-2 rounded-lg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button className="px-6 py-2 bg-[#0a2540] text-white rounded-lg hover:bg-black">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type RSVPRow = {
  id: string;
  event_id: string;
  status: 'Yes' | 'Maybe' | 'No';
  comments?: string | null;
  profiles: ProfileLite;
};

type EventRow = {
  id: string;
  date: string;
  rsvp_cutoff?: string | null;
  hosting_club: string;
  hosting_location?: string | null;
  opponent_club: string;
};

type RosterRow = {
  event_id: string;
  member_id: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function AdminRosterPage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
  // --------------------------------------------------
  // Supabase SSR client
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
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
  // Server Action: toggle roster selection
  // --------------------------------------------------
  async function toggleRoster(formData: FormData) {
    'use server';

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
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    const event_id = String(formData.get('event_id'));
    const member_id = String(formData.get('member_id'));
    const action = String(formData.get('action'));

    if (action === 'remove') {
      await supabase
        .from('event_roster')
        .delete()
        .eq('event_id', event_id)
        .eq('member_id', member_id);
    } else {
      await supabase
        .from('event_roster')
        .upsert(
          { event_id, member_id },
          { onConflict: 'event_id,member_id' }
        );
    }

    redirect('/admin');
  }

  // --------------------------------------------------
  // Load data
  // --------------------------------------------------
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select(`
      id,
      status,
      comments,
      event_id,
      profiles (
        id,
        first_name,
        last_name,
        email
      )
    `);

  const { data: roster } = await supabase
    .from('event_roster')
    .select('event_id, member_id');

  const selectedMap = new Map<string, Set<string>>();
  (roster ?? []).forEach((r: RosterRow) => {
    if (!selectedMap.has(r.event_id)) {
      selectedMap.set(r.event_id, new Set());
    }
    selectedMap.get(r.event_id)!.add(r.member_id);
  });

  const now = new Date();

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">
            Admin – Roster Builder
          </h1>
          <p className="text-gray-600">
            Build match rosters from confirmed availability.
          </p>
        </div>

        <a
          href="/admin/events"
          className="text-sm text-[#0a2540] underline hover:text-[#d4af37]"
        >
          Manage Events →
        </a>
      </div>

      {searchParams?.notice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
          {searchParams.notice}
        </div>
      )}

      {(events ?? []).map((event: EventRow) => {
        const eventRSVPs = (rsvps ?? []).filter(r => r.event_id === event.id);
        const yes = eventRSVPs.filter(r => r.status === 'Yes');
        const maybe = eventRSVPs.filter(r => r.status === 'Maybe');
        const no = eventRSVPs.filter(r => r.status === 'No');

        const cutoff = event.rsvp_cutoff ? new Date(event.rsvp_cutoff) : null;
        const locked = cutoff ? now > cutoff : false;

        const selected = selectedMap.get(event.id) ?? new Set<string>();

        return (
          <section key={event.id} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Event Summary */}
            <div className="flex justify-between gap-6">
              <div>
                <h2 className="text-2xl font-medium">
                  {formatDate(event.date)}
                </h2>
                <div className="text-gray-600">
                  {event.hosting_club} vs {event.opponent_club}
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(event.date)}
                </div>
                {cutoff && (
                  <div className={`text-sm mt-1 ${locked ? 'text-red-600' : 'text-gray-500'}`}>
                    RSVP Cutoff: {cutoff.toLocaleString()} {locked && '🔒'}
                  </div>
                )}
              </div>

              <div className="flex gap-3 text-sm">
                <span className="px-3 py-1 rounded bg-green-100 text-green-800">✅ Yes: {yes.length}</span>
                <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800">❓ Maybe: {maybe.length}</span>
                <span className="px-3 py-1 rounded bg-red-100 text-red-800">❌ No: {no.length}</span>
              </div>
            </div>

            {/* Roster Builder */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                Roster Candidates (Yes RSVPs)
              </h3>

              {yes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No confirmed availability yet.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {yes.map(r => {
                    const isSelected = selected.has(r.profiles.id);
                    return (
                      <div
                        key={r.id}
                        className="border rounded-lg p-3 flex justify-between items-start gap-3"
                      >
                        <div>
                          <div className="font-medium">
                            {r.profiles.last_name}, {r.profiles.first_name}
                          </div>
                          {r.comments && (
                            <div className="text-xs text-gray-500 italic">
                              “{r.comments}”
                            </div>
                          )}
                        </div>

                    <form action={toggleRoster}>
  <input type="hidden" name="event_id" value={event.id} />
  <input type="hidden" name="member_id" value={r.profiles.id} />
  <input type="hidden" name="action" value={isSelected ? 'remove' : 'add'} />
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
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
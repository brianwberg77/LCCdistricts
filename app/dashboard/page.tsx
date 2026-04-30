'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type EventRow = {
  id: string;
  date: string;
  rsvp_cutoff?: string | null;
  hosting_club: string;
  hosting_location?: string | null;
  opponent_club: string;
  cost?: number | null;
  notes?: string | null;
};

type RSVPRow = {
  event_id: string;
  member_id: string;
  status: 'Yes' | 'Maybe' | 'No';
  comments?: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RSVPRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace('/login');
        return;
      }

      setUserId(data.user.id);
      setUserEmail(data.user.email ?? '');

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('*')
        .eq('member_id', data.user.id);

      const map: Record<string, RSVPRow> = {};
      (rsvpData ?? []).forEach(r => (map[r.event_id] = r));

      setEvents(eventsData ?? []);
      setRsvps(map);
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const saveRSVP = async (eventId: string, payload: Partial<RSVPRow>) => {
    setSavingEventId(eventId);

    const current = rsvps[eventId] ?? {
      event_id: eventId,
      member_id: userId,
      status: 'Maybe',
      comments: null,
    };

    const next = { ...current, ...payload };

    setRsvps(prev => ({ ...prev, [eventId]: next }));

    await supabase
      .from('rsvps')
      .upsert(next, { onConflict: 'event_id,member_id' });

    setSavingEventId(null);
  };

  if (loading) {
    return <main className="max-w-6xl mx-auto px-6 py-12">Loading…</main>;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="flex justify-between">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">
            Welcome, {userEmail}
          </h1>
          <p className="text-gray-600">Your Availability Dashboard</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {events.map(event => {
          const dt = new Date(event.date);
          const cutoff = event.rsvp_cutoff ? new Date(event.rsvp_cutoff) : null;
          const isLocked = cutoff ? new Date() > cutoff : false;

          const rsvp = rsvps[event.id];
          const status = rsvp?.status ?? 'Maybe';

          return (
            <div key={event.id} className="border rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {dt.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-gray-600">
                    {event.hosting_club} vs {event.opponent_club}
                  </div>
                  {cutoff && (
                    <div
                      className={`text-sm ${
                        isLocked ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      RSVP Cutoff: {cutoff.toLocaleString()} {isLocked && '🔒'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {(['Yes', 'Maybe', 'No'] as const).map(s => (
                  <button
                    key={s}
                    disabled={isLocked || savingEventId === event.id}
                    onClick={() => saveRSVP(event.id, { status: s })}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      status === s
                        ? 'bg-[#0a2540] text-white'
                        : 'bg-gray-100'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <input
                disabled={isLocked}
                defaultValue={rsvp?.comments ?? ''}
                onBlur={e => saveRSVP(event.id, { comments: e.target.value })}
                placeholder="Optional comment"
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />

              {isLocked && (
                <div className="text-sm text-red-600">
                  RSVPs are locked for this event.
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
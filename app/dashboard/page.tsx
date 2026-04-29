'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Event = {
  id: string;
  date: string;
  hosting_club: string;
  hosting_location?: string;
  opponent_club: string;
  cost?: string;
  notes?: string;
};

type RSVP = {
  event_id: string;
  status: 'Yes' | 'No' | 'Maybe';
  comments?: string;
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RSVP>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    // Fetch events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    // Fetch user's RSVPs
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('*')
      .eq('member_id', userId);

    const rsvpMap: Record<string, RSVP> = {};
    rsvpData?.forEach(r => {
      rsvpMap[r.event_id] = r;
    });

    setEvents(eventsData || []);
    setRsvps(rsvpMap);
    setLoading(false);
  };

  const updateRSVP = async (eventId: string, status: 'Yes' | 'No' | 'Maybe', comments?: string) => {
    const { error } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        member_id: user.id,
        status,
        comments
      });

    if (!error) {
      fetchData(user.id); // Refresh
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="p-12 text-center">Loading your dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">Welcome, {user?.email}</h1>
          <p className="text-gray-600">Your Availability Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-medium mb-6">Upcoming Events</h2>

        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const rsvp = rsvps[event.id];
              return (
                <div key={event.id} className="border rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-lg">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-gray-600">
                        {event.hosting_club} vs {event.opponent_club}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    {['Yes', 'Maybe', 'No'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateRSVP(event.id, status as any)}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                          rsvp?.status === status 
                            ? 'bg-[#0a2540] text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {rsvp && (
                    <input
                      type="text"
                      placeholder="Comments (optional)"
                      defaultValue={rsvp.comments}
                      onBlur={(e) => updateRSVP(event.id, rsvp.status, e.target.value)}
                      className="mt-4 w-full px-4 py-2 border rounded-lg text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
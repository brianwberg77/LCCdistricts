'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type Event = {
  id: string;
  date: string;
  hosting_club: string;
  hosting_location?: string;
  opponent_club: string;
  cost?: string;
  notes?: string;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) console.error(error);
    else setEvents(data || []);
    setLoading(false);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <Image 
          src="/logo.png" 
          alt="Lincolnshire Country Club" 
          width={180} 
          height={180}
          className="mx-auto mb-6 rounded-full shadow-lg"
        />
        <h1 className="text-5xl font-serif text-[#0a2540] mb-2">District Roster</h1>
        <p className="text-xl text-gray-600">Lincolnshire Country Club • Crete, IL</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#0a2540] text-white px-8 py-6">
          <h2 className="text-3xl font-serif">2026 Interclub Schedule</h2>
          <p className="text-gold-300">Upcoming Matches vs Rival Clubs</p>
        </div>

        {loading ? (
          <p className="p-12 text-center text-gray-500">Loading schedule...</p>
        ) : events.length === 0 ? (
          <p className="p-12 text-center text-gray-500">No events scheduled yet.</p>
        ) : (
          <div className="divide-y">
            {events.map((event) => (
              <div key={event.id} className="px-8 py-8 hover:bg-gray-50 transition">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="text-center md:w-32">
                    <div className="text-5xl font-light text-[#0a2540]">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="uppercase text-sm tracking-widest text-gray-500">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{event.hosting_club}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-semibold text-lg text-[#0a2540]">{event.opponent_club}</span>
                    </div>
                    
                    {event.hosting_location && (
                      <p className="text-gray-600 mt-1">{event.hosting_location}</p>
                    )}
                    {event.cost && <p className="text-emerald-600 font-medium">Cost: {event.cost}</p>}
                    {event.notes && <p className="text-gray-500 mt-2 italic">"{event.notes}"</p>}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    {new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-12 text-sm text-gray-500">
        Members: <a href="/login" className="text-[#0a2540] hover:underline">Login to mark availability</a>
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string;
  cdga_number: string;
  cell_phone: string;
  role: string;
};

type Event = {
  id: string;
  date: string;
  hosting_club: string;
  hosting_location?: string;
  opponent_club: string;
  cost?: string;
  notes?: string;
};

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({
    date: getDefault1PM(),   // ← This forces 1:00 PM
    hosting_club: '',
    hosting_location: '',
    opponent_club: '',
    cost: '',
    notes: ''
  });
  const router = useRouter();

  // Simple & reliable: Force 1:00 PM today
  function getDefault1PM() {
    const d = new Date();
    d.setHours(13, 0, 0, 0);   // 1:00 PM local time
    return d.toISOString().slice(0, 16);
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'bberg77@gmail.com') {
      router.push('/dashboard');
      return;
    }

    const { data: p } = await supabase.from('profiles').select('*').order('last_name');
    const { data: e } = await supabase.from('events').select('*').order('date');

    setProfiles(p || []);
    setEvents(e || []);
  };

  const createEvent = async () => {
    if (!newEvent.date || !newEvent.hosting_club || !newEvent.opponent_club) {
      alert("Please fill required fields");
      return;
    }

    const { error } = await supabase.from('events').insert([newEvent]);
    if (!error) {
      alert("✅ Event created!");
      setNewEvent({ ...newEvent, date: getDefault1PM() });
      loadData();
    } else {
      alert("Error creating event");
    }
  };

  const exportRosterCSV = () => {
    const headers = ['First Name','Last Name','Member #','CDGA #','Cell Phone'];
    const rows = profiles.map(p => [p.first_name, p.last_name, p.member_number || '', p.cdga_number || '', p.cell_phone || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lcc-roster.csv';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-serif text-[#0a2540]">Admin Dashboard</h1>
        <p className="text-green-600 font-medium">✅ Captain Access</p>
      </div>

      {/* Create Event */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
        <h2 className="text-2xl mb-6">Create New Interclub Event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="datetime-local" 
            value={newEvent.date} 
            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} 
            className="border p-3 rounded-lg" 
          />
          <input placeholder="Hosting Club" value={newEvent.hosting_club} onChange={e => setNewEvent({...newEvent, hosting_club: e.target.value})} className="border p-3 rounded-lg" />
          <input placeholder="Hosting Location" value={newEvent.hosting_location} onChange={e => setNewEvent({...newEvent, hosting_location: e.target.value})} className="border p-3 rounded-lg" />
          <input placeholder="Opponent Club" value={newEvent.opponent_club} onChange={e => setNewEvent({...newEvent, opponent_club: e.target.value})} className="border p-3 rounded-lg" />
          <input placeholder="Cost" value={newEvent.cost} onChange={e => setNewEvent({...newEvent, cost: e.target.value})} className="border p-3 rounded-lg" />
          <input placeholder="Notes" value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} className="border p-3 rounded-lg" />
        </div>
        <button onClick={createEvent} className="mt-6 bg-[#0a2540] hover:bg-black text-white px-8 py-3 rounded-lg">
          Create Event
        </button>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl">Full Roster ({profiles.length} members)</h2>
          <button onClick={exportRosterCSV} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Member #</th>
                <th className="p-3 text-left">CDGA #</th>
                <th className="p-3 text-left">Cell Phone</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.first_name} {p.last_name}</td>
                  <td className="p-3">{p.member_number}</td>
                  <td className="p-3">{p.cdga_number}</td>
                  <td className="p-3">{p.cell_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
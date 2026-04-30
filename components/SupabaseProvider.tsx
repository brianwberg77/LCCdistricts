// components/SupabaseProvider.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { createContext, useContext, useEffect, useState } from 'react';

const SupabaseContext = createContext<any>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setUser(data.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      setRole(profile?.role ?? null);
    };

    load();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, role }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);
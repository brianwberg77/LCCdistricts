// components/AdminNav.tsx
'use client';

import { useSupabase } from '@/components/SupabaseProvider';

export default function AdminNav() {
  const { user, role } = useSupabase();

  if (!user || role !== 'admin') return null;

  return (
    <a
      href="/admin"
      className="hover:text-[#d4af37]"
      title="Admin tools"
    >
      Admin
    </a>
  );
}
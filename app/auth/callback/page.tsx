'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const supabase = createClient(); // ✅ SSR-compatible browser client
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState('Finishing sign-in...');

  useEffect(() => {
    const run = async () => {
      try {
        const code = searchParams.get('code');
        const errorDescription = searchParams.get('error_description');

        if (errorDescription) {
          setStatus(errorDescription);
          return;
        }

        if (!code) {
          setStatus('Missing confirmation code.');
          return;
        }

        // Exchange code for session — writes auth cookies now
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw exchangeError;

        // Get verified user + metadata
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;
        if (!user) {
          setStatus('No user found after confirmation.');
          return;
        }

        const meta = user.user_metadata || {};

        // Upsert profile row (safe with RLS)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            first_name: meta.first_name ?? null,
            last_name: meta.last_name ?? null,
            cell_phone: meta.cell_phone ?? null,
            member_number: meta.member_number ?? null,
            cdga_number: meta.cdga_number ?? null,
            role: 'member',
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        setStatus('✅ Account confirmed. Redirecting to dashboard...');
        router.replace('/dashboard');
      } catch (err: any) {
        console.error('AUTH CALLBACK ERROR:', err);
        setStatus(err?.message ?? 'Something went wrong in callback.');
      }
    };

    run();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-serif text-[#0a2540]">
          Lincolnshire Country Club
        </h1>
        <p className="mt-4 text-gray-700">{status}</p>
      </div>
    </div>
  );
}
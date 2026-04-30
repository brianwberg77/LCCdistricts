'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackInner() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Finishing sign-in…');

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

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        setStatus('✅ Signed in. Redirecting…');
        router.replace('/dashboard');
      } catch (err: any) {
        setStatus(err?.message ?? 'Authentication failed.');
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Completing sign-in…</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
``
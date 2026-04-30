'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Short delay so the user sees the message
    const t = setTimeout(() => {
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-serif text-[#0a2540]">
          Lincolnshire Country Club
        </h1>
        <p className="mt-4 text-gray-700">
          ✅ Your email has been confirmed.<br />
          Please sign in to continue.
        </p>
      </div>
    </div>
  );
}
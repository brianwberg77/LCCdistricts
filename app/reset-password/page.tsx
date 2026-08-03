'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPassword() {
    const supabase = createClient();
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const [validSession, setValidSession] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        type: 'error' | 'success';
    } | null>(null);

    /*
      When the user clicks the reset link in their email, Supabase
      establishes a temporary recovery session. We verify that session
      exists before allowing a password change.
    */
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            setValidSession(!!data.session);
            setReady(true);
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setValidSession(true);
                setReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password.length < 8) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 8 characters.',
            });
            return;
        }

        if (password !== confirmPassword) {
            setMessage({
                type: 'error',
                text: 'Passwords do not match.',
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Password updated successfully. Redirecting to your dashboard...',
            });

            setTimeout(() => {
                router.replace('/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('PASSWORD UPDATE ERROR:', err);

            setMessage({
                type: 'error',
                text:
                    err?.error_description ||
                    err?.message ||
                    'Unable to update password. The reset link may have expired.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!ready) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
                    <p className="text-gray-600">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (!validSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center space-y-4">
                    <h2 className="text-2xl font-serif text-[#0a2540]">
                        Reset Link Invalid or Expired
                    </h2>

                    <p className="text-sm text-gray-600">
                        This password reset link is no longer valid. Please request a new
                        one.
                    </p>

                    <Link
                        href="/forgot-password"
                        className="inline-block bg-[#0a2540] text-white px-5 py-3 rounded-lg hover:bg-black transition"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif text-[#0a2540]">
                        Set New Password
                    </h2>
                    <p className="text-gray-600 mt-2">Lincolnshire Country Club</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            New Password *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0a2540]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Must be at least 8 characters.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Confirm New Password *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0a2540]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0a2540] text-white py-3 rounded-lg font-medium hover:bg-black transition disabled:opacity-60"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                {message && (
                    <p
                        className={`mt-4 text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'
                            }`}
                    >
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}

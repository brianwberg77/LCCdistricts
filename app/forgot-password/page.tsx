'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPassword() {
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        type: 'error' | 'success';
    } | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const redirectTo = `${window.location.origin}/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text:
                    'If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.',
            });
        } catch (err: any) {
            console.error('RESET REQUEST ERROR:', err);

            setMessage({
                type: 'error',
                text:
                    err?.error_description ||
                    err?.message ||
                    'Unable to send reset email. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif text-[#0a2540]">
                        Reset Password
                    </h2>
                    <p className="text-gray-600 mt-2">Lincolnshire Country Club</p>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    Enter the email address associated with your account and we will
                    send you a link to reset your password.
                </p>

                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0a2540]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0a2540] text-white py-3 rounded-lg font-medium hover:bg-black transition disabled:opacity-60"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-[#0a2540] hover:underline">
                        Back to Login
                    </Link>
                </div>

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

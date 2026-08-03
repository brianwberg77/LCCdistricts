'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
    const supabase = createClient();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);

    // Required on signup
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [cellPhone, setCellPhone] = useState('');

    // Optional on signup
    const [memberNumber, setMemberNumber] = useState('');
    const [cdgaNumber, setCdgaNumber] = useState('');

    // Shared
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        type: 'error' | 'success';
    } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                router.replace('/dashboard');
                return;
            }

            // Signup with email confirmation
            const emailRedirectTo = `${window.location.origin}/auth/callback`;

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        cell_phone: cellPhone,
                        member_number: memberNumber || null,
                        cdga_number: cdgaNumber || null,
                    },
                },
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Check your email to confirm your account before logging in.',
            });
        } catch (err: any) {
            console.error('AUTH ERROR:', err);

            setMessage({
                type: 'error',
                text:
                    err?.error_description ||
                    err?.message ||
                    'Login failed. Please check your credentials.',
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
                        {isLogin ? 'Member Login' : 'Register'}
                    </h2>
                    <p className="text-gray-600 mt-2">Lincolnshire Country Club</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {/* Signup only */}
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Cell Phone *
                                </label>
                                <input
                                    value={cellPhone}
                                    onChange={(e) => setCellPhone(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Member Club #
                                        <span className="text-xs text-gray-400 ml-1">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        value={memberNumber}
                                        onChange={(e) => setMemberNumber(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        CDGA #
                                        <span className="text-xs text-gray-400 ml-1">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        value={cdgaNumber}
                                        onChange={(e) => setCdgaNumber(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email / Password */}
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

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0a2540]"
                        />
                    </div>

                    {/* Forgot Password link - only shown on login */}
                    {isLogin && (
                        <div className="text-right -mt-3">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[#0a2540] hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0a2540] text-white py-3 rounded-lg font-medium hover:bg-black transition"
                    >
                        {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[#0a2540] hover:underline"
                    >
                        {isLogin
                            ? "Don't have an account? Register"
                            : 'Already have an account? Login'}
                    </button>
                </div>

                {message && (
                    <p
                        className={`mt-4 text-center ${message.type === 'error' ? 'text-red-600' : 'text-green-700'
                            }`}
                    >
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}

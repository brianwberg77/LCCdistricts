import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminCommunicationsPage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )

    /* ---------- Auth ---------- */
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
        redirect('/login')
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
        redirect('/dashboard')
    }

    /* ---------- Active Member Count ---------- */
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    return (
        <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-serif text-[#0a2540]">
                        Captain Communications
                    </h1>

                    <p className="text-gray-600">
                        Send a communication to all active golfers.
                    </p>
                </div>

                <Link href="/admin" className="text-sm text-blue-700 hover:underline">
                    &larr; Back to Roster Builder
                </Link>
            </div>

            <section className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                    <div className="font-medium text-blue-900">
                        Recipients
                    </div>

                    <div className="text-sm text-blue-800">
                        All Active Golfers ({count ?? 0})
                    </div>
                </div>

                <form
                    action="/admin/communications/send"
                    method="POST"
                    className="space-y-6"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Subject
                        </label>

                        <input
                            type="text"
                            name="subject"
                            required
                            maxLength={200}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="This week's district match..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Message
                        </label>

                        <textarea
                            name="message"
                            required
                            rows={12}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Write your message here..."
                        />
                    </div>

                    <div className="text-sm text-gray-500">
                        The email will be sent to all active golfers with a valid
                        email address. Players will not see each other&apos;s email
                        addresses.
                    </div>

                    <button
                        type="submit"
                        className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Send Communication
                    </button>
                </form>
            </section>
        </main>
    )
}

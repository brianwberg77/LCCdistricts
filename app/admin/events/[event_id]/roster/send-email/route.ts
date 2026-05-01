import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
  // ✅ unwrap params (required in your Next.js version)
  const { event_id } = await params

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  // ✅ Auth check
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ✅ Mark roster as emailed
  const { error } = await supabase
    .from('events')
    .update({
      roster_last_emailed_at: new Date().toISOString(),
    })
    .eq('id', event_id)

  if (error) {
    console.error('Send roster email failed:', error)
  }

  // ✅ Redirect back to roster
  return NextResponse.redirect(
    new URL(`/admin/events/${event_id}/roster`, request.url)
  )
}
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
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

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const formData = await req.formData()

  const event_id = String(formData.get('event_id'))
  const status = String(formData.get('status')) // Yes | No | Maybe
  const comments = String(formData.get('comments') || '').trim() || null

  if (!event_id || !status) {
    return NextResponse.redirect(new URL('/dashboard?error=bad_rsvp', req.url))
  }

  const { error } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id,
        member_id: auth.user.id,
        status,
        comments,
      },
      { onConflict: 'event_id,member_id' }
    )

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  return NextResponse.redirect(new URL('/dashboard', req.url))
}
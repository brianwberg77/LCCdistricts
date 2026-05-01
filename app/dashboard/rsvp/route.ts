import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'


export async function POST(request: Request) {
  // ✅ cookies() MUST be awaited in route handlers
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

  // ----------------------------
  // Auth
  // ----------------------------
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const profile_id = userData.user.id

  // ----------------------------
  // Form data
  // ----------------------------
  const formData = await request.formData()
  const event_id = String(formData.get('event_id'))
  const status = String(formData.get('status'))
  const comments = String(formData.get('comments') ?? '')

  // ----------------------------
  // Upsert RSVP (✅ profile_id)
  // ----------------------------
  const { error } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id,
        profile_id,   // ✅ FIX
        status,
        comments,
      },
      {
        onConflict: 'event_id,profile_id',
      }
    )

  if (error) {
    console.error(error)
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    )
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
``
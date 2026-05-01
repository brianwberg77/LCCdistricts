import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
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

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const formData = await request.formData()
  const profile_id = String(formData.get('profile_id'))

  await supabase.from('event_roster').insert({
    event_id,
    profile_id,
    role: 'playing',
  })

  return NextResponse.redirect(
    new URL(`/admin/events/${event_id}/roster`, request.url)
  )
}
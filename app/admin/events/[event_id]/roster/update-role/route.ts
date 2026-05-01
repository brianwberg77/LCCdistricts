import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
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

  // Auth check
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Optional: admin guard
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const formData = await request.formData()

  const profile_id = String(formData.get('profile_id'))
  const role = String(formData.get('role'))

  if (!profile_id || !['playing', 'alternate'].includes(role)) {
    return NextResponse.redirect(
      new URL(`/admin/events/${params.event_id}/roster`, request.url)
    )
  }

  await supabase
    .from('event_roster')
    .update({ role })
    .eq('event_id', params.event_id)
    .eq('profile_id', profile_id)

  return NextResponse.redirect(
    new URL(`/admin/events/${params.event_id}/roster`, request.url)
  )
}
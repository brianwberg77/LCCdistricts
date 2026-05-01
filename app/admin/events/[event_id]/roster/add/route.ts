import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
        setAll: () => {},
      },
    }
  )

  const formData = await request.formData()
  const profileIds = formData.getAll('profile_id') as string[]

  if (profileIds.length === 0) {
    return NextResponse.redirect(
      new URL(`/admin/events/${params.event_id}/roster`, request.url)
    )
  }

  const rows = profileIds.map(profile_id => ({
    event_id: params.event_id,
    profile_id,
    role: 'playing',
  }))

  await supabase.from('event_roster').insert(rows)

  return NextResponse.redirect(
    new URL(`/admin/events/${params.event_id}/roster`, request.url)
  )
}
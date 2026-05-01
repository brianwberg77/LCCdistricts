console.log('UPDATE ROLE ROUTE HIT')
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
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

  // Auth
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const formData = await request.formData()
  const event_id = String(formData.get('event_id'))
  const profile_id = String(formData.get('profile_id'))
  const role = String(formData.get('role'))

  if (!event_id || !profile_id || !['playing', 'alternate'].includes(role)) {
    return NextResponse.redirect(new URL('/admin/events', request.url))
  }

	const { error } = await supabase
	  .from('event_roster')
	  .update({
		role,
		updated_at: new Date().toISOString(),
	  })
	  .eq('event_id', event_id)
	  .eq('profile_id', profile_id);

	if (error) {
	  console.error(error);
	}

  return NextResponse.redirect(
    new URL(`/admin/events/${event_id}/roster`, request.url)
  )
}
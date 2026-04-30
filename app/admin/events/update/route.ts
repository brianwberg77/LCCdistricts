import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function normalizeDateTimeLocal(value?: string | null): string | null {
  if (!value) return null
  return value.replace('T', ' ') + ':00'
}

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

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const formData = await req.formData()

  const id = String(formData.get('id') || '')
  if (!id) {
    return NextResponse.redirect(
      new URL('/admin/events?error=missing_id', req.url)
    )
  }

  const date = normalizeDateTimeLocal(formData.get('date') as string)
  if (!date) {
    return NextResponse.redirect(
      new URL('/admin/events?error=missing_date', req.url)
    )
  }

  const rsvp_cutoff = normalizeDateTimeLocal(
    (formData.get('rsvp_cutoff') as string) || null
  )

  const { error } = await supabase
    .from('events')
    .update({
      date,
      rsvp_cutoff,
      hosting_club: String(formData.get('hosting_club')),
      opponent_club: String(formData.get('opponent_club')),
      hosting_location: String(formData.get('hosting_location') || ''),
      cost: formData.get('cost') ? Number(formData.get('cost')) : null,
      notes: String(formData.get('notes') || ''),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/events?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  return NextResponse.redirect(new URL('/admin/events?updated=1', req.url))
}

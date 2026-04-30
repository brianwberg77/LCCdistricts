import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params   // ✅ THIS IS THE KEY CHANGE

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

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, date, hosting_club, hosting_location, opponent_club, cost, notes'
    )
    .eq('id', id)
    .single()

  if (error || !event) {
    return new NextResponse('Event not found', { status: 404 })
  }

  // ---- Build ICS (local Central Time, floating) ----
  const formatICSLocal = (value: string) =>
    value.replace(/[-:]/g, '').replace(' ', 'T')

  const title =
    event.opponent_club === 'BYE WEEK'
      ? `${event.hosting_club} — Bye Week`
      : `${event.hosting_club} vs ${event.opponent_club}`

  const start = formatICSLocal(event.date)
  const end = formatICSLocal(event.date) // adjust duration if needed

  const description = [
    event.cost ? `Cost: $${event.cost}` : null,
    event.notes ?? null,
  ]
    .filter(Boolean)
    .join('\\n\\n')

  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LCC District//Events//EN
BEGIN:VEVENT
UID:${event.id}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
LOCATION:${event.hosting_location ?? ''}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR
`.trim()

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${title.replace(
        /[^a-z0-9]/gi,
        '_'
      )}.ics"`,
    },
  })
}
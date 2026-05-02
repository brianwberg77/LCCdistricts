import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer from 'nodemailer'

// ✅ Fail fast if env vars missing
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error('Gmail credentials not configured')
}

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

  // ✅ Auth check
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ✅ Load event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('date, hosting_club, opponent_club, hosting_location')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    console.error(eventError)
    throw new Error('Unable to load event for email')
  }

  // ✅ Load roster + profiles
  const { data: roster, error: rosterError } = await supabase
    .from('event_roster')
    .select(`
      role,
      profiles (
        first_name,
        last_name,
        email,
        handicap_index
      )
    `)
    .eq('event_id', event_id)

  if (rosterError || !roster || roster.length === 0) {
    console.error(rosterError)
    throw new Error('Roster empty or unavailable')
  }

  const playing = roster.filter(r => r.role === 'playing')
  const alternates = roster.filter(r => r.role === 'alternate')

  // ✅ Build recipient lists
  const to = playing
    .map(p => p.profiles?.[0]?.email)
    .filter(Boolean)
    .join(',')

  const cc = alternates
    .map(p => p.profiles?.[0]?.email)
    .filter(Boolean)
    .join(',')

  // ✅ Build email body
  const dateStr = new Date(event.date).toLocaleString()

  const html = `
    <p>The roster for the upcoming midwest district league match has been finalized.</p>

    <h3>Playing</h3>
    <ul>
      ${playing
        .map(
          p =>
            `<li>${p.profiles[0].first_name} ${p.profiles[0].last_name} (${p.profiles[0].handicap_index ?? '—'})</li>`
        )
        .join('')}
    </ul>

    <h3>Alternates</h3>
    <ul>
      ${alternates
        .map(
          p =>
            `<li>${p.profiles[0].first_name} ${p.profiles[0].last_name}</li>`
        )
        .join('')}
    </ul>

    <p>
      <strong>Date:</strong> ${dateStr}<br/>
      <strong>Match:</strong> @${event.hosting_club} vs ${event.opponent_club}<br/>
      <strong>Location:</strong> ${event.hosting_location}
    </p>

    <p>Please contact the captain or assistant captain with any questions.</p>
  `

  // ✅ Configure Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  // ✅ Send email
  await transporter.sendMail({
    from: `"LCC Captain" <${process.env.GMAIL_USER}>`,
    to,
    cc,
    subject: `This week district Match Roster @ ${event.hosting_club} vs ${event.opponent_club}`,
    html,
  })

  // ✅ Mark roster as emailed ONLY after successful send
  await supabase
    .from('events')
    .update({
      roster_last_emailed_at: new Date().toISOString(),
    })
    .eq('id', event_id)

  return NextResponse.redirect(
    new URL(`/admin/events/${event_id}/roster`, request.url)
  )
}
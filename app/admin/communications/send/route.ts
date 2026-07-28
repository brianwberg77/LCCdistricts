import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer from 'nodemailer'

// Fail fast if Gmail isn't configured
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured')
}

export async function POST(request: Request) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )

    /* ---------- Auth ---------- */
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    /* ---------- Form Data ---------- */
    const formData = await request.formData()

    const subject = String(formData.get('subject') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()

    if (!subject || !message) {
        return NextResponse.redirect(
            new URL('/admin/communications?error=missing_fields', request.url)
        )
    }

    /* ---------- Load Active Golfers ---------- */
    const { data: players, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('is_active', true)
        .not('email', 'is', null)

    if (error) {
        console.error(error)
        throw new Error('Unable to load player emails')
    }

    const recipients =
        players
            ?.map((p) => p.email)
            .filter(Boolean)
            .join(',') ?? ''

    if (!recipients) {
        throw new Error('No active golfers with email addresses found')
    }

    /* ---------- Email ---------- */
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif">
      ${message.replace(/\n/g, '<br/>')}
    </div>
  `

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    })

    await transporter.sendMail({
        from: `"LCC Captain" <${process.env.GMAIL_USER}>`,

        // Send to yourself
        to: process.env.GMAIL_USER,

        // Everyone else gets BCC'd
        bcc: recipients,

        subject,
        html,
    })

    return NextResponse.redirect(
        new URL('/admin/communications?success=true', request.url)
    )
}

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

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/events?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  return NextResponse.redirect(new URL('/admin/events?deleted=1', req.url))
}
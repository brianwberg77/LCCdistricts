import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ✅ Soft delete
  const {data, error} = await supabase
    .from('profiles')
    .update({ 	
		is_active: false,
		deactivated_at: new Date().toISOString(),
		deactivated_by: user.user.id,
	})
    .eq('id', id)
		
if (error) {
  console.error('Deactivate failed:', error)
  return NextResponse.json(
    { error: error.message },
    { status: 403 }
  )
}


  return NextResponse.redirect(
    new URL('/admin/members', request.url)
  )
}

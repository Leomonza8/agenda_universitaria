import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = JSON.parse(session.value)
    
    // Verificar se é admin
    const supabase = createClient()
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, username, nome, is_admin')
      .eq('id', user.id)
      .single()

    if (!dbUser?.is_admin) {
      return NextResponse.json({ error: 'Not admin' }, { status: 403 })
    }

    // Retornar todos os usuarios
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, username, nome, is_admin, created_at')
      .order('created_at', { ascending: false })

    return NextResponse.json({ users: allUsers || [] })
  } catch (err) {
    console.error('[v0] Admin get users error:', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

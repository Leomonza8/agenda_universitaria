import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Valida se o caller é admin via header Authorization
async function validateAdmin(request: Request) {
  const auth = request.headers.get('Authorization')
  if (!auth) return null
  try {
    const session = JSON.parse(Buffer.from(auth, 'base64').toString())
    if (!session.isAdmin) return null
    return session
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const session = await validateAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, nome, is_admin, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: users || [] })
}

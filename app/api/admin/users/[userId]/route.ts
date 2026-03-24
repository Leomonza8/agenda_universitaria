import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function validateAdmin(request: Request) {
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

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = validateAdmin(req)
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })

  const { userId } = await params
  const body = await req.json()

  const { error } = await supabase
    .from('users')
    .update({ is_admin: body.is_admin })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = validateAdmin(req)
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })

  const { userId } = await params

  if (userId === session.userId) {
    return NextResponse.json({ error: 'Nao pode deletar a si mesmo' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

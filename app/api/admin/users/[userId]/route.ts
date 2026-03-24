import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/client'

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { userId } = await params
    const body = await req.json()
    const user = JSON.parse(session.value)

    // Verificar se é admin
    const supabase = createClient()
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: 'Not admin' }, { status: 403 })
    }

    // Atualizar usuario
    const { error } = await supabase
      .from('users')
      .update({ is_admin: body.is_admin })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Admin update user error:', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { userId } = await params
    const user = JSON.parse(session.value)

    // Verificar se é admin
    const supabase = createClient()
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: 'Not admin' }, { status: 403 })
    }

    // Nao deixar deletar a si mesmo
    if (userId === user.id) {
      return NextResponse.json({ error: 'Nao pode deletar a si mesmo' }, { status: 400 })
    }

    // Deletar usuario e todos os seus dados
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Admin delete user error:', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

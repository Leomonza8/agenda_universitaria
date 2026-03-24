import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { username, password, nome, isAdmin } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario e senha obrigatorios' }, { status: 400 })
    }

    // Verificar se e admin criando (precisa ser admin para criar outros admins)
    const cookieStore = await cookies()
    const session = cookieStore.get('session')
    let isCreatorAdmin = false

    if (session) {
      try {
        const sessionData = JSON.parse(session.value)
        isCreatorAdmin = sessionData.isAdmin
      } catch {}
    }

    // Se nao houver usuarios, o primeiro sera admin
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = count === 0
    const shouldBeAdmin = isFirstUser || (isCreatorAdmin && isAdmin)

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Inserir usuario
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username: username.toLowerCase().trim(),
        password_hash: passwordHash,
        nome: nome || username,
        is_admin: shouldBeAdmin,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Usuario ja existe' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        nome: user.nome,
        isAdmin: user.is_admin,
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

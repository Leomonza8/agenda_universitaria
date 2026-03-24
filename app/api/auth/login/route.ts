import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scryptSync, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, hashFromDb] = hash.split(':')
    const computedHash = scryptSync(password, salt, 64).toString('hex')
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(hashFromDb))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario e senha obrigatorios' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario ou senha incorretos' }, { status: 401 })
    }

    const passwordMatch = verifyPassword(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Usuario ou senha incorretos' }, { status: 401 })
    }

    const sessionData = {
      userId: user.id,
      username: user.username,
      nome: user.nome,
      isAdmin: user.is_admin,
    }

    // Retorna dados da sessão para o cliente salvar em localStorage
    return NextResponse.json({ success: true, user: sessionData })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

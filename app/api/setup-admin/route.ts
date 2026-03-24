import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Credenciais do admin
  const ADMIN_USERNAME = 'leomonza'
  const ADMIN_PASSWORD = '603973'
  const ADMIN_NAME = 'Leonardo Monteiro'
  const email = `${ADMIN_USERNAME}@agenda.local`

  // Verificar se já existe algum admin
  const { data: existingAdmin } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .single()

  if (existingAdmin) {
    return NextResponse.json({ message: 'Admin já existe' }, { status: 400 })
  }

  // Criar usuário via signUp
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: ADMIN_PASSWORD,
    options: {
      data: { 
        nome: ADMIN_NAME, 
        username: ADMIN_USERNAME 
      },
    },
  })

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 500 })
  }

  if (signUpData.user) {
    // Criar/atualizar profile com is_admin = true
    await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      nome: ADMIN_NAME,
      email,
      username: ADMIN_USERNAME,
      is_admin: true,
    })

    return NextResponse.json({ 
      message: 'Admin criado com sucesso',
      username: ADMIN_USERNAME
    })
  }

  return NextResponse.json({ error: 'Falha ao criar admin' }, { status: 500 })
}

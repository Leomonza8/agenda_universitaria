import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  console.log('[v0] Session cookie:', session?.value ? 'exists' : 'not found')

  if (!session) {
    return NextResponse.json({ user: null })
  }

  try {
    const user = JSON.parse(session.value)
    console.log('[v0] Session user:', user.username)
    return NextResponse.json({ user })
  } catch (err) {
    console.log('[v0] Session parse error:', err)
    return NextResponse.json({ user: null })
  }
}

// Auth helpers usando localStorage para sessão
export interface SessionUser {
  userId: string
  username: string
  nome: string
  isAdmin: boolean
}

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('agenda_session')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSession(user: SessionUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem('agenda_session', JSON.stringify(user))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('agenda_session')
}

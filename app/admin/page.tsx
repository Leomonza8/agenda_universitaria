'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react'

interface User {
  id: string
  username: string
  nome: string | null
  is_admin: boolean
  created_at: string
}

interface SessionUser {
  id: string
  username: string
  nome: string | null
  is_admin: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form fields
  const [novoNome, setNovoNome] = useState('')
  const [novoUsername, setNovoUsername] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const res = await fetch('/api/auth/session', { credentials: 'include' })
    const data = await res.json()

    if (!data.user) {
      router.push('/auth/login')
      return
    }

    setCurrentUser(data.user)
    
    if (!data.user.is_admin) {
      router.push('/')
      return
    }

    setIsAdmin(true)
    fetchUsers()
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (err) {
      console.error('Erro ao buscar usuarios:', err)
    }
    setLoading(false)
  }

  const handleCriarUsuario = async () => {
    if (!novoUsername.trim() || !novaSenha.trim() || !novoNome.trim()) {
      setError('Preencha todos os campos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: novoUsername.toLowerCase().trim(),
          password: novaSenha,
          nome: novoNome,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar usuario')
        return
      }

      setNovoNome('')
      setNovoUsername('')
      setNovaSenha('')
      setDialogOpen(false)
      fetchUsers()
    } catch (err) {
      setError('Erro ao criar usuario')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_admin: !currentStatus }),
      })

      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Erro ao atualizar usuario:', err)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuario?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Erro ao deletar usuario:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Painel Admin</h1>
                <p className="text-xs text-muted-foreground">Gerenciar usuarios</p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuario
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Cadastrados</CardTitle>
            <CardDescription>{users.length} usuario(s) no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {user.nome?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{user.nome || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    {user.is_admin && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                    >
                      {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuario cadastrado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para criar usuario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuario</DialogTitle>
            <DialogDescription>
              Cadastre um novo usuario no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome de usuario</label>
              <Input
                value={novoUsername}
                onChange={e => setNovoUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="nome_usuario"
              />
              <p className="text-xs text-muted-foreground">Apenas letras, numeros e underscore</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Minimo 6 caracteres"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarUsuario} disabled={saving || !novoUsername.trim() || !novaSenha.trim() || !novoNome.trim()}>
                {saving ? 'Criando...' : 'Criar Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

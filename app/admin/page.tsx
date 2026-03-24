'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react'

interface Profile {
  id: string
  nome: string | null
  email: string | null
  username: string | null
  is_admin: boolean
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
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
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    setIsAdmin(true)
    fetchProfiles()
  }

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setProfiles(data)
    setLoading(false)
  }

  const handleCriarUsuario = async () => {
    if (!novoUsername || !novaSenha || !novoNome) return
    setSaving(true)
    setError(null)

    const username = novoUsername.toLowerCase().trim()
    const email = `${username}@agenda.local`

    // Verificar se username ja existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      setError('Este nome de usuario ja existe')
      setSaving(false)
      return
    }

    // Create user via signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: novaSenha,
      options: {
        data: { nome: novoNome, username },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setSaving(false)
      return
    }

    if (signUpData.user) {
      // Insert profile manually (trigger may not fire immediately)
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        nome: novoNome,
        email,
        username,
        is_admin: false,
      })
    }

    setNovoNome('')
    setNovoUsername('')
    setNovaSenha('')
    setDialogOpen(false)
    setSaving(false)
    fetchProfiles()
  }

  const toggleAdmin = async (profileId: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', profileId)
    fetchProfiles()
  }

  const deleteUser = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuario?')) return
    
    await supabase.from('profiles').delete().eq('id', profileId)
    fetchProfiles()
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
            <CardDescription>{profiles.length} usuario(s) no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {p.nome?.charAt(0).toUpperCase() || p.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{p.nome || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">@{p.username}</p>
                    </div>
                    {p.is_admin && (
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
                      onClick={() => toggleAdmin(p.id, p.is_admin)}
                    >
                      {p.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteUser(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {profiles.length === 0 && (
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
                onChange={e => setNovoUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="nome_usuario"
              />
              <p className="text-xs text-muted-foreground">Apenas letras e numeros, sem espacos</p>
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
              <Button onClick={handleCriarUsuario} disabled={saving || !novoUsername || !novaSenha || !novoNome}>
                {saving ? 'Criando...' : 'Criar Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

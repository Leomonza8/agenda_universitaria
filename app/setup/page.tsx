'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Check, AlertCircle } from 'lucide-react'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSetup = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'leomonza',
        password: '603973',
        nome: 'Leonardo',
        isAdmin: true,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || data.message || 'Erro ao criar admin')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-xl">Setup Concluido</CardTitle>
            <CardDescription>Usuario admin criado com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted text-sm">
              <p><strong>Usuario:</strong> leomonza</p>
              <p><strong>Senha:</strong> 603973</p>
            </div>
            <Button className="w-full" onClick={() => router.push('/auth/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Setup Inicial</CardTitle>
          <CardDescription>Configure o usuario administrador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="p-4 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-2">Credenciais do Admin:</p>
            <p><strong>Usuario:</strong> leomonza</p>
            <p><strong>Senha:</strong> 603973</p>
          </div>
          <Button className="w-full" onClick={handleSetup} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Usuario Admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

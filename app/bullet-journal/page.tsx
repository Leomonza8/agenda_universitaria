'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Check, Smile, BookOpen, Target, Archive } from 'lucide-react'

interface BuJoEntrada {
  id: string
  data: string
  tipo: 'tarefa' | 'evento' | 'nota'
  texto: string
  concluida: boolean
}

interface BuJoHabito {
  id: string
  nome: string
  icone: string
  cor: string
  ativo: boolean
}

interface BuJoHabitoLog {
  habito_id: string
  data: string
  concluido: boolean
}

export default function BulletJournalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hoje, setHoje] = useState(new Date().toISOString().split('T')[0])

  const [entradas, setEntradas] = useState<BuJoEntrada[]>([])
  const [habitos, setHabitos] = useState<BuJoHabito[]>([])
  const [habitosLog, setHabitosLog] = useState<BuJoHabitoLog[]>([])
  
  const [novaEntrada, setNovaEntrada] = useState('')
  const [tipoEntrada, setTipoEntrada] = useState<'tarefa' | 'evento' | 'nota'>('tarefa')
  const [dialogAberto, setDialogAberto] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    setUser(session)
    await fetchData()
    setLoading(false)
  }

  const fetchData = useCallback(async () => {
    const session = getSession()
    if (!session) return

    // Buscar entradas de hoje
    const { data: entradasData } = await supabase
      .from('bujo_entradas')
      .select('*')
      .eq('user_id', session.userId)
      .eq('data', hoje)
      .order('ordem', { ascending: true })

    if (entradasData) setEntradas(entradasData)

    // Buscar hábitos
    const { data: habitosData } = await supabase
      .from('bujo_habitos')
      .select('*')
      .eq('user_id', session.userId)
      .eq('ativo', true)
      .order('created_at', { ascending: true })

    if (habitosData) setHabitos(habitosData)

    // Buscar log de hábitos de hoje
    if (habitosData && habitosData.length > 0) {
      const { data: logData } = await supabase
        .from('bujo_habitos_log')
        .select('*')
        .eq('user_id', session.userId)
        .eq('data', hoje)

      if (logData) setHabitosLog(logData)
    }
  }, [hoje, supabase])

  const handleAddEntrada = async () => {
    if (!novaEntrada.trim() || !user) return

    const { error } = await supabase.from('bujo_entradas').insert({
      user_id: user.userId,
      data: hoje,
      tipo: tipoEntrada,
      texto: novaEntrada.trim(),
      concluida: false,
      ordem: entradas.length,
    })

    if (!error) {
      setNovaEntrada('')
      await fetchData()
    }
  }

  const handleToggleEntrada = async (id: string, concluida: boolean) => {
    await supabase
      .from('bujo_entradas')
      .update({ concluida: !concluida })
      .eq('id', id)

    setEntradas(prev => prev.map(e => e.id === id ? { ...e, concluida: !concluida } : e))
  }

  const handleDeleteEntrada = async (id: string) => {
    await supabase.from('bujo_entradas').delete().eq('id', id)
    setEntradas(prev => prev.filter(e => e.id !== id))
  }

  const handleToggleHabito = async (habitoId: string) => {
    const existe = habitosLog.find(h => h.habito_id === habitoId && h.data === hoje)

    if (existe) {
      await supabase
        .from('bujo_habitos_log')
        .update({ concluido: !existe.concluido })
        .eq('habito_id', habitoId)
        .eq('data', hoje)
    } else {
      await supabase.from('bujo_habitos_log').insert({
        habito_id: habitoId,
        user_id: user.userId,
        data: hoje,
        concluido: true,
      })
    }

    await fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/escolher')} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Bullet Journal</h1>
              <p className="text-xs text-muted-foreground">{new Date(hoje).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setHoje(new Date().toISOString().split('T')[0])}>
              Hoje
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Daily Log */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entrada rápida */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Daily Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={tipoEntrada}
                    onChange={(e) => setTipoEntrada(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="tarefa">✓ Tarefa</option>
                    <option value="evento">◉ Evento</option>
                    <option value="nota">— Nota</option>
                  </select>
                  <Input
                    placeholder="Adicione uma tarefa, evento ou nota..."
                    value={novaEntrada}
                    onChange={(e) => setNovaEntrada(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEntrada()}
                    className="border-border/60"
                  />
                  <Button onClick={handleAddEntrada} size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Entradas do dia */}
            <div className="space-y-2">
              {entradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrada para hoje</p>
              ) : (
                entradas.map(entrada => (
                  <div
                    key={entrada.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border/60 hover:bg-muted/30 transition-all group"
                  >
                    <button
                      onClick={() => handleToggleEntrada(entrada.id, entrada.concluida)}
                      className={`mt-1 h-5 w-5 rounded border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                        entrada.concluida
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-muted-foreground/40 hover:border-green-400'
                      }`}
                    >
                      {entrada.concluida && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${entrada.concluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {entrada.texto}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {entrada.tipo === 'tarefa' ? '✓ Tarefa' : entrada.tipo === 'evento' ? '◉ Evento' : '— Nota'}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteEntrada(entrada.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Habit Tracker */}
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Hábitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {habitos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum hábito ativo</p>
                ) : (
                  habitos.map(habito => {
                    const concluido = habitosLog.some(h => h.habito_id === habito.id && h.concluido)
                    return (
                      <button
                        key={habito.id}
                        onClick={() => handleToggleHabito(habito.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition-all ${
                          concluido
                            ? `border-green-500 bg-green-50 dark:bg-green-900/10`
                            : 'border-border/40 hover:border-border/60'
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                            concluido ? 'bg-green-500' : ''
                          }`}
                          style={!concluido ? { backgroundColor: habito.cor } : undefined}
                        >
                          {concluido ? <Check className="h-4 w-4" /> : habito.icone}
                        </div>
                        <span className={`text-sm font-medium text-left flex-1 ${concluido ? 'text-muted-foreground' : ''}`}>
                          {habito.nome}
                        </span>
                      </button>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Link para página de conceito */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Bullet Journal digital v1.0</p>
              <Button variant="link" size="sm" className="text-xs" onClick={() => router.push('/escolher')}>
                Voltar ao menu
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

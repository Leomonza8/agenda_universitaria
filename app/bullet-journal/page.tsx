'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus, Trash2, Check, Circle, Minus, Calendar,
  ChevronLeft, ChevronRight, ArrowLeftRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type TipoEntrada = 'tarefa' | 'evento' | 'nota'

interface Entrada {
  id: string
  tipo: TipoEntrada
  conteudo: string
  concluida: boolean
  data: string
  user_id: string
  created_at: string
}

interface Habito {
  id: string
  nome: string
  user_id: string
  created_at: string
}

interface HabitoLog {
  id: string
  habito_id: string
  data: string
  concluida: boolean
}

export default function BulletJournalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [habitosLog, setHabitosLog] = useState<HabitoLog[]>([])
  const [novaEntrada, setNovaEntrada] = useState('')
  const [tipoEntrada, setTipoEntrada] = useState<TipoEntrada>('tarefa')
  const [confirmDelete, setConfirmDelete] = useState<Entrada | null>(null)
  const [novoHabito, setNovoHabito] = useState('')
  const [mostrarAddHabito, setMostrarAddHabito] = useState(false)

  const dataStr = format(dataSelecionada, 'yyyy-MM-dd')
  const dataFormatada = format(dataSelecionada, 'd MMMM yyyy', { locale: ptBR })

  // Carregar dados ao montar
  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    setUserId(session.userId)
    fetchEntradas(session.userId)
    fetchHabitos(session.userId)
  }, [router])

  // Recarregar entradas quando mudar data
  useEffect(() => {
    if (userId) {
      fetchEntradas(userId)
    }
  }, [dataSelecionada])

  const fetchEntradas = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('bujo_entradas')
      .select('*')
      .eq('user_id', uid)
      .eq('data', dataStr)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('[v0] Erro ao buscar entradas:', error)
      return
    }
    
    setEntradas(data || [])
    setLoading(false)
  }, [supabase, dataStr])

  const fetchHabitos = useCallback(async (uid: string) => {
    const { data: habRes, error: habError } = await supabase
      .from('bujo_habitos')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })
    
    if (habError) {
      console.error('[v0] Erro ao buscar habitos:', habError)
      return
    }
    
    setHabitos(habRes || [])

    // Buscar logs de habitos para hoje
    const { data: logRes, error: logError } = await supabase
      .from('bujo_habitos_log')
      .select('*')
      .eq('data', dataStr)
    
    if (logError) {
      console.error('[v0] Erro ao buscar habitos log:', logError)
      return
    }
    
    setHabitosLog(logRes || [])
  }, [supabase, dataStr])

  const handleAdicionarEntrada = async () => {
    if (!novaEntrada.trim() || !userId) return
    
    const { error } = await supabase
      .from('bujo_entradas')
      .insert({
        user_id: userId,
        data: dataStr,
        tipo: tipoEntrada,
        conteudo: novaEntrada,
        concluida: false
      })
    
    if (error) {
      console.error('[v0] Erro ao adicionar entrada:', error)
      return
    }

    setNovaEntrada('')
    fetchEntradas(userId)
  }

  const handleToggleConcluida = async (entrada: Entrada) => {
    const { error } = await supabase
      .from('bujo_entradas')
      .update({ concluida: !entrada.concluida })
      .eq('id', entrada.id)
    
    if (error) {
      console.error('[v0] Erro ao atualizar entrada:', error)
      return
    }

    fetchEntradas(userId!)
  }

  const handleRemover = async (entrada: Entrada) => {
    const { error } = await supabase
      .from('bujo_entradas')
      .delete()
      .eq('id', entrada.id)
    
    if (error) {
      console.error('[v0] Erro ao remover entrada:', error)
      return
    }

    setConfirmDelete(null)
    fetchEntradas(userId!)
  }

  const handleAdicionarHabito = async () => {
    if (!novoHabito.trim() || !userId) return
    
    const { error } = await supabase
      .from('bujo_habitos')
      .insert({
        user_id: userId,
        nome: novoHabito
      })
    
    if (error) {
      console.error('[v0] Erro ao adicionar habito:', error)
      return
    }

    setNovoHabito('')
    setMostrarAddHabito(false)
    fetchHabitos(userId)
  }

  const handleToggleHabito = async (habito: Habito) => {
    const existingLog = habitosLog.find(log => log.habito_id === habito.id && log.data === dataStr)
    
    if (existingLog) {
      const { error } = await supabase
        .from('bujo_habitos_log')
        .delete()
        .eq('id', existingLog.id)
      
      if (error) {
        console.error('[v0] Erro ao remover habito log:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('bujo_habitos_log')
        .insert({
          habito_id: habito.id,
          data: dataStr,
          concluida: true
        })
      
      if (error) {
        console.error('[v0] Erro ao adicionar habito log:', error)
        return
      }
    }

    fetchHabitos(userId!)
  }

  const handleRemoverHabito = async (habitoId: string) => {
    const { error } = await supabase
      .from('bujo_habitos')
      .delete()
      .eq('id', habitoId)
    
    if (error) {
      console.error('[v0] Erro ao remover habito:', error)
      return
    }

    fetchHabitos(userId!)
  }

  const entradasDia = entradas
  const tarefas = entradasDia.filter(e => e.tipo === 'tarefa')
  const eventos = entradasDia.filter(e => e.tipo === 'evento')
  const notas = entradasDia.filter(e => e.tipo === 'nota')

  const habitosConcluidos = habitosLog.length
  const progressoHabitos = habitos.length > 0 ? Math.round((habitosConcluidos / habitos.length) * 100) : 0

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Agenda Rápida</h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">{dataFormatada}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/60"
            title="Ir para Agenda Completa"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Agenda Completa</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Navegacao de datas */}
        <div className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-lg p-4 border border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setDataSelecionada(subDays(dataSelecionada, 1))}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">Dia</p>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {format(dataSelecionada, 'dd/MM')}
            </p>
          </div>
          <button
            onClick={() => setDataSelecionada(addDays(dataSelecionada, 1))}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDataSelecionada(new Date())}
            className="ml-4 px-3 py-1 text-xs font-medium bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Secao de habitos */}
        {habitos.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-lg p-4 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Hábitos Diários</h2>
              <div className="text-xs text-stone-600 dark:text-stone-400">
                {habitosConcluidos}/{habitos.length} ({progressoHabitos}%)
              </div>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${progressoHabitos}%` }}
              />
            </div>
            <div className="space-y-2">
              {habitos.map(habito => {
                const isConcluido = habitosLog.some(log => log.habito_id === habito.id && log.data === dataStr && log.concluida)
                return (
                  <div key={habito.id} className="flex items-center gap-3 p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group">
                    <button
                      onClick={() => handleToggleHabito(habito)}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        isConcluido
                          ? 'bg-green-500 border-green-500'
                          : 'border-stone-300 dark:border-stone-700 hover:border-green-500'
                      }`}
                    >
                      {isConcluido && <Check className="h-4 w-4 text-white" />}
                    </button>
                    <span className="flex-1 text-sm text-stone-900 dark:text-stone-100">{habito.nome}</span>
                    <button
                      onClick={() => handleRemoverHabito(habito.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
            {!mostrarAddHabito && (
              <button
                onClick={() => setMostrarAddHabito(true)}
                className="w-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 py-2 transition-colors"
              >
                + Novo hábito
              </button>
            )}
            {mostrarAddHabito && (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do hábito..."
                  value={novoHabito}
                  onChange={e => setNovoHabito(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAdicionarHabito()}
                  className="text-sm"
                  autoFocus
                />
                <Button onClick={handleAdicionarHabito} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Adicionar entrada */}
        <div className="bg-white dark:bg-stone-900 rounded-lg p-4 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nova anotação..."
              value={novaEntrada}
              onChange={e => setNovaEntrada(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdicionarEntrada()}
              className="text-sm"
            />
            <Select value={tipoEntrada} onValueChange={v => setTipoEntrada(v as TipoEntrada)}>
              <SelectTrigger className="w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tarefa">✓ Tarefa</SelectItem>
                <SelectItem value="evento">○ Evento</SelectItem>
                <SelectItem value="nota">- Nota</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdicionarEntrada} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Secoes de entradas */}
        <div className="grid gap-6">
          {/* Tarefas */}
          {tarefas.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-lg p-4 border border-blue-200 dark:border-blue-900/30 space-y-3">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Tarefas ({tarefas.length})
              </h3>
              <div className="space-y-2">
                {tarefas.map(entrada => (
                  <div key={entrada.id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors">
                    <button
                      onClick={() => handleToggleConcluida(entrada)}
                      className={`flex-shrink-0 transition-colors ${
                        entrada.concluida ? 'text-blue-500' : 'text-stone-400 hover:text-blue-500'
                      }`}
                    >
                      {entrada.concluida ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${entrada.concluida ? 'line-through text-stone-500' : 'text-stone-900 dark:text-stone-100'}`}>
                      {entrada.conteudo}
                    </span>
                    <button
                      onClick={() => setConfirmDelete(entrada)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eventos */}
          {eventos.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-lg p-4 border border-amber-200 dark:border-amber-900/30 space-y-3">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Circle className="h-4 w-4" />
                Eventos ({eventos.length})
              </h3>
              <div className="space-y-2">
                {eventos.map(entrada => (
                  <div key={entrada.id} className="flex items-center gap-3 p-2 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 group transition-colors">
                    <button
                      onClick={() => handleToggleConcluida(entrada)}
                      className={`flex-shrink-0 transition-colors ${
                        entrada.concluida ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500'
                      }`}
                    >
                      {entrada.concluida ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${entrada.concluida ? 'line-through text-stone-500' : 'text-stone-900 dark:text-stone-100'}`}>
                      {entrada.conteudo}
                    </span>
                    <button
                      onClick={() => setConfirmDelete(entrada)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {notas.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-lg p-4 border border-green-200 dark:border-green-900/30 space-y-3">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Notas ({notas.length})
              </h3>
              <div className="space-y-2">
                {notas.map(entrada => (
                  <div key={entrada.id} className="flex items-center gap-3 p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 group transition-colors">
                    <span className="flex-shrink-0 text-green-500 text-sm font-bold">-</span>
                    <span className="flex-1 text-sm text-stone-900 dark:text-stone-100">
                      {entrada.conteudo}
                    </span>
                    <button
                      onClick={() => setConfirmDelete(entrada)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entradasDia.length === 0 && (
            <div className="text-center py-12 text-stone-500 dark:text-stone-400">
              <p className="text-sm">Nenhuma anotação para hoje</p>
            </div>
          )}
        </div>
      </main>

      {/* AlertDialog confirmar remocao */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anotação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "<span className="font-semibold">{confirmDelete?.conteudo}</span>"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleRemover(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

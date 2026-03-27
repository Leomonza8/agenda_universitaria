'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, Trash2, Check, Circle, Minus, Calendar,
  ChevronLeft, ChevronRight, Sparkles, Target, Sun, ArrowLeftRight
} from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Entrada {
  id: string
  tipo: 'tarefa' | 'evento' | 'nota'
  texto: string
  concluida: boolean
  data: string
}

interface Habito {
  id: string
  nome: string
  cor: string
  diasConcluidos: string[]
}

const HABITOS_PADRAO: Habito[] = [
  { id: '1', nome: 'Exercicio', cor: '#ef4444', diasConcluidos: [] },
  { id: '2', nome: 'Leitura', cor: '#3b82f6', diasConcluidos: [] },
  { id: '3', nome: 'Meditacao', cor: '#8b5cf6', diasConcluidos: [] },
  { id: '4', nome: 'Agua 2L', cor: '#06b6d4', diasConcluidos: [] },
]

const TIPO_ICONE = {
  tarefa: <Circle className="h-3.5 w-3.5" />,
  evento: <Calendar className="h-3.5 w-3.5" />,
  nota: <Minus className="h-3.5 w-3.5" />,
}

export default function BulletJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const dataStr = format(dataSelecionada, 'yyyy-MM-dd')

  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [habitos, setHabitos] = useState<Habito[]>(HABITOS_PADRAO)
  const [novaEntrada, setNovaEntrada] = useState('')
  const [tipoEntrada, setTipoEntrada] = useState<'tarefa' | 'evento' | 'nota'>('tarefa')
  const [novoHabito, setNovoHabito] = useState('')
  const [mostrarAddHabito, setMostrarAddHabito] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    // Carregar dados do localStorage
    const savedEntradas = localStorage.getItem('bujo_entradas')
    const savedHabitos = localStorage.getItem('bujo_habitos')
    
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas))
    if (savedHabitos) setHabitos(JSON.parse(savedHabitos))
    
    setLoading(false)
  }, [router])

  // Salvar entradas no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('bujo_entradas', JSON.stringify(entradas))
    }
  }, [entradas, loading])

  // Salvar habitos no localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('bujo_habitos', JSON.stringify(habitos))
    }
  }, [habitos, loading])

  const entradasDoDia = entradas.filter(e => e.data === dataStr)

  const handleAddEntrada = () => {
    if (!novaEntrada.trim()) return

    const nova: Entrada = {
      id: Date.now().toString(),
      tipo: tipoEntrada,
      texto: novaEntrada.trim(),
      concluida: false,
      data: dataStr,
    }

    setEntradas(prev => [...prev, nova])
    setNovaEntrada('')
  }

  const handleToggleEntrada = (id: string) => {
    setEntradas(prev => prev.map(e => 
      e.id === id ? { ...e, concluida: !e.concluida } : e
    ))
  }

  const handleDeleteEntrada = (id: string) => {
    setEntradas(prev => prev.filter(e => e.id !== id))
  }

  const handleToggleHabito = (habitoId: string) => {
    setHabitos(prev => prev.map(h => {
      if (h.id !== habitoId) return h
      const jaConcluido = h.diasConcluidos.includes(dataStr)
      return {
        ...h,
        diasConcluidos: jaConcluido 
          ? h.diasConcluidos.filter(d => d !== dataStr)
          : [...h.diasConcluidos, dataStr]
      }
    }))
  }

  const handleAddHabito = () => {
    if (!novoHabito.trim()) return
    
    const cores = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
    const novaCor = cores[habitos.length % cores.length]
    
    setHabitos(prev => [...prev, {
      id: Date.now().toString(),
      nome: novoHabito.trim(),
      cor: novaCor,
      diasConcluidos: []
    }])
    setNovoHabito('')
    setMostrarAddHabito(false)
  }

  const handleDeleteHabito = (id: string) => {
    setHabitos(prev => prev.filter(h => h.id !== id))
  }

  const isHoje = format(new Date(), 'yyyy-MM-dd') === dataStr

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="animate-pulse">
          <Sparkles className="h-8 w-8 text-stone-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header minimalista */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Ir para Agenda Completa"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agenda Completa</span>
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDataSelecionada(subDays(dataSelecionada, 1))}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-stone-500" />
              </button>
              
              <button
                onClick={() => setDataSelecionada(new Date())}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isHoje 
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' 
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {isHoje ? 'Hoje' : format(dataSelecionada, "d 'de' MMM", { locale: ptBR })}
              </button>

              <button 
                onClick={() => setDataSelecionada(addDays(dataSelecionada, 1))}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Conteudo principal */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Data display */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">
            {format(dataSelecionada, 'EEEE', { locale: ptBR })}
          </p>
          <h1 className="text-4xl font-light text-stone-800 dark:text-stone-200">
            {format(dataSelecionada, "d 'de' MMMM", { locale: ptBR })}
          </h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Daily Log - lado esquerdo */}
          <div className="lg:col-span-3 space-y-6">
            {/* Input de nova entrada */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {(['tarefa', 'evento', 'nota'] as const).map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setTipoEntrada(tipo)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        tipoEntrada === tipo
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                      }`}
                    >
                      {tipo === 'tarefa' ? 'Tarefa' : tipo === 'evento' ? 'Evento' : 'Nota'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Input
                  placeholder={`Adicionar ${tipoEntrada}...`}
                  value={novaEntrada}
                  onChange={(e) => setNovaEntrada(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEntrada()}
                  className="flex-1 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-xl focus-visible:ring-stone-400"
                />
                <Button 
                  onClick={handleAddEntrada} 
                  size="icon"
                  className="rounded-xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100"
                >
                  <Plus className="h-4 w-4 text-white dark:text-stone-900" />
                </Button>
              </div>
            </div>

            {/* Lista de entradas */}
            <div className="space-y-2">
              {entradasDoDia.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                    <Sun className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                  </div>
                  <p className="text-stone-400 dark:text-stone-500 text-sm">
                    Nenhuma entrada para este dia
                  </p>
                  <p className="text-stone-300 dark:text-stone-600 text-xs mt-1">
                    Comece adicionando uma tarefa, evento ou nota
                  </p>
                </div>
              ) : (
                entradasDoDia.map(entrada => (
                  <div
                    key={entrada.id}
                    className={`group flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:shadow-sm ${
                      entrada.concluida ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggleEntrada(entrada.id)}
                      className={`mt-0.5 h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                        entrada.concluida
                          ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                          : 'border-stone-300 dark:border-stone-600 hover:border-stone-500'
                      }`}
                    >
                      {entrada.concluida && <Check className="h-3 w-3 text-white dark:text-stone-900" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-400">
                          {TIPO_ICONE[entrada.tipo]}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">
                          {entrada.tipo}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        entrada.concluida 
                          ? 'line-through text-stone-400 dark:text-stone-500' 
                          : 'text-stone-700 dark:text-stone-300'
                      }`}>
                        {entrada.texto}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteEntrada(entrada.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Habit Tracker - lado direito */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-800 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Habitos
                </h2>
                <button
                  onClick={() => setMostrarAddHabito(!mostrarAddHabito)}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 text-stone-500" />
                </button>
              </div>

              {mostrarAddHabito && (
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Novo habito..."
                    value={novoHabito}
                    onChange={(e) => setNovoHabito(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabito()}
                    className="flex-1 h-9 text-sm border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                  <Button size="sm" onClick={handleAddHabito} className="h-9 rounded-lg">
                    Adicionar
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {habitos.map(habito => {
                  const concluido = habito.diasConcluidos.includes(dataStr)
                  return (
                    <div
                      key={habito.id}
                      className="group flex items-center gap-3"
                    >
                      <button
                        onClick={() => handleToggleHabito(habito.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                          concluido 
                            ? 'text-white' 
                            : 'bg-stone-100 dark:bg-stone-800 hover:opacity-80'
                        }`}
                        style={{ backgroundColor: concluido ? habito.cor : undefined }}
                      >
                        {concluido ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habito.cor }} />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${
                        concluido 
                          ? 'text-stone-400 line-through' 
                          : 'text-stone-600 dark:text-stone-400'
                      }`}>
                        {habito.nome}
                      </span>
                      <button
                        onClick={() => handleDeleteHabito(habito.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {habitos.length > 0 && (
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Progresso hoje</span>
                    <span className="font-medium">
                      {habitos.filter(h => h.diasConcluidos.includes(dataStr)).length}/{habitos.length}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-stone-400 to-stone-600 dark:from-stone-500 dark:to-stone-300 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(habitos.filter(h => h.diasConcluidos.includes(dataStr)).length / habitos.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

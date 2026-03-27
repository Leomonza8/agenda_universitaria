'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Circle,
  Target,
  Sparkles,
  TrendingUp,
  Heart,
  Lightbulb,
  List,
  LayoutGrid,
  Pen,
  Star,
  Moon,
  Sun,
  Coffee,
  Flame
} from 'lucide-react'

// Dados mockados para demonstracao
const MOCK_DAILY_LOG = [
  { type: 'task', text: 'Entregar trabalho de Calculo', done: true },
  { type: 'task', text: 'Revisar anotacoes de Fisica', done: false },
  { type: 'event', text: 'Reuniao do grupo as 14h' },
  { type: 'note', text: 'Professor mencionou prova surpresa' },
  { type: 'task', text: 'Comprar material para projeto', done: false },
]

const MOCK_HABITS = [
  { name: 'Estudar 2h', icon: BookOpen, days: [true, true, false, true, true, false, false] },
  { name: 'Exercicio', icon: Flame, days: [true, false, true, false, true, false, false] },
  { name: 'Leitura', icon: Coffee, days: [true, true, true, true, false, false, false] },
  { name: 'Meditacao', icon: Moon, days: [false, true, true, true, true, false, false] },
]

const MOCK_MOOD = [
  { day: 'Seg', mood: 4 },
  { day: 'Ter', mood: 3 },
  { day: 'Qua', mood: 5 },
  { day: 'Qui', mood: 4 },
  { day: 'Sex', mood: 2 },
  { day: 'Sab', mood: null },
  { day: 'Dom', mood: null },
]

const MOCK_COLLECTIONS = [
  { title: 'Livros para ler', count: 8, color: '#3b82f6' },
  { title: 'Metas do semestre', count: 5, color: '#10b981' },
  { title: 'Ideias de projeto', count: 12, color: '#f59e0b' },
  { title: 'Filmes recomendados', count: 15, color: '#8b5cf6' },
]

const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export default function BulletJournalConceptPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (!session.isAdmin) {
      router.push('/')
      return
    }
    setIsAdmin(true)
    setLoading(false)
  }, [router])

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1a1a1a]">
      {/* Header */}
      <header className="border-b border-border/40 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight">Bullet Journal</h1>
                  <Badge variant="outline" className="text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-200">
                    Conceito
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Visao futura do sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Em desenvolvimento</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Intro */}
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            Seu diario academico digital
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Transforme sua agenda universitaria em um Bullet Journal completo. 
            Organize tarefas, acompanhe habitos, registre seu humor e crie colecoes 
            personalizadas — tudo em um so lugar, do seu jeito.
          </p>
        </div>

        {/* Grid de modulos */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Coluna 1: Daily Log */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Daily Log */}
            <Card className="border-border/40 shadow-sm bg-white dark:bg-[#222]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Pen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Daily Log</h3>
                      <p className="text-[11px] text-muted-foreground">Quarta, 26 de Marco</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    <List className="h-3 w-3 mr-1" />
                    Ver todos
                  </Button>
                </div>

                <div className="space-y-2">
                  {MOCK_DAILY_LOG.map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {item.type === 'task' && (
                        <button className="mt-0.5 flex-shrink-0">
                          {item.done ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </button>
                      )}
                      {item.type === 'event' && (
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      {item.type === 'note' && (
                        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${item.type === 'task' && item.done ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Circle className="h-3 w-3" />
                      <span>Tarefa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-blue-500" />
                      <span>Evento</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3 text-amber-500" />
                      <span>Nota</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Habit Tracker */}
            <Card className="border-border/40 shadow-sm bg-white dark:bg-[#222]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Habit Tracker</h3>
                      <p className="text-[11px] text-muted-foreground">Semana atual</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Estatisticas
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-medium text-muted-foreground pb-2 pr-4">Habito</th>
                        {DIAS_SEMANA.map((d, i) => (
                          <th key={i} className="text-center text-[11px] font-medium text-muted-foreground pb-2 w-8">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_HABITS.map((habit, i) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <habit.icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{habit.name}</span>
                            </div>
                          </td>
                          {habit.days.map((done, j) => (
                            <td key={j} className="text-center py-2.5">
                              <button 
                                className={`w-6 h-6 rounded-md transition-all ${
                                  done 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-muted/50 hover:bg-muted'
                                }`}
                              >
                                {done && <CheckCircle2 className="h-3.5 w-3.5 mx-auto" />}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Mood + Collections */}
          <div className="space-y-6">
            
            {/* Mood Tracker */}
            <Card className="border-border/40 shadow-sm bg-white dark:bg-[#222]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Mood Tracker</h3>
                    <p className="text-[11px] text-muted-foreground">Como voce esta?</p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-1 h-24 mb-3">
                  {MOCK_MOOD.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div 
                        className={`w-full rounded-t-md transition-all ${
                          item.mood 
                            ? item.mood >= 4 
                              ? 'bg-green-400' 
                              : item.mood >= 3 
                                ? 'bg-yellow-400' 
                                : 'bg-red-400'
                            : 'bg-muted/30'
                        }`}
                        style={{ height: item.mood ? `${item.mood * 18}px` : '8px' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{item.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 pt-3 border-t border-border/40">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button 
                      key={level}
                      className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-all hover:scale-110"
                    >
                      {level === 1 && '😔'}
                      {level === 2 && '😕'}
                      {level === 3 && '😐'}
                      {level === 4 && '🙂'}
                      {level === 5 && '😄'}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collections */}
            <Card className="border-border/40 shadow-sm bg-white dark:bg-[#222]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                      <LayoutGrid className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Colecoes</h3>
                      <p className="text-[11px] text-muted-foreground">Listas personalizadas</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {MOCK_COLLECTIONS.map((col, i) => (
                    <button 
                      key={i}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-8 rounded-full" 
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="text-sm font-medium">{col.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {col.count}
                      </Badge>
                    </button>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                  <Star className="h-3 w-3 mr-1.5" />
                  Nova colecao
                </Button>
              </CardContent>
            </Card>

            {/* Future Features */}
            <Card className="border-dashed border-2 border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Em breve</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Spreads mensais, future log, migracao de tarefas, 
                      templates personalizados e muito mais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rapid Logging Legend */}
        <div className="mt-10 p-6 rounded-xl bg-white dark:bg-[#222] border border-border/40">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Sistema de Rapid Logging
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Circle className="h-5 w-5 text-foreground" />
              <div>
                <p className="text-sm font-medium">Tarefa</p>
                <p className="text-[11px] text-muted-foreground">Algo a fazer</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Concluido</p>
                <p className="text-[11px] text-muted-foreground">Tarefa finalizada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Evento</p>
                <p className="text-[11px] text-muted-foreground">Compromisso marcado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Nota</p>
                <p className="text-[11px] text-muted-foreground">Informacao importante</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

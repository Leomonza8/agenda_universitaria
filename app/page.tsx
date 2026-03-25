'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, clearSession } from '@/lib/auth'
import { Disciplina, Horario, Tarefa, Anotacao, DIAS_SEMANA } from '@/lib/types'
import { GradeHorarios } from '@/components/grade-horarios'
import { ListaTarefas } from '@/components/lista-tarefas'
import { AnotacoesAula } from '@/components/anotacoes-aula'
import { CalendarioSemanal } from '@/components/calendario-semanal'
import { SistemaRevisao } from '@/components/sistema-revisao'
import { EditorGrade } from '@/components/editor-grade'
import { GerenciarDisciplinas } from '@/components/gerenciar-disciplinas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarDays, BookOpen, CheckSquare, User, LogOut, Shield, Settings } from 'lucide-react'

interface SessionUser {
  userId: string
  username: string
  nome: string
  isAdmin: boolean
}

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  const checkAuth = useCallback(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return false
    }
    setUser(session)
    return true
  }, [router])

  const fetchData = useCallback(async () => {
    if (!user) return
    
    const [disciplinasRes, horariosRes, tarefasRes, anotacoesRes, revsoesRes] = await Promise.all([
      // Buscar disciplinas públicas + disciplinas do usuário
      supabase.from('disciplinas').select('*').or(`user_id.is.null,user_id.eq.${user.userId}`).order('codigo'),
      supabase.from('horarios').select('*, disciplina:disciplinas(*)').eq('user_id', user.userId).order('hora_inicio'),
      supabase.from('tarefas').select('*, disciplina:disciplinas(*)').eq('user_id', user.userId).order('data_entrega', { ascending: true, nullsFirst: false }),
      supabase.from('anotacoes').select('*, disciplina:disciplinas(*)').eq('user_id', user.userId).order('data', { ascending: false }),
      supabase.from('revisoes').select('*, tarefa:tarefas(*)').eq('user_id', user.userId).order('data_revisao'),
    ])

    if (disciplinasRes.data) setDisciplinas(disciplinasRes.data)
    if (horariosRes.data) setHorarios(horariosRes.data)
    if (tarefasRes.data) setTarefas(tarefasRes.data)
    if (anotacoesRes.data) setAnotacoes(anotacoesRes.data)
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleLogout = () => {
    clearSession()
    window.location.href = '/auth/login'
  }

  const disciplinaInfo = disciplinaSelecionada
    ? disciplinas.find(d => d.id === disciplinaSelecionada)
    : null

  // Calcular contadores
  const hoje = new Date().getDay()
  const aulasHoje = horarios.filter(h => h.dia_semana === hoje)
  const tarefasPendentes = tarefas.filter(t => !t.concluida).length

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
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Agenda Universitaria</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Organize sua vida academica</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {tarefasPendentes > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs font-medium text-muted-foreground">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>{tarefasPendentes} pendentes</span>
                  </div>
                )}
                {aulasHoje.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-xs font-medium text-primary">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{aulasHoje.length} aulas hoje</span>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-medium">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline text-sm">{user?.nome || user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-2">
                    <p className="font-medium text-sm">{user?.nome}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/disciplinas')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configuracoes
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Painel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {disciplinaSelecionada && disciplinaInfo && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: disciplinaInfo.cor }}
                  />
                  <CardTitle className="text-lg">
                    {disciplinaInfo.codigo} - {disciplinaInfo.nome}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisciplinaSelecionada(null)}
                >
                  X
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {horarios
                  .filter(h => h.disciplina_id === disciplinaSelecionada)
                  .map(h => (
                    <Badge key={h.id} variant="outline">
                      {DIAS_SEMANA[h.dia_semana]} {h.hora_inicio}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="inicio" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-6 h-11 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="inicio" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Inicio</TabsTrigger>
              <TabsTrigger value="minha-grade" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Minha Grade</TabsTrigger>
              <TabsTrigger value="calendario" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Calendario</TabsTrigger>
              <TabsTrigger value="revisao" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Revisao</TabsTrigger>
              <TabsTrigger value="tarefas" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Tarefas</TabsTrigger>
              <TabsTrigger value="anotacoes" className="text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md">Anotacoes</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inicio" className="mt-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Disciplinas</h2>
                  <div className="flex flex-wrap gap-2">
                    {disciplinas.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setDisciplinaSelecionada(
                          disciplinaSelecionada === d.id ? null : d.id
                        )}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
                          disciplinaSelecionada === d.id
                            ? 'ring-2 ring-primary/30 shadow-sm'
                            : 'hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: d.cor + '12',
                          borderColor: d.cor + '30',
                          color: d.cor,
                        }}
                      >
                        {d.codigo || d.nome}
                      </button>
                    ))}
                    {disciplinas.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada. Acesse "Minha Grade" para adicionar.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Grade de Horarios</h2>
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4">
                      <GradeHorarios
                        horarios={horarios}
                        onSelectDisciplina={setDisciplinaSelecionada}
                      />
                    </CardContent>
                  </Card>
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Proximos Eventos</h2>
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      {tarefas.filter(t => !t.concluida).slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-start gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                          <div 
                            className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" 
                            style={{ backgroundColor: t.disciplina?.cor || '#888' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{t.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t.data_entrega ? new Date(t.data_entrega).toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              }) : 'Sem data'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {tarefas.filter(t => !t.concluida).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="minha-grade" className="mt-8">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Editor de Grade</h2>
                  <EditorGrade horarios={horarios} disciplinas={disciplinas} onUpdate={fetchData} user={user} />
                </section>
              </div>
              <div>
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Gerenciar</h2>
                  <GerenciarDisciplinas disciplinas={disciplinas} onUpdate={fetchData} user={user} />
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendario" className="mt-8">
            <CalendarioSemanal onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="revisao" className="mt-8">
            <SistemaRevisao />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-8">
            <ListaTarefas
              tarefas={tarefas}
              disciplinas={disciplinas}
              disciplinaFiltro={disciplinaSelecionada}
              onUpdate={fetchData}
            />
          </TabsContent>

          <TabsContent value="anotacoes" className="mt-8">
            <AnotacoesAula
              anotacoes={anotacoes}
              disciplinas={disciplinas}
              disciplinaFiltro={disciplinaSelecionada}
              onUpdate={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

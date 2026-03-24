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
    const ok = checkAuth()
    if (ok) setLoading(false)
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

  const hoje = new Date().getDay()
  const aulasHoje = horarios.filter(h => h.dia_semana === hoje)
  const tarefasPendentes = tarefas.filter(t => !t.concluida).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Agenda</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Seu planejador academico</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {tarefasPendentes > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckSquare className="h-3 w-3" />
                  {tarefasPendentes}
                </Badge>
              )}
              {aulasHoje.length > 0 && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  {aulasHoje.length} hoje
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">@{user?.username}</p>
                    {user?.isAdmin && (
                      <p className="text-xs text-muted-foreground">Administrador</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/disciplinas')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Minhas Disciplinas
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Painel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-6 gap-0">
              <TabsTrigger value="inicio" className="text-xs px-3 sm:px-4">Início</TabsTrigger>
              <TabsTrigger value="minha-grade" className="text-xs px-3 sm:px-4">Minha Grade</TabsTrigger>
              <TabsTrigger value="calendario" className="text-xs px-3 sm:px-4">Calendário</TabsTrigger>
              <TabsTrigger value="revisao" className="text-xs px-3 sm:px-4">Revisão</TabsTrigger>
              <TabsTrigger value="tarefas" className="text-xs px-3 sm:px-4">Tarefas</TabsTrigger>
              <TabsTrigger value="anotacoes" className="text-xs px-3 sm:px-4">Anotações</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inicio" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Disciplinas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {disciplinas.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setDisciplinaSelecionada(
                            disciplinaSelecionada === d.id ? null : d.id
                          )}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            disciplinaSelecionada === d.id
                              ? 'ring-2 ring-offset-2 ring-offset-background'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: d.cor + '20',
                            color: d.cor,
                          }}
                        >
                          {d.codigo}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Grade de Horarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GradeHorarios
                      horarios={horarios}
                      onSelectDisciplina={setDisciplinaSelecionada}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Proximos Eventos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tarefas.filter(t => !t.concluida).slice(0, 3).map(t => (
                      <div key={t.id} className="text-sm border-l-2 pl-3 py-1" style={{ borderColor: t.disciplina?.cor }}>
                        <p className="font-medium">{t.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.data_entrega ? new Date(t.data_entrega).toLocaleDateString('pt-BR') : 'Sem data'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="minha-grade" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <EditorGrade horarios={horarios} disciplinas={disciplinas} onUpdate={fetchData} user={user} />
              </div>
              <div>
                <GerenciarDisciplinas disciplinas={disciplinas} onUpdate={fetchData} user={user} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <CalendarioSemanal onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="revisao" className="mt-6">
            <SistemaRevisao />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-6">
            <ListaTarefas
              tarefas={tarefas}
              disciplinas={disciplinas}
              disciplinaFiltro={disciplinaSelecionada}
              onUpdate={fetchData}
            />
          </TabsContent>

          <TabsContent value="anotacoes" className="mt-6">
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

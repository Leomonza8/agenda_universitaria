'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Disciplina, Horario, Tarefa, Anotacao, DIAS_SEMANA } from '@/lib/types'
import { GradeHorarios } from '@/components/grade-horarios'
import { ListaTarefas } from '@/components/lista-tarefas'
import { AnotacoesAula } from '@/components/anotacoes-aula'
import { CalendarioIntegrado } from '@/components/calendario-integrado'
import { SistemaRevisao } from '@/components/sistema-revisao'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, BookOpen, CheckSquare, Clock, BookMarked } from 'lucide-react'

export default function Home() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [disciplinasRes, horariosRes, tarefasRes, anotacoesRes] = await Promise.all([
      supabase.from('disciplinas').select('*').order('codigo'),
      supabase.from('horarios').select('*, disciplina:disciplinas(*)').order('hora_inicio'),
      supabase.from('tarefas').select('*, disciplina:disciplinas(*)').order('data_entrega', { ascending: true, nullsFirst: false }),
      supabase.from('anotacoes').select('*, disciplina:disciplinas(*)').order('data', { ascending: false }),
    ])

    if (disciplinasRes.data) setDisciplinas(disciplinasRes.data)
    if (horariosRes.data) setHorarios(horariosRes.data)
    if (tarefasRes.data) setTarefas(tarefasRes.data)
    if (anotacoesRes.data) setAnotacoes(anotacoesRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">Seu planejador acadêmico</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tarefasPendentes > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {tarefasPendentes} tarefa{tarefasPendentes > 1 ? 's' : ''}
                </Badge>
              )}
              {aulasHoje.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {aulasHoje.length} aula{aulasHoje.length > 1 ? 's' : ''} hoje
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                  ✕
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="inicio" className="text-xs">Início</TabsTrigger>
            <TabsTrigger value="calendario" className="text-xs">Calendário</TabsTrigger>
            <TabsTrigger value="revisao" className="text-xs">Revisão</TabsTrigger>
            <TabsTrigger value="horarios" className="text-xs">Horários</TabsTrigger>
            <TabsTrigger value="tarefas" className="text-xs">Tarefas</TabsTrigger>
            <TabsTrigger value="anotacoes" className="text-xs">Anotações</TabsTrigger>
          </TabsList>

          {/* Aba Início */}
          <TabsContent value="inicio" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Disciplinas */}
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

                {/* Grade de Horários */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Grade de Horários
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
                {/* Próximos Eventos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Próximos Eventos</CardTitle>
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

          {/* Aba Calendário */}
          <TabsContent value="calendario" className="mt-6">
            <CalendarioIntegrado />
          </TabsContent>

          {/* Aba Revisão */}
          <TabsContent value="revisao" className="mt-6">
            <SistemaRevisao />
          </TabsContent>

          {/* Aba Horários */}
          <TabsContent value="horarios" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Grade de Horários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GradeHorarios
                  horarios={horarios}
                  onSelectDisciplina={setDisciplinaSelecionada}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Tarefas */}
          <TabsContent value="tarefas" className="mt-6">
            <ListaTarefas
              tarefas={tarefas}
              disciplinas={disciplinas}
              disciplinaFiltro={disciplinaSelecionada}
              onUpdate={fetchData}
            />
          </TabsContent>

          {/* Aba Anotações */}
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

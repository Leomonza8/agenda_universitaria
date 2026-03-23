'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Disciplina, Horario, Tarefa, Anotacao, DIAS_SEMANA } from '@/lib/types'
import { GradeHorarios } from '@/components/grade-horarios'
import { ListaTarefas } from '@/components/lista-tarefas'
import { AnotacoesAula } from '@/components/anotacoes-aula'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, BookOpen, CheckSquare, X } from 'lucide-react'

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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Minha Agenda UFC</h1>
              <p className="text-sm text-muted-foreground">Engenharia de Computação - 2025.1</p>
            </div>
            <div className="flex items-center gap-3">
              {tarefasPendentes > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {tarefasPendentes} pendente{tarefasPendentes > 1 ? 's' : ''}
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

      <div className="max-w-6xl mx-auto px-4 py-6">
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
                  size="icon"
                  onClick={() => setDisciplinaSelecionada(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {horarios
                  .filter(h => h.disciplina_id === disciplinaSelecionada)
                  .map(h => (
                    <Badge key={h.id} variant="outline">
                      {DIAS_SEMANA[h.dia_semana]} {h.hora_inicio} - {h.local}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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
                        ...(disciplinaSelecionada === d.id && { ringColor: d.cor }),
                      }}
                    >
                      {d.codigo}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Tabs defaultValue="tarefas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
                <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
              </TabsList>
              <TabsContent value="tarefas" className="mt-4">
                <ListaTarefas
                  tarefas={tarefas}
                  disciplinas={disciplinas}
                  disciplinaFiltro={disciplinaSelecionada}
                  onUpdate={fetchData}
                />
              </TabsContent>
              <TabsContent value="anotacoes" className="mt-4">
                <AnotacoesAula
                  anotacoes={anotacoes}
                  disciplinas={disciplinas}
                  disciplinaFiltro={disciplinaSelecionada}
                  onUpdate={fetchData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}

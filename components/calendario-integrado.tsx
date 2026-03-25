'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Tarefa, Revisao } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, BookMarked, Clock } from 'lucide-react'
import { format, parseISO, isSameDay, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function CalendarioIntegrado() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const session = getSession()
    if (!session) return

    setLoading(true)
    const [tarefasRes, revisoesRes] = await Promise.all([
      supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
        .eq('user_id', session.userId)
        .order('data_entrega', { ascending: true }),
      supabase
        .from('revisoes')
        .select('*, tarefa:tarefas(*, disciplina:disciplinas(*))')
        .eq('user_id', session.userId)
        .order('data_revisao', { ascending: true }),
    ])

    if (tarefasRes.data) setTarefas(tarefasRes.data)
    if (revisoesRes.data) setRevisoes(revisoesRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tarefasDodia = tarefas.filter(t => 
    t.data_entrega && isSameDay(parseISO(t.data_entrega), selectedDate)
  )

  const revisoesDodia = revisoes.filter(r =>
    isSameDay(parseISO(r.data_revisao), selectedDate)
  )

  const handleToggleTarefa = async (tarefaId: string, concluida: boolean) => {
    const { error } = await supabase
      .from('tarefas')
      .update({ concluida: !concluida })
      .eq('id', tarefaId)

    if (!error) {
      setTarefas(tarefas.map(t => 
        t.id === tarefaId ? { ...t, concluida: !concluida } : t
      ))
    }
  }

  const handleUpdateRevisao = async (revisaoId: string, status: string) => {
    const { error } = await supabase
      .from('revisoes')
      .update({ status })
      .eq('id', revisaoId)

    if (!error) {
      setRevisoes(revisoes.map(r =>
        r.id === revisaoId ? { ...r, status } : r
      ))
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  const proximaTarefa = tarefas
    .filter(t => !t.concluida && t.data_entrega && !isPast(parseISO(t.data_entrega)))
    .sort((a, b) => new Date(a.data_entrega!).getTime() - new Date(b.data_entrega!).getTime())[0]

  const proximaRevisao = revisoes
    .filter(r => r.status !== 'concluida' && !isPast(parseISO(r.data_revisao)))
    .sort((a, b) => new Date(a.data_revisao).getTime() - new Date(b.data_revisao).getTime())[0]

  return (
    <div className="space-y-6">
      {/* Calendário Simples */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
            >
              ←
            </button>
            <span className="text-sm font-medium">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
            >
              →
            </button>
          </div>

          {isToday(selectedDate) && (
            <Badge className="w-full justify-center" variant="secondary">
              Hoje
            </Badge>
          )}

          {tarefasDodia.length === 0 && revisoesDodia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento neste dia
            </div>
          ) : (
            <div className="space-y-4">
              {tarefasDodia.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <BookMarked className="h-4 w-4" />
                    Tarefas ({tarefasDodia.length})
                  </h3>
                  <div className="space-y-2">
                    {tarefasDodia.map(t => (
                      <div key={t.id} className="flex items-start gap-3 p-2 rounded border">
                        <Checkbox
                          checked={t.concluida}
                          onCheckedChange={() => handleToggleTarefa(t.id, t.concluida)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.concluida ? 'line-through text-muted-foreground' : ''}`}>
                            {t.titulo}
                          </p>
                          {t.disciplina && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {t.disciplina.codigo}
                            </Badge>
                          )}
                        </div>
                        {t.prioridade && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: t.prioridade === 'alta' ? '#ef4444' : t.prioridade === 'media' ? '#f59e0b' : '#10b981',
                              color: t.prioridade === 'alta' ? '#ef4444' : t.prioridade === 'media' ? '#f59e0b' : '#10b981',
                            }}
                          >
                            {t.prioridade}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {revisoesDodia.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Revisões ({revisoesDodia.length})
                  </h3>
                  <div className="space-y-2">
                    {revisoesDodia.map(r => (
                      <div key={r.id} className="p-2 rounded border">
                        <p className="text-sm font-medium">{r.tarefa?.titulo}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              const statusMap = {
                                'nao_iniciada': 'em_progresso',
                                'em_progresso': 'concluida',
                                'concluida': 'nao_iniciada'
                              }
                              handleUpdateRevisao(r.id, statusMap[r.status as keyof typeof statusMap])
                            }}
                          >
                            {r.status === 'nao_iniciada' ? '⭕' : r.status === 'em_progresso' ? '⏳' : '✅'} {r.status}
                          </Badge>
                          {r.tempo_estimado && (
                            <Badge variant="secondary" className="text-xs">
                              {r.tempo_estimado}min
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximos Eventos */}
      <div className="grid md:grid-cols-2 gap-4">
        {proximaTarefa && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                Próxima Tarefa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-sm">{proximaTarefa.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entrega: {format(parseISO(proximaTarefa.data_entrega!), 'dd/MM', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        )}

        {proximaRevisao && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Próxima Revisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-sm">{proximaRevisao.tarefa?.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(parseISO(proximaRevisao.data_revisao), 'dd/MM', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

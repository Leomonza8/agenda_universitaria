'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tarefa, Revisao, Disciplina } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ItemCalendario =
  | { tipo: 'tarefa'; id: string; titulo: string; cor: string; codigo: string; concluida: boolean; prioridade: string }
  | { tipo: 'revisao'; id: string; titulo: string; cor: string; codigo: string; status: string; tempo: number | null }

interface DayColumn {
  date: Date
  items: ItemCalendario[]
}

export function CalendarioSemanal({ onUpdate }: { onUpdate?: () => void }) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)

  const [dragItem, setDragItem] = useState<{ tipo: 'tarefa' | 'revisao'; id: string } | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  // Dialog nova tarefa
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState<string>('')
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaDisciplinaId, setNovaDisciplinaId] = useState('')
  const [novaPrioridade, setNovaPrioridade] = useState('media')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [tRes, rRes, dRes] = await Promise.all([
      supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
        .order('data_entrega', { ascending: true, nullsFirst: false }),
      supabase
        .from('revisoes')
        .select('*, tarefa:tarefas(*, disciplina:disciplinas(*))')
        .order('data_revisao', { ascending: true }),
      supabase.from('disciplinas').select('*').order('codigo'),
    ])
    if (tRes.data) setTarefas(tRes.data)
    if (rRes.data) setRevisoes(rRes.data)
    if (dRes.data) setDisciplinas(dRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const weekDays: DayColumn[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')

    const items: ItemCalendario[] = []

    tarefas.forEach(t => {
      if (t.data_entrega && format(parseISO(t.data_entrega), 'yyyy-MM-dd') === dateStr) {
        items.push({
          tipo: 'tarefa',
          id: t.id,
          titulo: t.titulo,
          cor: t.disciplina?.cor ?? '#6b7280',
          codigo: t.disciplina?.codigo ?? '',
          concluida: t.concluida,
          prioridade: t.prioridade ?? 'media',
        })
      }
    })

    revisoes.forEach(r => {
      if (format(parseISO(r.data_revisao), 'yyyy-MM-dd') === dateStr) {
        items.push({
          tipo: 'revisao',
          id: r.id,
          titulo: r.tarefa?.titulo ?? 'Revisão',
          cor: r.tarefa?.disciplina?.cor ?? '#8b5cf6',
          codigo: r.tarefa?.disciplina?.codigo ?? '',
          status: r.status,
          tempo: r.tempo_estimado ?? null,
        })
      }
    })

    return { date, items }
  })

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, tipo: 'tarefa' | 'revisao', id: string) => {
    setDragItem({ tipo, id })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(dateStr)
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    setDragOverDay(null)
    if (!dragItem) return

    const dateStr = format(targetDate, 'yyyy-MM-dd')

    if (dragItem.tipo === 'tarefa') {
      const { error } = await supabase
        .from('tarefas')
        .update({ data_entrega: dateStr })
        .eq('id', dragItem.id)
      if (!error) {
        setTarefas(prev =>
          prev.map(t => t.id === dragItem.id ? { ...t, data_entrega: dateStr } : t)
        )
      }
    } else {
      const { error } = await supabase
        .from('revisoes')
        .update({ data_revisao: dateStr })
        .eq('id', dragItem.id)
      if (!error) {
        setRevisoes(prev =>
          prev.map(r => r.id === dragItem.id ? { ...r, data_revisao: dateStr } : r)
        )
      }
    }

    setDragItem(null)
  }

  const handleDragLeave = () => {
    setDragOverDay(null)
  }

  const handleToggleTarefa = async (id: string, concluida: boolean) => {
    await supabase.from('tarefas').update({ concluida: !concluida }).eq('id', id)
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: !concluida } : t))
  }

  const handleAddTarefaNoCalendario = async () => {
    if (!novoTitulo.trim() || !novaDisciplinaId) return
    setSaving(true)
    const { error, data } = await supabase
      .from('tarefas')
      .insert([{
        titulo: novoTitulo.trim(),
        disciplina_id: novaDisciplinaId,
        data_entrega: dialogDate || null,
        prioridade: novaPrioridade,
        concluida: false,
      }])
      .select('*, disciplina:disciplinas(*)')
      .single()

    if (!error && data) {
      setTarefas(prev => [...prev, data])
      setNovoTitulo('')
      setNovaDisciplinaId('')
      setNovaPrioridade('media')
      setDialogOpen(false)
      onUpdate?.()
    }
    setSaving(false)
  }

  const prioridadeCor = { alta: '#ef4444', media: '#f59e0b', baixa: '#10b981' }
  const statusLabel = { nao_iniciada: 'Pendente', em_progresso: 'Em andamento', concluida: 'Concluída' }

  const prevWeek = () => setWeekStart(w => subWeeks(w, 1))
  const nextWeek = () => setWeekStart(w => addWeeks(w, 1))
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const diasNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header da semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {format(weekStart, 'dd MMM', { locale: ptBR })} – {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: ptBR })}
        </span>
        <Button
          size="sm"
          onClick={() => {
            setDialogDate(format(new Date(), 'yyyy-MM-dd'))
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Tarefa
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
          <span>Tarefa</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-purple-200 border border-purple-400" />
          <span>Revisão</span>
        </div>
        <span className="ml-2">Arraste para mover entre dias</span>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-2 min-h-[400px]">
        {weekDays.map((col, i) => {
          const dateStr = format(col.date, 'yyyy-MM-dd')
          const isHoje = isToday(col.date)
          const isDragOver = dragOverDay === dateStr

          return (
            <div
              key={dateStr}
              className={`flex flex-col rounded-xl border-2 transition-all min-h-[380px] ${
                isHoje
                  ? 'border-primary bg-primary/5'
                  : isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-border bg-card'
              }`}
              onDragOver={e => handleDragOver(e, dateStr)}
              onDrop={e => handleDrop(e, col.date)}
              onDragLeave={handleDragLeave}
            >
              {/* Cabeçalho do dia */}
              <div
                className={`px-2 py-2 text-center border-b ${
                  isHoje ? 'border-primary/30' : 'border-border'
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">{diasNomes[i]}</p>
                <div
                  className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-0.5 ${
                    isHoje ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {format(col.date, 'd')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {format(col.date, 'MMM', { locale: ptBR })}
                </p>
              </div>

              {/* Items do dia */}
              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                {col.items.length === 0 && (
                  <div
                    className="h-full flex items-center justify-center cursor-pointer group"
                    onClick={() => {
                      setDialogDate(dateStr)
                      setDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                  </div>
                )}

                {col.items.map(item => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    draggable
                    onDragStart={e => handleDragStart(e, item.tipo, item.id)}
                    className={`rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-md ${
                      item.tipo === 'tarefa' && item.concluida ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: item.cor + '18',
                      borderLeft: `3px solid ${item.tipo === 'revisao' ? '#8b5cf6' : item.cor}`,
                    }}
                    title={`${item.tipo === 'tarefa' ? 'Tarefa' : 'Revisão'}: ${item.titulo}`}
                  >
                    {/* Badge do tipo */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide px-1 rounded"
                        style={{
                          backgroundColor: item.tipo === 'revisao' ? '#8b5cf620' : item.cor + '20',
                          color: item.tipo === 'revisao' ? '#7c3aed' : item.cor,
                        }}
                      >
                        {item.tipo === 'revisao' ? 'Rev' : item.codigo}
                      </span>
                      {item.tipo === 'tarefa' && (
                        <span
                          className="w-1.5 h-1.5 rounded-full ml-auto"
                          style={{ backgroundColor: prioridadeCor[item.prioridade as keyof typeof prioridadeCor] ?? '#6b7280' }}
                        />
                      )}
                      {item.tipo === 'revisao' && item.status === 'concluida' && (
                        <span className="text-[10px] ml-auto">✓</span>
                      )}
                    </div>

                    {/* Título */}
                    <p
                      className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                        item.tipo === 'tarefa' && item.concluida ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {item.titulo}
                    </p>

                    {/* Ação rápida tarefa */}
                    {item.tipo === 'tarefa' && (
                      <button
                        className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={e => {
                          e.stopPropagation()
                          handleToggleTarefa(item.id, item.concluida)
                        }}
                      >
                        {item.concluida ? '↩ Reabrir' : '✓ Concluir'}
                      </button>
                    )}

                    {/* Status revisão */}
                    {item.tipo === 'revisao' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {statusLabel[item.status as keyof typeof statusLabel] ?? item.status}
                        {item.tempo ? ` · ${item.tempo}min` : ''}
                      </p>
                    )}
                  </div>
                ))}

                {/* Botão adicionar no dia com items */}
                {col.items.length > 0 && (
                  <button
                    onClick={() => {
                      setDialogDate(dateStr)
                      setDialogOpen(true)
                    }}
                    className="w-full text-[10px] text-muted-foreground/50 hover:text-muted-foreground py-1 transition-colors"
                  >
                    + adicionar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog nova tarefa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Título da tarefa"
              value={novoTitulo}
              onChange={e => setNovoTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTarefaNoCalendario()}
              autoFocus
            />
            <Select value={novaDisciplinaId} onValueChange={setNovaDisciplinaId}>
              <SelectTrigger>
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.codigo} – {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dialogDate}
                onChange={e => setDialogDate(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleAddTarefaNoCalendario}
                disabled={saving || !novoTitulo.trim() || !novaDisciplinaId}
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

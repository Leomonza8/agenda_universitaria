'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Tarefa, Revisao, Disciplina } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type ItemCalendario =
  | { tipo: 'tarefa'; id: string; titulo: string; cor: string; codigo: string; concluida: boolean; prioridade: string }
  | { tipo: 'revisao'; id: string; titulo: string; cor: string; codigo: string; status: string; tempo: number | null }

interface DayColumn {
  date: Date
  items: ItemCalendario[]
}

const prioridadeCor: Record<string, string> = { alta: '#ef4444', media: '#f59e0b', baixa: '#10b981' }
const statusLabel: Record<string, string> = {
  nao_iniciada: 'Pendente',
  em_progresso: 'Em andamento',
  concluida: 'Concluida',
}
const DIAS_NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

export function CalendarioSemanal({ onUpdate }: { onUpdate?: () => void }) {
  const supabase = createClient()

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const today = new Date()
    const ws = startOfWeek(today, { weekStartsOn: 1 })
    const diff = Math.floor((today.getTime() - ws.getTime()) / 86400000)
    return Math.min(Math.max(diff, 0), 6)
  })

  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)

  const [dragItem, setDragItem] = useState<{ tipo: 'tarefa' | 'revisao'; id: string } | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState('')
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaDisciplinaId, setNovaDisciplinaId] = useState('')
  const [novaPrioridade, setNovaPrioridade] = useState('media')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [tRes, rRes, dRes] = await Promise.all([
      supabase.from('tarefas').select('*, disciplina:disciplinas(*)').order('data_entrega', { ascending: true, nullsFirst: false }),
      supabase.from('revisoes').select('*, tarefa:tarefas(*, disciplina:disciplinas(*))').order('data_revisao', { ascending: true }),
      supabase.from('disciplinas').select('*').order('codigo'),
    ])
    if (tRes.data) setTarefas(tRes.data)
    if (rRes.data) setRevisoes(rRes.data)
    if (dRes.data) setDisciplinas(dRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

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
          titulo: r.tarefa?.titulo ?? 'Revisao',
          cor: r.tarefa?.disciplina?.cor ?? '#8b5cf6',
          codigo: r.tarefa?.disciplina?.codigo ?? '',
          status: r.status,
          tempo: r.tempo_estimado ?? null,
        })
      }
    })
    return { date, items }
  })

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
      const { error } = await supabase.from('tarefas').update({ data_entrega: dateStr }).eq('id', dragItem.id)
      if (!error) setTarefas(prev => prev.map(t => t.id === dragItem.id ? { ...t, data_entrega: dateStr } : t))
    } else {
      const { error } = await supabase.from('revisoes').update({ data_revisao: dateStr }).eq('id', dragItem.id)
      if (!error) setRevisoes(prev => prev.map(r => r.id === dragItem.id ? { ...r, data_revisao: dateStr } : r))
    }
    setDragItem(null)
  }

  const handleToggleTarefa = async (id: string, concluida: boolean) => {
    await supabase.from('tarefas').update({ concluida: !concluida }).eq('id', id)
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: !concluida } : t))
  }

  const handleToggleRevisao = async (id: string, status: string) => {
    const novoStatus = status === 'concluida' ? 'nao_iniciada' : 'concluida'
    await supabase.from('revisoes').update({ status: novoStatus }).eq('id', id)
    setRevisoes(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r))
  }

  const abrirDialogDia = (dateStr: string) => {
    setDialogDate(dateStr)
    setNovoTitulo('')
    setNovaDisciplinaId('')
    setNovaPrioridade('media')
    setDialogOpen(true)
  }

  const handleAddTarefa = async () => {
    if (!novoTitulo.trim() || !novaDisciplinaId) return
    setSaving(true)
    const session = getSession()
    if (!session) { setSaving(false); return }
    const { error, data } = await supabase
      .from('tarefas')
      .insert([{ titulo: novoTitulo.trim(), disciplina_id: novaDisciplinaId, data_entrega: dialogDate || null, prioridade: novaPrioridade, concluida: false, user_id: session.userId }])
      .select('*, disciplina:disciplinas(*)')
      .single()
    if (!error && data) {
      setTarefas(prev => [...prev, data])
      setDialogOpen(false)
      onUpdate?.()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
      </div>
    )
  }

  // ─── Navegacao da semana ───────────────────────────────────
  const prevWeek = () => setWeekStart(w => subWeeks(w, 1))
  const nextWeek = () => setWeekStart(w => addWeeks(w, 1))
  const goToToday = () => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
    setWeekStart(ws)
    const diff = Math.floor((new Date().getTime() - ws.getTime()) / 86400000)
    setSelectedDayIdx(Math.min(Math.max(diff, 0), 6))
  }

  const selectedDay = weekDays[selectedDayIdx]
  const selectedDateStr = format(selectedDay.date, 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {format(weekStart, 'dd MMM', { locale: ptBR })} – {format(addDays(weekStart, 6), 'dd MMM', { locale: ptBR })}
        </span>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => abrirDialogDia(format(new Date(), 'yyyy-MM-dd'))}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nova Tarefa</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* ── Seletor de dia (mobile) / grade completa (desktop) ── */}

      {/* Chips dos dias — visivel sempre, serve como navegacao no mobile e indicador no desktop */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((col, i) => {
          const hoje = isToday(col.date)
          const selecionado = i === selectedDayIdx
          const temItems = col.items.length > 0
          return (
            <button
              key={i}
              onClick={() => setSelectedDayIdx(i)}
              className={cn(
                'flex flex-col items-center py-2 rounded-lg transition-all text-center border',
                selecionado
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : hoje
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-foreground border-border/60 hover:bg-muted/50'
              )}
            >
              <span className="text-[10px] font-medium leading-none mb-1 opacity-80">{DIAS_NOMES[i]}</span>
              <span className="text-sm font-bold leading-none">{format(col.date, 'd')}</span>
              {temItems && (
                <span className={cn(
                  'mt-1 w-1.5 h-1.5 rounded-full',
                  selecionado ? 'bg-primary-foreground/70' : 'bg-primary/60'
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Visualizacao mobile: dia selecionado ── */}
      <div className="sm:hidden">
        <DayCard
          col={selectedDay}
          isDragOver={dragOverDay === selectedDateStr}
          onDragOver={e => handleDragOver(e, selectedDateStr)}
          onDrop={e => handleDrop(e, selectedDay.date)}
          onDragLeave={() => setDragOverDay(null)}
          onAddClick={() => abrirDialogDia(selectedDateStr)}
          onToggleTarefa={handleToggleTarefa}
          onToggleRevisao={handleToggleRevisao}
          onDragStart={handleDragStart}
          expanded
        />
      </div>

      {/* ── Visualizacao desktop: grade 7 colunas ── */}
      <div className="hidden sm:grid sm:grid-cols-7 gap-2">
        {weekDays.map((col, i) => {
          const dateStr = format(col.date, 'yyyy-MM-dd')
          return (
            <DayCard
              key={dateStr}
              col={col}
              isDragOver={dragOverDay === dateStr}
              onDragOver={e => handleDragOver(e, dateStr)}
              onDrop={e => handleDrop(e, col.date)}
              onDragLeave={() => setDragOverDay(null)}
              onAddClick={() => abrirDialogDia(dateStr)}
              onToggleTarefa={handleToggleTarefa}
              onToggleRevisao={handleToggleRevisao}
              onDragStart={handleDragStart}
            />
          )
        })}
      </div>

      {/* Dialog nova tarefa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Nova Tarefa</DialogTitle>
            <DialogDescription className="text-sm">
              {dialogDate && format(parseISO(dialogDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Titulo da tarefa"
              value={novoTitulo}
              onChange={e => setNovoTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTarefa()}
              autoFocus
              className="h-9"
            />
            <Select value={novaDisciplinaId} onValueChange={setNovaDisciplinaId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.cor }} />
                      {d.codigo ? `${d.codigo} – ${d.nome}` : d.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dialogDate}
                onChange={e => setDialogDate(e.target.value)}
                className="h-9 flex-1"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="flex-1" onClick={handleAddTarefa} disabled={saving || !novoTitulo.trim() || !novaDisciplinaId}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Componente de coluna de dia ───────────────────────────────────────────────
interface DayCardProps {
  col: DayColumn
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragLeave: () => void
  onAddClick: () => void
  onToggleTarefa: (id: string, concluida: boolean) => void
  onToggleRevisao: (id: string, status: string) => void
  onDragStart: (e: React.DragEvent, tipo: 'tarefa' | 'revisao', id: string) => void
  expanded?: boolean
}

function DayCard({ col, isDragOver, onDragOver, onDrop, onDragLeave, onAddClick, onToggleTarefa, onToggleRevisao, onDragStart, expanded }: DayCardProps) {
  const hoje = isToday(col.date)

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border transition-all',
        expanded ? 'min-h-[320px]' : 'min-h-[200px]',
        hoje ? 'border-primary/50 bg-primary/5' : isDragOver ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card'
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      {/* Cabecalho */}
      <div className={cn('flex items-center justify-between px-3 py-2 border-b', hoje ? 'border-primary/20' : 'border-border/40')}>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full',
            hoje ? 'bg-primary text-primary-foreground' : 'text-foreground'
          )}>
            {format(col.date, 'd')}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {format(col.date, 'EEE', { locale: ptBR })}
          </span>
          {col.items.length > 0 && (
            <span className="text-xs text-muted-foreground">· {col.items.length}</span>
          )}
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
          title="Adicionar tarefa"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {col.items.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40">vazio</span>
          </div>
        )}

        {col.items.map(item => (
          <div
            key={`${item.tipo}-${item.id}`}
            draggable
            onDragStart={e => onDragStart(e, item.tipo, item.id)}
            className={cn(
              'rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-sm',
              (item.tipo === 'tarefa' && item.concluida) || (item.tipo === 'revisao' && item.status === 'concluida')
                ? 'opacity-50'
                : ''
            )}
            style={{
              backgroundColor: item.cor + '15',
              borderLeft: `3px solid ${item.tipo === 'revisao' ? '#8b5cf6' : item.cor}`,
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {item.codigo && (
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: item.cor }}>
                      {item.codigo}
                    </span>
                  )}
                  {item.tipo === 'tarefa' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: prioridadeCor[item.prioridade] ?? '#6b7280' }}
                    />
                  )}
                  {item.tipo === 'revisao' && (
                    <span className="text-[9px] font-bold uppercase text-purple-500">Rev</span>
                  )}
                </div>
                <p className={cn(
                  'text-xs font-medium leading-snug',
                  item.tipo === 'tarefa' && item.concluida ? 'line-through text-muted-foreground' : 'text-foreground'
                )}>
                  {item.titulo}
                </p>
                {item.tipo === 'revisao' && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {statusLabel[item.status] ?? item.status}
                    {item.tempo ? ` · ${item.tempo}min` : ''}
                  </p>
                )}
              </div>

              {/* Botao concluir tarefa */}
              {item.tipo === 'tarefa' && (
                <button
                  onClick={e => { e.stopPropagation(); onToggleTarefa(item.id, item.concluida) }}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center mt-0.5',
                    item.concluida
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                  title={item.concluida ? 'Reabrir' : 'Concluir'}
                >
                  {item.concluida && <Check className="h-3 w-3" />}
                </button>
              )}

              {/* Botao concluir revisao */}
              {item.tipo === 'revisao' && (
                <button
                  onClick={e => { e.stopPropagation(); onToggleRevisao(item.id, item.status) }}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center mt-0.5',
                    item.status === 'concluida'
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'border-border hover:border-purple-400 hover:bg-purple-50'
                  )}
                  title={item.status === 'concluida' ? 'Reabrir revisao' : 'Marcar como concluida'}
                >
                  {item.status === 'concluida' && <Check className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

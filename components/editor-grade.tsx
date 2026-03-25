'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Disciplina, Horario } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical, Plus, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const DIAS_NUM = [1, 2, 3, 4, 5]
const HORAS_DIA = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]
const HORAS_NOTURNO = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
const TODAS_HORAS = [...HORAS_DIA, ...HORAS_NOTURNO]

interface Props {
  disciplinas: Disciplina[]
  horarios: Horario[]
  onUpdate: () => void
  user?: any
}

export function EditorGrade({ disciplinas, horarios, onUpdate, user }: Props) {
  const supabase = createClient()
  const [dragging, setDragging] = useState<string | null>(null)
  const [hoverCell, setHoverCell] = useState<{ dia: number; hora: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogHorario, setDialogHorario] = useState<{ dia: number; hora: string } | null>(null)
  const [selectedDisciplina, setSelectedDisciplina] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [expandNoturno, setExpandNoturno] = useState(false)
  const dragRef = useRef<string | null>(null)

  const horasExibidas = expandNoturno ? TODAS_HORAS : HORAS_DIA

  // Retorna o horário cujo hora_inicio === hora (célula-raiz do bloco)
  const getHorarioInicio = (dia: number, hora: string) => {
    return horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora)
  }

  // Verifica se esta célula está coberta por algum horário (mas não é a célula de início)
  const isCelulaOcupada = (dia: number, hora: string): boolean => {
    return horarios.some(h => {
      if (h.dia_semana !== dia) return false
      if (h.hora_inicio === hora) return false // é a célula raiz, não intermediária
      if (!h.hora_fim) return false
      return hora > h.hora_inicio && hora < h.hora_fim
    })
  }

  // Calcula o rowSpan de um horário baseado em hora_inicio e hora_fim
  const calcRowSpan = (horario: Horario): number => {
    if (!horario.hora_fim) return 1
    const idxInicio = TODAS_HORAS.indexOf(horario.hora_inicio)
    const idxFim = TODAS_HORAS.indexOf(horario.hora_fim)
    if (idxInicio < 0 || idxFim <= idxInicio) return 1
    return idxFim - idxInicio
  }

  const handleDragStart = (disciplinaId: string) => {
    dragRef.current = disciplinaId
    setDragging(disciplinaId)
  }

  const handleDragOver = (e: React.DragEvent, dia: number, hora: string) => {
    e.preventDefault()
    setHoverCell({ dia, hora })
  }

  const handleDrop = async (e: React.DragEvent, dia: number, hora: string) => {
    e.preventDefault()
    const disciplinaId = dragRef.current
    if (!disciplinaId) return

    const existente = getHorarioNaSlot(dia, hora)
    if (existente) return

    setHoverCell(null)
    setDragging(null)
    dragRef.current = null

    setSelectedDisciplina(disciplinaId)
    const idx = TODAS_HORAS.indexOf(hora)
    setHoraFim(TODAS_HORAS[Math.min(idx + 2, TODAS_HORAS.length - 1)])
    setDialogHorario({ dia, hora })
  }

  const handleSalvarHorario = async () => {
    if (!dialogHorario || !selectedDisciplina) return
    const session = getSession()
    if (!session) return

    setSaving(true)
    await supabase.from('horarios').insert({
      disciplina_id: selectedDisciplina,
      dia_semana: dialogHorario.dia,
      hora_inicio: dialogHorario.hora,
      hora_fim: horaFim,
      user_id: session.userId,
    })
    setSaving(false)
    setDialogHorario(null)
    setSelectedDisciplina('')
    onUpdate()
  }

  const handleRemoverHorario = async (horarioId: string) => {
    await supabase.from('horarios').delete().eq('id', horarioId)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      {/* Painel de disciplinas para arrastar */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3 -mx-4 px-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-foreground">Minhas Disciplinas</p>
          <Badge variant="secondary">{disciplinas.filter(d => !d.user_id || d.user_id === user?.userId).length}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {disciplinas.filter(d => !d.user_id || d.user_id === user?.userId).map(d => (
            <div
              key={d.id}
              draggable
              onDragStart={() => handleDragStart(d.id)}
              onDragEnd={() => { setDragging(null); dragRef.current = null }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing select-none transition-all hover:scale-105"
              style={{
                backgroundColor: d.cor + '20',
                color: d.cor,
                border: `1.5px solid ${d.cor}`,
                opacity: dragging === d.id ? 0.5 : 1,
              }}
            >
              <GripVertical className="h-3 w-3 opacity-50" />
              <span className="font-semibold">{d.codigo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grade com scroll horizontal */}
      <div className="border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto bg-background">
          <table className="border-collapse min-w-max w-full">
            <thead>
              <tr className="bg-muted">
                <th className="p-2.5 text-xs font-bold text-muted-foreground text-center w-14 border-b border-border/50">
                  Horário
                </th>
                {DIAS.map((d, i) => (
                  <th key={i} className="p-2.5 text-xs font-bold text-center border-l border-b border-border/50 w-[120px]">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horasExibidas.map((hora, idx) => {
                // Calcula quais colunas já estão cobertas por rowSpan de linhas anteriores
                const celulasCobertasPorRowspan = DIAS_NUM.filter(dia => isCelulaOcupada(dia, hora))

                return (
                  <tr
                    key={hora}
                    className={idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-muted/20'}
                  >
                    {/* Coluna da hora */}
                    <td className="p-2 text-xs font-semibold text-muted-foreground text-right pr-3 leading-tight bg-muted/40 border-t border-border/50 whitespace-nowrap">
                      {hora}
                    </td>

                    {/* Colunas dos dias — pula as que estão cobertas por rowSpan */}
                    {DIAS_NUM.map((dia) => {
                      // Esta célula está coberta por um rowSpan de cima? Não renderiza o <td>
                      if (celulasCobertasPorRowspan.includes(dia)) return null

                      const horario = getHorarioInicio(dia, hora)
                      const disc = horario ? disciplinas.find(d => d.id === horario.disciplina_id) : null
                      const rowSpan = horario ? calcRowSpan(horario) : 1
                      const isHover = hoverCell?.dia === dia && hoverCell?.hora === hora
                      const dragDisc = dragging ? disciplinas.find(d => d.id === dragging) : null

                      return (
                        <td
                          key={dia}
                          rowSpan={rowSpan}
                          className="border-l border-t border-border/50 relative transition-all p-0"
                          style={{
                            minWidth: 120,
                            height: `${rowSpan * 48}px`,
                            backgroundColor: isHover && !horario && dragDisc ? dragDisc.cor + '15' : undefined,
                          }}
                          onDragOver={(e) => !horario && handleDragOver(e, dia, hora)}
                          onDragLeave={() => setHoverCell(null)}
                          onDrop={(e) => !horario && handleDrop(e, dia, hora)}
                        >
                          {disc && horario && (
                            <div
                              className="absolute inset-1 rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-0.5 group shadow-sm hover:shadow-md transition-all cursor-pointer"
                              style={{
                                backgroundColor: disc.cor + '25',
                                border: `2px solid ${disc.cor}`,
                                color: disc.cor,
                              }}
                            >
                              <div className="font-bold">{disc.codigo}</div>
                              <div className="text-[10px] opacity-75">
                                {horario.hora_inicio} - {horario.hora_fim}
                              </div>
                              <button
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white rounded-full p-1 shadow-md hover:bg-destructive/90"
                                onClick={() => handleRemoverHorario(horario.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          {!horario && isHover && dragDisc && (
                            <div className="absolute inset-1 rounded-md border-2 border-dashed border-primary/60 flex items-center justify-center bg-primary/5">
                              <Plus className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Botão expandir/recolher noturno */}
              <tr className="bg-muted/40 border-t border-border/50">
                <td colSpan={6} className="p-1.5">
                  <button
                    onClick={() => setExpandNoturno(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    {expandNoturno
                      ? <><ChevronDown className="h-3.5 w-3.5 rotate-180" /> Ocultar horários noturnos (após 18h)</>
                      : <><ChevronDown className="h-3.5 w-3.5" /> Mostrar horários noturnos (18h - 22h)</>
                    }
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog confirmar horário */}
      <Dialog open={!!dialogHorario} onOpenChange={open => { if (!open) setDialogHorario(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar à Grade</DialogTitle>
            <DialogDescription>
              {dialogHorario && `${DIAS[DIAS_NUM.indexOf(dialogHorario.dia)]} - ${dialogHorario.hora}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Disciplina</label>
              <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.cor }} />
                      {d.codigo} - {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Hora de Fim</label>
              <Select value={horaFim} onValueChange={setHoraFim}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODAS_HORAS.filter(h => h > (dialogHorario?.hora ?? '')).map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogHorario(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSalvarHorario} disabled={saving || !selectedDisciplina}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

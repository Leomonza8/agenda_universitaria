'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Disciplina, Horario } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_NUM = [1, 2, 3, 4, 5, 6]
const HORAS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00',
]

interface Props {
  disciplinas: Disciplina[]
  horarios: Horario[]
  onUpdate: () => void
}

export function EditorGrade({ disciplinas, horarios, onUpdate }: Props) {
  const supabase = createClient()
  const [dragging, setDragging] = useState<string | null>(null) // disciplina id
  const [hoverCell, setHoverCell] = useState<{ dia: number; hora: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogHorario, setDialogHorario] = useState<{ dia: number; hora: string } | null>(null)
  const [selectedDisciplina, setSelectedDisciplina] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const dragRef = useRef<string | null>(null)

  const getHorarioNaSlot = (dia: number, hora: string) => {
    return horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora)
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

    // Verifica se já tem aula nesse slot
    const existente = getHorarioNaSlot(dia, hora)
    if (existente) return

    setHoverCell(null)
    setDragging(null)
    dragRef.current = null

    // Abre dialog para definir hora de fim
    setSelectedDisciplina(disciplinaId)
    const idx = HORAS.indexOf(hora)
    setHoraFim(HORAS[Math.min(idx + 2, HORAS.length - 1)])
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
      <div>
        <p className="text-sm text-muted-foreground mb-2 font-medium">Arraste para um horario na grade:</p>
        <div className="flex flex-wrap gap-2">
          {disciplinas.map(d => (
            <div
              key={d.id}
              draggable
              onDragStart={() => handleDragStart(d.id)}
              onDragEnd={() => { setDragging(null); dragRef.current = null }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-grab active:cursor-grabbing select-none transition-opacity"
              style={{
                backgroundColor: d.cor + '25',
                color: d.cor,
                border: `1px solid ${d.cor}50`,
                opacity: dragging === d.id ? 0.5 : 1,
              }}
            >
              <GripVertical className="h-3 w-3 opacity-60" />
              {d.codigo}
            </div>
          ))}
          {disciplinas.length === 0 && (
            <p className="text-sm text-muted-foreground">Crie disciplinas primeiro nas configuracoes.</p>
          )}
        </div>
      </div>

      {/* Grade */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[600px]">
          {/* Header dias */}
          <div className="grid bg-muted/50" style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
            <div className="p-2 text-xs text-muted-foreground text-center">Hora</div>
            {DIAS.map((d, i) => (
              <div key={i} className="p-2 text-xs font-semibold text-center border-l border-border">
                {d}
              </div>
            ))}
          </div>

          {/* Linhas de horário */}
          {HORAS.map((hora) => (
            <div
              key={hora}
              className="grid border-t border-border"
              style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}
            >
              <div className="p-1.5 text-xs text-muted-foreground text-right pr-3 leading-tight self-center">
                {hora}
              </div>
              {DIAS_NUM.map((dia) => {
                const horario = getHorarioNaSlot(dia, hora)
                const disc = horario ? disciplinas.find(d => d.id === horario.disciplina_id) : null
                const isHover = hoverCell?.dia === dia && hoverCell?.hora === hora

                return (
                  <div
                    key={dia}
                    className="border-l border-border min-h-[32px] relative transition-colors"
                    style={{
                      backgroundColor: isHover && !horario ? (dragging ? disciplinas.find(d => d.id === dragging)?.cor + '20' : undefined) : undefined,
                    }}
                    onDragOver={(e) => handleDragOver(e, dia, hora)}
                    onDragLeave={() => setHoverCell(null)}
                    onDrop={(e) => handleDrop(e, dia, hora)}
                  >
                    {disc && horario && (
                      <div
                        className="absolute inset-0.5 rounded text-xs flex items-center justify-between px-1.5 group"
                        style={{ backgroundColor: disc.cor + '25', borderLeft: `3px solid ${disc.cor}` }}
                      >
                        <span className="font-medium truncate" style={{ color: disc.cor }}>
                          {disc.codigo}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoverHorario(horario.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {!horario && isHover && dragging && (
                      <div className="absolute inset-0.5 rounded border-2 border-dashed border-primary/50 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-primary/50" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog confirmar horário */}
      <Dialog open={!!dialogHorario} onOpenChange={open => { if (!open) setDialogHorario(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar horario</DialogTitle>
            <DialogDescription>
              {dialogHorario && `${DIAS[DIAS_NUM.indexOf(dialogHorario.dia)]} - inicio: ${dialogHorario.hora}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Disciplina</label>
              <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.codigo} - {d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Hora de fim</label>
              <Select value={horaFim} onValueChange={setHoraFim}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORAS.filter(h => h > (dialogHorario?.hora ?? '')).map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setDialogHorario(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSalvarHorario} disabled={saving || !selectedDisciplina}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

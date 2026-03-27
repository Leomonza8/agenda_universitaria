'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Horario } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const HORAS_DIA = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]
const HORAS_NOTURNO = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
const TODAS_HORAS = [...HORAS_DIA, ...HORAS_NOTURNO]
const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const DIAS_NUM = [1, 2, 3, 4, 5]

interface GradeHorariosProps {
  horarios: Horario[]
  onSelectDisciplina: (disciplinaId: string) => void
  onUpdate?: () => void
}

export function GradeHorarios({ horarios, onSelectDisciplina, onUpdate }: GradeHorariosProps) {
  const supabase = createClient()
  const [expandido, setExpandido] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Horario | null>(null)
  const [removendo, setRemovendo] = useState(false)

  const handleRemover = async () => {
    if (!confirmDelete) return
    setRemovendo(true)
    await supabase.from('horarios').delete().eq('id', confirmDelete.id)
    setConfirmDelete(null)
    setRemovendo(false)
    onUpdate?.()
  }

  const temHorarioNoturno = useMemo(
    () => horarios.some(h => h.hora_inicio >= '18:00'),
    [horarios]
  )

  const horasExibidas = expandido ? TODAS_HORAS : HORAS_DIA

  // Retorna o horário cuja hora_inicio coincide com esta célula (célula raiz do bloco)
  const getHorarioInicio = (dia: number, hora: string) =>
    horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora)

  // Verifica se esta célula está coberta por um rowSpan de uma linha anterior
  const isCelulaOcupada = (dia: number, hora: string): boolean =>
    horarios.some(h => {
      if (h.dia_semana !== dia || h.hora_inicio === hora || !h.hora_fim) return false
      return hora > h.hora_inicio && hora < h.hora_fim
    })

  // Calcula quantas linhas o bloco deve ocupar
  const calcRowSpan = (horario: Horario): number => {
    if (!horario.hora_fim) return 1
    const idxInicio = TODAS_HORAS.indexOf(horario.hora_inicio)
    const idxFim = TODAS_HORAS.indexOf(horario.hora_fim)
    if (idxInicio < 0 || idxFim <= idxInicio) return 1
    return idxFim - idxInicio
  }

  if (horarios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Acesse "Minha Grade" e arraste disciplinas para criar seu horário.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="border-collapse text-xs w-full min-w-max">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-center font-semibold text-muted-foreground w-14 border-b border-border">
                Hora
              </th>
              {DIAS_NUM.map((_, i) => (
                <th key={i} className="p-2 text-center font-semibold border-b border-l border-border w-[100px]">
                  {DIAS_CURTOS[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasExibidas.map((hora, idx) => {
              const celulasCobertasPorRowspan = DIAS_NUM.filter(dia => isCelulaOcupada(dia, hora))

              return (
                <tr
                  key={hora}
                  className={cn(idx % 2 === 0 ? 'bg-background' : 'bg-muted/20')}
                >
                  <td className="p-1.5 text-center font-mono text-muted-foreground border-r border-border whitespace-nowrap bg-muted/40">
                    {hora}
                  </td>
                  {DIAS_NUM.map(dia => {
                    if (celulasCobertasPorRowspan.includes(dia)) return null

                    const horario = getHorarioInicio(dia, hora)
                    const rowSpan = horario ? calcRowSpan(horario) : 1

                    return (
                      <td
                        key={`${dia}-${hora}`}
                        rowSpan={rowSpan}
                        className={cn(
                          'border-l border-t border-border p-1 text-center transition-colors relative group/cell',
                          horario && 'cursor-pointer hover:opacity-90'
                        )}
                        style={{
                          minHeight: `${rowSpan * 36}px`,
                          height: `${rowSpan * 36}px`,
                          ...(horario?.disciplina ? { backgroundColor: horario.disciplina.cor + '18' } : {}),
                        }}
                        onClick={() => horario && onSelectDisciplina(horario.disciplina_id)}
                      >
                        {horario?.disciplina && (
                          <div className="flex flex-col items-center justify-center h-full gap-0.5 px-0.5">
                            {horario.disciplina.nome && (
                              <span
                                className="text-[9px] leading-tight font-medium opacity-70 text-center line-clamp-2"
                                style={{ color: horario.disciplina.cor }}
                              >
                                {horario.disciplina.nome}
                              </span>
                            )}
                            <span
                              className="font-bold text-[11px] leading-none"
                              style={{ color: horario.disciplina.cor }}
                            >
                              {horario.disciplina.codigo}
                            </span>
                            {rowSpan > 1 && (
                              <span
                                className="text-[8px] opacity-60 mt-0.5"
                                style={{ color: horario.disciplina.cor }}
                              >
                                {horario.hora_inicio}–{horario.hora_fim}
                              </span>
                            )}
                            {/* Botão remover */}
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDelete(horario) }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded border border-destructive/60 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-all sm:opacity-0 sm:group-hover/cell:opacity-100"
                              title="Remover horário"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {temHorarioNoturno && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground gap-1"
          onClick={() => setExpandido(v => !v)}
        >
          {expandido ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Ocultar horários noturnos</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Ver horários noturnos</>
          )}
        </Button>
      )}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover horário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.disciplina?.nome || confirmDelete?.disciplina?.codigo}
              </span>{' '}
              de {confirmDelete?.hora_inicio}
              {confirmDelete?.hora_fim ? ` – ${confirmDelete.hora_fim}` : ''}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemover}
              disabled={removendo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removendo ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

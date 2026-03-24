'use client'

import { useState } from 'react'
import { Horario } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HORA_LIMITE = '18:00'
const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']

// Gera todos os slots de meia hora entre dois horários (sem incluir o fim)
function gerarSlots(inicio: string, fim: string): string[] {
  const slots: string[] = []
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fim.split(':').map(Number)
  let totalMin = hi * 60 + mi
  const fimMin = hf * 60 + mf
  while (totalMin < fimMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
    const m = String(totalMin % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    totalMin += 30
  }
  return slots
}

interface GradeHorariosProps {
  horarios: Horario[]
  onSelectDisciplina: (disciplinaId: string) => void
}

export function GradeHorarios({ horarios, onSelectDisciplina }: GradeHorariosProps) {
  const diasUteis = [1, 2, 3, 4, 5]
  const [expandido, setExpandido] = useState(false)

  // Gera todos os slots ocupados por qualquer horário
  const slotsOcupados = new Set<string>()
  horarios.forEach(h => {
    if (h.hora_fim) {
      gerarSlots(h.hora_inicio, h.hora_fim).forEach(s => slotsOcupados.add(s))
    } else {
      slotsOcupados.add(h.hora_inicio)
    }
  })
  const todasHoras = [...slotsOcupados].sort()
  const temHorarioNoturno = todasHoras.some(h => h >= HORA_LIMITE)
  const horasExibidas = expandido ? todasHoras : todasHoras.filter(h => h < HORA_LIMITE)

  // Retorna o horário que ocupa este slot (inclui slots intermediários)
  const getAulaPorDiaHora = (dia: number, hora: string) =>
    horarios.find(h =>
      h.dia_semana === dia &&
      h.hora_inicio <= hora &&
      (h.hora_fim ? h.hora_fim > hora : h.hora_inicio === hora)
    )

  const isInicio = (horario: Horario, hora: string) => horario.hora_inicio === hora

  if (todasHoras.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Acesse "Minha Grade" e arraste disciplinas para criar seu horário.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left font-semibold text-muted-foreground w-14 border-b border-border">
                Hora
              </th>
              {diasUteis.map((dia, i) => (
                <th key={dia} className="p-2 text-center font-semibold border-b border-l border-border">
                  {DIAS_CURTOS[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasExibidas.map((hora, idx) => (
              <tr
                key={hora}
                className={cn(
                  'transition-colors',
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                <td className="p-1.5 text-center font-mono text-muted-foreground border-r border-border whitespace-nowrap text-[11px]">
                  {hora}
                </td>
                {diasUteis.map(dia => {
                  const aula = getAulaPorDiaHora(dia, hora)
                  const inicio = aula ? isInicio(aula, hora) : false
                  return (
                    <td
                      key={`${dia}-${hora}`}
                      className={cn(
                        'border-l border-border p-1 text-center h-9 transition-colors relative',
                        aula && inicio && 'cursor-pointer hover:opacity-80'
                      )}
                      style={aula ? { backgroundColor: aula.disciplina?.cor + '18' } : undefined}
                      onClick={() => aula && inicio && onSelectDisciplina(aula.disciplina_id)}
                    >
                      {/* Linha divisória suave nos slots intermediários */}
                      {aula && !inicio && (
                        <div
                          className="absolute inset-x-2 top-0 h-px"
                          style={{ backgroundColor: aula.disciplina?.cor + '40' }}
                        />
                      )}
                      {/* Código da disciplina apenas no slot de início */}
                      {aula && inicio && (
                        <span
                          className="font-semibold text-[11px] leading-none"
                          style={{ color: aula.disciplina?.cor }}
                        >
                          {aula.disciplina?.codigo}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
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
    </div>
  )
}

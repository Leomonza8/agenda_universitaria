'use client'

import { Horario, DIAS_SEMANA } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GradeHorariosProps {
  horarios: Horario[]
  onSelectDisciplina: (disciplinaId: string) => void
}

export function GradeHorarios({ horarios, onSelectDisciplina }: GradeHorariosProps) {
  const diasUteis = [1, 2, 3, 4, 5] // Segunda a Sexta (1=seg, 2=ter, etc)
  
  const horasUnicas = [...new Set(horarios.map(h => h.hora_inicio))].sort()
  
  const getAulaPorDiaHora = (dia: number, hora: string) => {
    return horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border bg-muted p-2 text-left font-medium">Horário</th>
            {diasUteis.map(dia => (
              <th key={dia} className="border border-border bg-muted p-2 text-center font-medium">
                {DIAS_SEMANA[dia]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horasUnicas.map(hora => (
            <tr key={hora}>
              <td className="border border-border bg-muted/50 p-2 text-center font-medium whitespace-nowrap">
                {hora}
              </td>
              {diasUteis.map(dia => {
                const aula = getAulaPorDiaHora(dia, hora)
                return (
                  <td
                    key={`${dia}-${hora}`}
                    className={cn(
                      'border border-border p-2 text-center transition-colors',
                      aula && 'cursor-pointer hover:opacity-80'
                    )}
                    style={aula ? { backgroundColor: aula.disciplina?.cor + '20' } : undefined}
                    onClick={() => aula && onSelectDisciplina(aula.disciplina_id)}
                  >
                    {aula && (
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="font-medium text-xs leading-tight"
                          style={{ color: aula.disciplina?.cor }}
                        >
                          {aula.disciplina?.codigo}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                          {aula.local}
                        </span>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

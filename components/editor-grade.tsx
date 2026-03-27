'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Disciplina, Horario } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Plus, ChevronDown, X, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const DIAS_NUM = [1, 2, 3, 4, 5]
const HORAS_DIA = [
  '08:00', '08:30', '09:00', '09:30',
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
  const [exportando, setExportando] = useState(false)
  const [dialogHorario, setDialogHorario] = useState<{ dia: number; hora: string } | null>(null)
  const [selectedDisciplina, setSelectedDisciplina] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [expandNoturno, setExpandNoturno] = useState(false)
  const dragRef = useRef<string | null>(null)
  const gradeRef = useRef<HTMLDivElement>(null)

  const handleExportarPDF = async () => {
    console.log('[v0] Iniciando exportacao PDF')
    console.log('[v0] gradeRef.current:', gradeRef.current)
    
    if (!gradeRef.current) {
      console.log('[v0] Ref nao encontrada, abortando')
      setExportando(false)
      return
    }
    
    setExportando(true)
    
    try {
      console.log('[v0] Importando bibliotecas...')
      const html2canvasModule = await import('html2canvas')
      const jspdfModule = await import('jspdf')
      
      const html2canvas = html2canvasModule.default
      const jsPDF = jspdfModule.default
      
      console.log('[v0] Bibliotecas carregadas, gerando canvas...')

      const element = gradeRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        allowTaint: true,
      })

      console.log('[v0] Canvas gerado:', canvas.width, 'x', canvas.height)

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      console.log('[v0] Criando PDF...')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      pdf.setFontSize(14)
      pdf.setTextColor(30, 30, 30)
      pdf.text('Grade de Horarios', 10, 12)
      pdf.setFontSize(9)
      pdf.setTextColor(120, 120, 120)
      pdf.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')}`, 10, 18)

      const marginTop = 24
      const maxHeight = 185
      const finalHeight = Math.min(imgHeight, maxHeight)

      pdf.addImage(imgData, 'PNG', 8, marginTop, imgWidth, finalHeight)
      
      console.log('[v0] Salvando PDF...')
      pdf.save('grade-horarios.pdf')
      console.log('[v0] PDF salvo com sucesso!')
      
    } catch (err) {
      console.error('[v0] Erro ao exportar PDF:', err)
      alert('Erro ao exportar PDF. Verifique o console para mais detalhes.')
    }
    
    setExportando(false)
  }

  const horasExibidas = expandNoturno ? TODAS_HORAS : HORAS_DIA

  const getHorarioInicio = (dia: number, hora: string) =>
    horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora)

  const isCelulaOcupada = (dia: number, hora: string): boolean =>
    horarios.some(h => {
      if (h.dia_semana !== dia) return false
      if (h.hora_inicio === hora) return false
      if (!h.hora_fim) return false
      return hora > h.hora_inicio && hora < h.hora_fim
    })

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
    const existente = getHorarioInicio(dia, hora) || isCelulaOcupada(dia, hora)
    if (existente) return
    setHoverCell(null)
    setDragging(null)
    dragRef.current = null
    setSelectedDisciplina(disciplinaId)
    const idx = TODAS_HORAS.indexOf(hora)
    setHoraFim(TODAS_HORAS[Math.min(idx + 2, TODAS_HORAS.length - 1)])
    setDialogHorario({ dia, hora })
  }

  // Abre o dialog ao clicar numa célula vazia (mobile)
  const handleCelulaClick = (dia: number, hora: string) => {
    if (getHorarioInicio(dia, hora) || isCelulaOcupada(dia, hora)) return
    setSelectedDisciplina(minhasDisciplinas[0]?.id ?? '')
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

  const minhasDisciplinas = disciplinas.filter(d => !d.user_id || d.user_id === user?.userId)

  return (
    <div className="space-y-4">
      {/* Painel de disciplinas */}
      <div className="bg-card border border-border/60 rounded-lg p-3 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-2.5">
          <span className="hidden sm:inline">Arraste para a grade ou toque no </span>
          <span className="sm:hidden">Toque no </span>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-border mx-0.5 align-middle"><Plus className="h-2.5 w-2.5" /></span>
          <span className="sm:hidden"> na grade para adicionar</span>
          <span className="hidden sm:inline"> de cada horario</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {minhasDisciplinas.map(d => (
            <div
              key={d.id}
              draggable
              onDragStart={() => handleDragStart(d.id)}
              onDragEnd={() => { setDragging(null); dragRef.current = null }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-sm border"
              style={{
                backgroundColor: d.cor + '10',
                borderColor: d.cor + '40',
                color: d.cor,
                opacity: dragging === d.id ? 0.4 : 1,
              }}
            >
              <GripVertical className="h-3 w-3 opacity-30 hidden sm:block" />
              {d.codigo || d.nome}
            </div>
          ))}
          {minhasDisciplinas.length === 0 && (
            <p className="text-xs text-muted-foreground">Crie disciplinas no painel ao lado</p>
          )}
        </div>
      </div>

      {/* Grade */}
      <div className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Grade de Horarios</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleExportarPDF}
            disabled={exportando || horarios.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            {exportando ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
        <div ref={gradeRef} className="overflow-x-auto">
          <table className="border-collapse w-full" style={{ minWidth: 380 }}>
            <thead>
              <tr className="bg-muted/60">
                <th className="p-2 text-xs font-semibold text-muted-foreground text-center border-b border-border/40 w-14">
                  Hora
                </th>
                {DIAS.map((d, i) => (
                  <th key={i} className="p-2 text-xs font-semibold text-center border-l border-b border-border/40">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horasExibidas.map((hora, idx) => {
                const celulasCobertasPorRowspan = DIAS_NUM.filter(dia => isCelulaOcupada(dia, hora))
                return (
                  <tr key={hora} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                    <td className="p-1.5 text-[10px] font-mono text-muted-foreground text-center bg-muted/30 border-t border-border/40 whitespace-nowrap">
                      {hora}
                    </td>
                    {DIAS_NUM.map(dia => {
                      if (celulasCobertasPorRowspan.includes(dia)) return null

                      const horario = getHorarioInicio(dia, hora)
                      const disc = horario ? disciplinas.find(d => d.id === horario.disciplina_id) : null
                      const rowSpan = horario ? calcRowSpan(horario) : 1
                      const isHover = hoverCell?.dia === dia && hoverCell?.hora === hora
                      const dragDisc = dragging ? disciplinas.find(d => d.id === dragging) : null
                      const vazia = !horario

                      return (
                        <td
                          key={dia}
                          rowSpan={rowSpan}
                          className="border-l border-t border-border/40 relative p-0.5 group/cell"
                          style={{
                            height: `${rowSpan * 40}px`,
                            backgroundColor: isHover && vazia && dragDisc ? dragDisc.cor + '12' : undefined,
                          }}
                          onDragOver={e => vazia && handleDragOver(e, dia, hora)}
                          onDragLeave={() => setHoverCell(null)}
                          onDrop={e => vazia && handleDrop(e, dia, hora)}
                        >
                          {/* Célula preenchida */}
                          {disc && horario && (
                            <div
                              className="absolute inset-0.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all cursor-default group/bloco"
                              style={{
                                backgroundColor: disc.cor + '15',
                                borderLeft: `3px solid ${disc.cor}`,
                                color: disc.cor,
                              }}
                            >
                              {disc.nome && (
                                <span className="text-[9px] leading-tight font-medium opacity-70 text-center px-0.5 line-clamp-2">
                                  {disc.nome}
                                </span>
                              )}
                              <span className="font-bold text-[11px] leading-none text-center px-1 truncate w-full">
                                {disc.codigo}
                              </span>
                              {rowSpan > 1 && (
                                <span className="text-[8px] opacity-60 font-medium mt-0.5">
                                  {horario.hora_inicio}–{horario.hora_fim}
                                </span>
                              )}
                              <button
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover/bloco:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive text-white rounded p-0.5"
                                onClick={() => handleRemoverHorario(horario.id)}
                                title="Remover"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}

                          {/* Célula vazia — hover via drag (desktop) */}
                          {vazia && isHover && dragDisc && (
                            <div className="absolute inset-0.5 rounded border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5 pointer-events-none">
                              <Plus className="h-3.5 w-3.5 text-primary/60" />
                            </div>
                          )}

                          {/* Célula vazia — botao + visivel no hover (desktop) e sempre no mobile */}
                          {vazia && !isHover && (
                            <button
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100 focus:opacity-100 transition-opacity"
                              style={{ touchAction: 'manipulation' }}
                              onClick={() => handleCelulaClick(dia, hora)}
                              aria-label={`Adicionar disciplina ${DIAS[DIAS_NUM.indexOf(dia)]} ${hora}`}
                            >
                              <span className="flex items-center justify-center w-5 h-5 rounded bg-muted/70 border border-border/60">
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              <tr className="bg-muted/30 border-t border-border/40">
                <td colSpan={6} className="p-2">
                  <button
                    onClick={() => setExpandNoturno(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-0.5"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandNoturno ? 'rotate-180' : ''}`} />
                    {expandNoturno ? 'Ocultar horarios noturnos' : 'Mostrar horarios noturnos (18h–22h)'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog adicionar horario */}
      <Dialog open={!!dialogHorario} onOpenChange={open => { if (!open) setDialogHorario(null) }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Adicionar Horario</DialogTitle>
            <DialogDescription className="text-sm">
              {dialogHorario && `${DIAS[DIAS_NUM.indexOf(dialogHorario.dia)]}, ${dialogHorario.hora}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Disciplina</label>
              <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.cor }} />
                        {d.codigo || d.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Termina em</label>
              <Select value={horaFim} onValueChange={setHoraFim}>
                <SelectTrigger className="h-9">
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
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDialogHorario(null)}>
                Cancelar
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSalvarHorario} disabled={saving || !selectedDisciplina}>
                {saving ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

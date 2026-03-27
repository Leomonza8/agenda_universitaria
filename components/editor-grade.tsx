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

  const handleExportarPDF = async () => {
    setExportando(true)
    
    try {
      const jspdfModule = await import('jspdf')
      const jsPDF = jspdfModule.default
      
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      
      // Titulo
      pdf.setFontSize(16)
      pdf.setTextColor(30, 30, 30)
      pdf.text('Grade de Horarios', 14, 15)
      pdf.setFontSize(9)
      pdf.setTextColor(120, 120, 120)
      pdf.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 21)
      
      // Config da tabela
      const startY = 28
      const startX = 14
      const colWidth = 52
      const rowHeight = 8
      const horaColWidth = 18
      const horas = expandNoturno ? TODAS_HORAS : HORAS_DIA
      
      // Mapa para rastrear celulas ja desenhadas (para blocos multi-linha)
      const celulasDesenhadas = new Set<string>()
      
      // Header - dias
      pdf.setFillColor(240, 240, 240)
      pdf.rect(startX, startY, horaColWidth + (colWidth * 5), rowHeight, 'F')
      pdf.setFontSize(9)
      pdf.setTextColor(50, 50, 50)
      pdf.text('Hora', startX + 3, startY + 5.5)
      DIAS.forEach((dia, i) => {
        pdf.text(dia, startX + horaColWidth + (i * colWidth) + colWidth / 2, startY + 5.5, { align: 'center' })
      })
      
      // Primeiro desenha bordas e fundo
      const tableHeight = rowHeight + (horas.length * rowHeight)
      
      // Fundo alternado das linhas
      horas.forEach((hora, rowIdx) => {
        const y = startY + rowHeight + (rowIdx * rowHeight)
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(250, 250, 250)
          pdf.rect(startX, y, horaColWidth + (colWidth * 5), rowHeight, 'F')
        }
      })
      
      // Bordas da tabela
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.rect(startX, startY, horaColWidth + (colWidth * 5), tableHeight)
      
      // Linhas horizontais
      for (let i = 0; i <= horas.length; i++) {
        const y = startY + rowHeight + (i * rowHeight)
        pdf.line(startX, y, startX + horaColWidth + (colWidth * 5), y)
      }
      
      // Linhas verticais
      pdf.line(startX + horaColWidth, startY, startX + horaColWidth, startY + tableHeight)
      for (let i = 1; i <= 5; i++) {
        const x = startX + horaColWidth + (i * colWidth)
        pdf.line(x, startY, x, startY + tableHeight)
      }
      
      // Coluna das horas
      horas.forEach((hora, rowIdx) => {
        const y = startY + rowHeight + (rowIdx * rowHeight)
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text(hora, startX + 3, y + 5.5)
      })
      
      // Desenhar blocos de disciplinas
      horarios.forEach(horario => {
        const disc = disciplinas.find(d => d.id === horario.disciplina_id)
        if (!disc) return
        
        const colIdx = DIAS_NUM.indexOf(horario.dia_semana)
        if (colIdx < 0) return
        
        const rowIdxInicio = horas.indexOf(horario.hora_inicio)
        if (rowIdxInicio < 0) return
        
        // Calcular fim
        let rowIdxFim = rowIdxInicio + 1
        if (horario.hora_fim) {
          const fimIdx = horas.indexOf(horario.hora_fim)
          if (fimIdx > rowIdxInicio) {
            rowIdxFim = fimIdx
          }
        }
        
        const chave = `${horario.dia_semana}-${horario.hora_inicio}`
        if (celulasDesenhadas.has(chave)) return
        celulasDesenhadas.add(chave)
        
        const x = startX + horaColWidth + (colIdx * colWidth)
        const y = startY + rowHeight + (rowIdxInicio * rowHeight)
        const blocoHeight = (rowIdxFim - rowIdxInicio) * rowHeight
        
        // Cor da disciplina
        const cor = disc.cor || '#3b82f6'
        const r = parseInt(cor.slice(1, 3), 16)
        const g = parseInt(cor.slice(3, 5), 16)
        const b = parseInt(cor.slice(5, 7), 16)
        
        // Fundo colorido claro
        pdf.setFillColor(r, g, b)
        pdf.setGState(new jsPDF.GState({ opacity: 0.2 }))
        pdf.rect(x + 1, y + 0.5, colWidth - 2, blocoHeight - 1, 'F')
        pdf.setGState(new jsPDF.GState({ opacity: 1 }))
        
        // Borda esquerda colorida
        pdf.setFillColor(r, g, b)
        pdf.rect(x + 1, y + 0.5, 2, blocoHeight - 1, 'F')
        
        // Texto - usar cor escura para contraste
        pdf.setTextColor(40, 40, 40)
        const textoY = y + (blocoHeight / 2)
        
        if (disc.nome) {
          pdf.setFontSize(6)
          const nomeExibir = disc.nome.length > 22 ? disc.nome.substring(0, 20) + '...' : disc.nome
          pdf.text(nomeExibir, x + colWidth / 2 + 1, textoY - 1, { align: 'center' })
        }
        
        pdf.setFontSize(8)
        pdf.setFont(undefined, 'bold')
        pdf.text(disc.codigo || disc.nome || '', x + colWidth / 2 + 1, textoY + 3, { align: 'center' })
        pdf.setFont(undefined, 'normal')
        
        // Horario
        if (blocoHeight > 12) {
          pdf.setFontSize(5)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`${horario.hora_inicio} - ${horario.hora_fim || ''}`, x + colWidth / 2 + 1, textoY + 6.5, { align: 'center' })
        }
      })
      
      pdf.save('grade-horarios.pdf')
      
    } catch (err) {
      console.error('[v0] Erro ao exportar PDF:', err)
      alert('Erro ao exportar PDF')
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
        <div className="overflow-x-auto">
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

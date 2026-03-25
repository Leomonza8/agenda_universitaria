'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Disciplina, Horario, DIAS_SEMANA } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Pencil, Clock } from 'lucide-react'

const CORES = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
]

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDisciplina, setEditDisciplina] = useState<Disciplina | null>(null)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [professor, setProfessor] = useState('')
  const [local, setLocal] = useState('')
  const [cor, setCor] = useState(CORES[0])
  const [saving, setSaving] = useState(false)

  // Horario form
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false)
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null)
  const [diaSemana, setDiaSemana] = useState('1')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFim, setHoraFim] = useState('10:00')

  const router = useRouter()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [disciplinasRes, horariosRes] = await Promise.all([
      supabase.from('disciplinas').select('*').order('codigo'),
      supabase.from('horarios').select('*, disciplina:disciplinas(*)').order('dia_semana'),
    ])
    if (disciplinasRes.data) setDisciplinas(disciplinasRes.data)
    if (horariosRes.data) setHorarios(horariosRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openNewDisciplina = () => {
    setEditDisciplina(null)
    setCodigo('')
    setNome('')
    setProfessor('')
    setLocal('')
    setCor(CORES[Math.floor(Math.random() * CORES.length)])
    setDialogOpen(true)
  }

  const openEditDisciplina = (d: Disciplina) => {
    setEditDisciplina(d)
    setCodigo(d.codigo)
    setNome(d.nome)
    setProfessor(d.professor)
    setLocal(d.local || '')
    setCor(d.cor)
    setDialogOpen(true)
  }

  const handleSaveDisciplina = async () => {
    if (!codigo.trim() || !nome.trim()) return
    setSaving(true)

    const session = getSession()
    if (!session) {
      setSaving(false)
      return
    }

    if (editDisciplina) {
      await supabase.from('disciplinas').update({
        codigo: codigo.trim(),
        nome: nome.trim(),
        professor: professor.trim(),
        local: local.trim(),
        cor,
      }).eq('id', editDisciplina.id)
    } else {
      await supabase.from('disciplinas').insert({
        codigo: codigo.trim(),
        nome: nome.trim(),
        professor: professor.trim(),
        local: local.trim(),
        cor,
        user_id: session.userId,
      })
    }

    setSaving(false)
    setDialogOpen(false)
    fetchData()
  }

  const handleDeleteDisciplina = async (id: string) => {
    if (!confirm('Tem certeza? Isso vai apagar todos os horários, tarefas e anotações dessa disciplina.')) return
    await supabase.from('disciplinas').delete().eq('id', id)
    fetchData()
  }

  const openAddHorario = (d: Disciplina) => {
    setSelectedDisciplina(d)
    setDiaSemana('1')
    setHoraInicio('08:00')
    setHoraFim('10:00')
    setHorarioDialogOpen(true)
  }

  const handleAddHorario = async () => {
    if (!selectedDisciplina) return
    setSaving(true)

    const session = getSession()
    if (!session) {
      setSaving(false)
      return
    }

    await supabase.from('horarios').insert({
      disciplina_id: selectedDisciplina.id,
      dia_semana: parseInt(diaSemana),
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      user_id: session.userId,
    })

    setSaving(false)
    setHorarioDialogOpen(false)
    fetchData()
  }

  const handleDeleteHorario = async (id: string) => {
    await supabase.from('horarios').delete().eq('id', id)
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Minhas Disciplinas</h1>
              <p className="text-xs text-muted-foreground">Configure suas disciplinas e horarios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <Button onClick={openNewDisciplina}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>

        {disciplinas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma disciplina cadastrada</p>
              <Button onClick={openNewDisciplina}>Adicionar primeira disciplina</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disciplinas.map(d => {
              const horariosDisc = horarios.filter(h => h.disciplina_id === d.id)
              return (
                <Card key={d.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.cor }} />
                        <div>
                          <CardTitle className="text-base">{d.codigo} - {d.nome}</CardTitle>
                          <p className="text-sm text-muted-foreground">{d.professor}</p>
                          {d.local && <p className="text-xs text-muted-foreground">{d.local}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAddHorario(d)}>
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDisciplina(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDisciplina(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {horariosDisc.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem horarios cadastrados</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {horariosDisc.map(h => (
                          <div key={h.id} className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded">
                            <span>{DIAS_SEMANA[h.dia_semana].slice(0, 3)} {h.hora_inicio}-{h.hora_fim}</span>
                            <button onClick={() => handleDeleteHorario(h.id)} className="text-muted-foreground hover:text-destructive ml-1">
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog Nova/Editar Disciplina */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
            <DialogDescription>Preencha os dados da disciplina</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Codigo</label>
                <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="CK0211" />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {CORES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCor(c)}
                      className={`w-6 h-6 rounded-full ${cor === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Fundamentos de Programacao" />
            </div>
            <div>
              <label className="text-sm font-medium">Professor</label>
              <Input value={professor} onChange={e => setProfessor(e.target.value)} placeholder="Prof. Fulano" />
            </div>
            <div>
              <label className="text-sm font-medium">Local</label>
              <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Bloco 707 Sala 13" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveDisciplina} disabled={saving || !codigo.trim() || !nome.trim()}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Horario */}
      <Dialog open={horarioDialogOpen} onOpenChange={setHorarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Horario</DialogTitle>
            <DialogDescription>{selectedDisciplina?.codigo} - {selectedDisciplina?.nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Dia da semana</label>
              <Select value={diaSemana} onValueChange={setDiaSemana}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia, i) => (
                    <SelectItem key={i} value={String(i)}>{dia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Inicio</label>
                <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Fim</label>
                <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setHorarioDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddHorario} disabled={saving}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

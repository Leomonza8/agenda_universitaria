'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Disciplina } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Plus, BookOpen, FlaskConical } from 'lucide-react'

const CORES = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
  '#14b8a6', '#6366f1', '#84cc16', '#a855f7',
]

type TipoDisciplina = 'obrigatoria' | 'optativa' | 'extensao'

interface DisciplinaComTipo extends Disciplina {
  tipo?: TipoDisciplina
}

interface Props {
  disciplinas: DisciplinaComTipo[]
  onUpdate: () => void
}

const TIPO_LABEL: Record<TipoDisciplina, string> = {
  obrigatoria: 'Obrigatoria',
  optativa: 'Optativa',
  extensao: 'Extensao',
}

const TIPO_COLOR: Record<TipoDisciplina, string> = {
  obrigatoria: 'bg-primary/10 text-primary',
  optativa: 'bg-amber-500/10 text-amber-600',
  extensao: 'bg-emerald-500/10 text-emerald-600',
}

export function GerenciarDisciplinas({ disciplinas, onUpdate }: Props) {
  const supabase = createClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<DisciplinaComTipo | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    professor: '',
    local: '',
    cor: CORES[0],
    tipo: 'obrigatoria' as TipoDisciplina,
  })

  const abrirNova = () => {
    setEditando(null)
    setForm({ codigo: '', nome: '', professor: '', local: '', cor: CORES[0], tipo: 'obrigatoria' })
    setDialogOpen(true)
  }

  const abrirEdicao = (d: DisciplinaComTipo) => {
    setEditando(d)
    setForm({
      codigo: d.codigo,
      nome: d.nome,
      professor: d.professor ?? '',
      local: d.local ?? '',
      cor: d.cor,
      tipo: (d.tipo as TipoDisciplina) ?? 'obrigatoria',
    })
    setDialogOpen(true)
  }

  const handleSalvar = async () => {
    if (!form.codigo.trim() || !form.nome.trim()) return
    const session = getSession()
    if (!session) return

    setSaving(true)
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nome: form.nome.trim(),
      professor: form.professor.trim() || null,
      local: form.local.trim() || null,
      cor: form.cor,
      tipo: form.tipo,
      user_id: session.userId,
    }

    if (editando) {
      await supabase.from('disciplinas').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('disciplinas').insert(payload)
    }

    setSaving(false)
    setDialogOpen(false)
    onUpdate()
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir disciplina? Isso vai remover todos os horarios associados.')) return
    await supabase.from('disciplinas').delete().eq('id', id)
    onUpdate()
  }

  const obrigatorias = disciplinas.filter(d => !d.tipo || d.tipo === 'obrigatoria')
  const optativas = disciplinas.filter(d => d.tipo === 'optativa')
  const extensoes = disciplinas.filter(d => d.tipo === 'extensao')

  const renderLista = (lista: DisciplinaComTipo[], titulo: string, icon: React.ReactNode) => (
    lista.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-medium text-muted-foreground">{titulo}</span>
        </div>
        <div className="space-y-2">
          {lista.map(d => (
            <Card key={d.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: d.cor }} />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: d.cor + '20', color: d.cor }}
                  >
                    {d.codigo.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{d.codigo} — {d.nome}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {d.professor && <span className="text-xs text-muted-foreground">{d.professor}</span>}
                      {d.local && <span className="text-xs text-muted-foreground">· {d.local}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEdicao(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleExcluir(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{disciplinas.length} disciplina(s) cadastrada(s)</p>
        <Button onClick={abrirNova} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nova Disciplina
        </Button>
      </div>

      {disciplinas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma disciplina cadastrada ainda.
        </div>
      )}

      {renderLista(obrigatorias, 'Obrigatorias', <BookOpen className="h-4 w-4 text-muted-foreground" />)}
      {renderLista(optativas, 'Optativas', <BookOpen className="h-4 w-4 text-amber-500" />)}
      {renderLista(extensoes, 'Extensao', <FlaskConical className="h-4 w-4 text-emerald-500" />)}

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da disciplina. Codigo e nome sao obrigatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Codigo *</label>
                <Input
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  placeholder="MAT001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoDisciplina }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obrigatoria">Obrigatoria</SelectItem>
                    <SelectItem value="optativa">Optativa</SelectItem>
                    <SelectItem value="extensao">Extensao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Calculo I"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Professor</label>
              <Input
                value={form.professor}
                onChange={e => setForm(f => ({ ...f, professor: e.target.value }))}
                placeholder="Nome do professor"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Local / Sala</label>
              <Input
                value={form.local}
                onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
                placeholder="Sala 101 - Bloco A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CORES.map(cor => (
                  <button
                    key={cor}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: cor,
                      outline: form.cor === cor ? `3px solid ${cor}` : 'none',
                      outlineOffset: '2px',
                    }}
                    onClick={() => setForm(f => ({ ...f, cor }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSalvar}
                disabled={saving || !form.codigo.trim() || !form.nome.trim()}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

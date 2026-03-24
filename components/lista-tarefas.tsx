'use client'

import { useState } from 'react'
import { Tarefa, Disciplina, Prioridade } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, BookOpen, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ListaTarefasProps {
  tarefas: Tarefa[]
  disciplinas: Disciplina[]
  disciplinaFiltro?: string | null
  onUpdate: () => void
}

export function ListaTarefas({ tarefas, disciplinas, disciplinaFiltro, onUpdate }: ListaTarefasProps) {
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [disciplinaId, setDisciplinaId] = useState<string>('')
  const [dataEntrega, setDataEntrega] = useState('')
  const [prioridade, setPrioridade] = useState<Prioridade>('media')
  const [loading, setLoading] = useState(false)

  // edição de tarefa
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editPrioridade, setEditPrioridade] = useState<Prioridade>('media')
  const [editData, setEditData] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // revisão rápida
  const [revisaoTarefa, setRevisaoTarefa] = useState<Tarefa | null>(null)
  const [revisaoTitulo, setRevisaoTitulo] = useState('')
  const [revisaoData, setRevisaoData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [revisaoTempo, setRevisaoTempo] = useState(30)
  const [revisaoLoading, setRevisaoLoading] = useState(false)

  const supabase = createClient()

  const tarefasFiltradas = disciplinaFiltro
    ? tarefas.filter(t => t.disciplina_id === disciplinaFiltro)
    : tarefas

  const tarefasPendentes = tarefasFiltradas.filter(t => !t.concluida)
  const tarefasConcluidas = tarefasFiltradas.filter(t => t.concluida)

  const handleAddTarefa = async () => {
    if (!titulo.trim() || !disciplinaId) return
    setLoading(true)

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      disciplina_id: disciplinaId,
      data_entrega: dataEntrega || null,
      prioridade,
      concluida: false,
    }

    const { error } = await supabase.from('tarefas').insert(payload)

    setLoading(false)

    if (error) return

    setTitulo('')
    setDescricao('')
    setDisciplinaId('')
    setDataEntrega('')
    setPrioridade('media')
    setShowForm(false)
    await onUpdate()
  }

  const toggleConcluida = async (tarefa: Tarefa) => {
    await supabase
      .from('tarefas')
      .update({ concluida: !tarefa.concluida })
      .eq('id', tarefa.id)
    onUpdate()
  }

  const deleteTarefa = async (id: string) => {
    await supabase.from('tarefas').delete().eq('id', id)
    onUpdate()
  }

  const abrirEdicao = (tarefa: Tarefa) => {
    setEditTarefa(tarefa)
    setEditTitulo(tarefa.titulo)
    setEditPrioridade(tarefa.prioridade)
    setEditData(tarefa.data_entrega ?? '')
  }

  const handleSalvarEdicao = async () => {
    if (!editTarefa || !editTitulo.trim()) return
    setEditLoading(true)
    await supabase.from('tarefas').update({
      titulo: editTitulo.trim(),
      prioridade: editPrioridade,
      data_entrega: editData || null,
    }).eq('id', editTarefa.id)
    setEditLoading(false)
    setEditTarefa(null)
    await onUpdate()
  }

  const handleCriarRevisao = async () => {
    if (!revisaoTarefa) return
    setRevisaoLoading(true)
    await supabase.from('revisoes').insert({
      tarefas_id: revisaoTarefa.id,
      titulo: revisaoTitulo.trim() || null,
      data_revisao: revisaoData,
      tempo_estimado: revisaoTempo,
      status: 'nao_iniciada',
    })
    setRevisaoLoading(false)
    setRevisaoTarefa(null)
    setRevisaoTitulo('')
  }

  const prioridadeConfig = {
    baixa: { label: 'Baixa', bg: 'bg-green-100', text: 'text-green-700' },
    media: { label: 'Média', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    alta: { label: 'Alta', bg: 'bg-red-100', text: 'text-red-700' },
  }

  const TarefaItem = ({ tarefa }: { tarefa: Tarefa }) => {
    const prioridadeStyle = prioridadeConfig[tarefa.prioridade] || prioridadeConfig.media
    
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
        <Checkbox
          checked={tarefa.concluida}
          onCheckedChange={() => toggleConcluida(tarefa)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium ${tarefa.concluida ? 'line-through text-muted-foreground' : ''}`}
            >
              {tarefa.titulo}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: tarefa.disciplina?.cor + '20',
                color: tarefa.disciplina?.cor,
              }}
            >
              {tarefa.disciplina?.codigo}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${prioridadeStyle.bg} ${prioridadeStyle.text}`}>
              {prioridadeStyle.label}
            </span>
          </div>
        {tarefa.descricao && (
          <p className="text-sm text-muted-foreground mt-1">{tarefa.descricao}</p>
        )}
        {tarefa.data_entrega && (
          <p className="text-xs text-muted-foreground mt-1">
            Entrega: {format(new Date(tarefa.data_entrega), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Editar tarefa"
          onClick={() => abrirEdicao(tarefa)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="Criar revisão"
          onClick={() => {
            setRevisaoTarefa(tarefa)
            setRevisaoTitulo('')
            setRevisaoData(format(new Date(), 'yyyy-MM-dd'))
            setRevisaoTempo(30)
          }}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => deleteTarefa(tarefa.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Tarefas</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Input
              placeholder="Título da tarefa"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <Textarea
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 flex-wrap">
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger className="flex-1 min-w-[180px]">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.codigo} - {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Prioridade)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTarefa} disabled={loading || !titulo.trim() || !disciplinaId}>
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {tarefasPendentes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Pendentes ({tarefasPendentes.length})</h4>
            {tarefasPendentes.map((tarefa) => (
              <TarefaItem key={tarefa.id} tarefa={tarefa} />
            ))}
          </div>
        )}

        {tarefasConcluidas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Concluídas ({tarefasConcluidas.length})</h4>
            {tarefasConcluidas.map((tarefa) => (
              <TarefaItem key={tarefa.id} tarefa={tarefa} />
            ))}
          </div>
        )}

        {tarefasFiltradas.length === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma tarefa ainda. Clique em "Nova" para adicionar.
          </p>
        )}
      </CardContent>

      {/* Dialog de edição */}
      <Dialog open={!!editTarefa} onOpenChange={(open) => { if (!open) setEditTarefa(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Nome da tarefa"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={editPrioridade} onValueChange={(v) => setEditPrioridade(v as Prioridade)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data de entrega</label>
              <Input
                type="date"
                value={editData}
                onChange={(e) => setEditData(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditTarefa(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarEdicao} disabled={editLoading || !editTitulo.trim()}>
                {editLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de revisão rápida */}
      <Dialog open={!!revisaoTarefa} onOpenChange={(open) => { if (!open) setRevisaoTarefa(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="font-medium">{revisaoTarefa?.titulo}</span>
              <span className="ml-2 text-muted-foreground">({revisaoTarefa?.disciplina?.codigo})</span>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome da revisão (opcional)</label>
              <Input
                value={revisaoTitulo}
                onChange={(e) => setRevisaoTitulo(e.target.value)}
                placeholder="Ex: Revisão de conceitos, Exercícios práticos..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data da revisão</label>
              <Input
                type="date"
                value={revisaoData}
                onChange={(e) => setRevisaoData(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tempo estimado (minutos)</label>
              <Input
                type="number"
                min="15"
                step="15"
                value={revisaoTempo}
                onChange={(e) => setRevisaoTempo(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRevisaoTarefa(null)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarRevisao} disabled={revisaoLoading}>
                {revisaoLoading ? 'Criando...' : 'Criar Revisão'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

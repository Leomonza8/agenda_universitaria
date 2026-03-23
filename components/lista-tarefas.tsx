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
import { Plus, Trash2 } from 'lucide-react'
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

    if (error) {
      setLoading(false)
      return
    }

    setTitulo('')
    setDescricao('')
    setDisciplinaId('')
    setDataEntrega('')
    setPrioridade('media')
    setShowForm(false)
    setLoading(false)
    onUpdate()
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => deleteTarefa(tarefa.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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
    </Card>
  )
}

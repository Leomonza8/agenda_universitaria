'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/auth'
import { Revisao, Tarefa, StatusRevisao } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Clock, Plus, Trash2, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function SistemaRevisao() {
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | StatusRevisao>('todas')

  const [novaRevisao, setNovaRevisao] = useState({
    tarefas_id: '',
    titulo: '',
    data_revisao: format(new Date(), 'yyyy-MM-dd'),
    tempo_estimado: 30,
  })

  // estado de edição
  const [editRevisao, setEditRevisao] = useState<Revisao | null>(null)
  const [editFields, setEditFields] = useState({
    titulo: '',
    data_revisao: '',
    tempo_estimado: null as number | null,
    status: 'nao_iniciada' as StatusRevisao,
  })
  const [editLoading, setEditLoading] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const session = getSession()
    if (!session) return

    setLoading(true)
    const [revisoesRes, tarefasRes] = await Promise.all([
      supabase
        .from('revisoes')
        .select('*, tarefa:tarefas(*, disciplina:disciplinas(*))')
        .eq('user_id', session.userId)
        .order('data_revisao', { ascending: true }),
      supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
        .eq('user_id', session.userId)
        .order('concluida', { ascending: true })
        .order('titulo'),
    ])

    if (revisoesRes.data) setRevisoes(revisoesRes.data)
    if (tarefasRes.data) setTarefas(tarefasRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddRevisao = async () => {
    if (!novaRevisao.tarefas_id) return

    const session = getSession()
    if (!session) return

    const { error } = await supabase.from('revisoes').insert([{
      tarefas_id: novaRevisao.tarefas_id,
      titulo: novaRevisao.titulo.trim() || null,
      data_revisao: novaRevisao.data_revisao,
      tempo_estimado: novaRevisao.tempo_estimado,
      status: 'nao_iniciada',
      user_id: session.userId,
    }])

    if (!error) {
      setNovaRevisao({ tarefas_id: '', titulo: '', data_revisao: format(new Date(), 'yyyy-MM-dd'), tempo_estimado: 30 })
      setDialogOpen(false)
      fetchData()
    }
  }

  const abrirEdicao = (r: Revisao) => {
    setEditRevisao(r)
    setEditFields({
      titulo: r.titulo ?? '',
      data_revisao: r.data_revisao,
      tempo_estimado: r.tempo_estimado,
      status: r.status,
    })
  }

  const handleSalvarEdicao = async () => {
    if (!editRevisao) return
    setEditLoading(true)
    const { error } = await supabase
      .from('revisoes')
      .update({
        titulo: editFields.titulo.trim() || null,
        data_revisao: editFields.data_revisao,
        tempo_estimado: editFields.tempo_estimado,
        status: editFields.status,
      })
      .eq('id', editRevisao.id)

    setEditLoading(false)
    if (!error) {
      setEditRevisao(null)
      fetchData()
    }
  }

  const handleUpdateStatus = async (revisaoId: string, status: StatusRevisao) => {
    await supabase.from('revisoes').update({ status }).eq('id', revisaoId)
    setRevisoes(prev => prev.map(r => r.id === revisaoId ? { ...r, status } : r))
  }

  const handleDeleteRevisao = async (revisaoId: string) => {
    await supabase.from('revisoes').delete().eq('id', revisaoId)
    setRevisoes(prev => prev.filter(r => r.id !== revisaoId))
  }

  const revisoesFilter = filtro === 'todas' ? revisoes : revisoes.filter(r => r.status === filtro)

  const estatisticas = {
    total: revisoes.length,
    nao_iniciada: revisoes.filter(r => r.status === 'nao_iniciada').length,
    em_progresso: revisoes.filter(r => r.status === 'em_progresso').length,
    concluida: revisoes.filter(r => r.status === 'concluida').length,
  }

  const statusLabel: Record<StatusRevisao, string> = {
    nao_iniciada: 'Não iniciada',
    em_progresso: 'Em progresso',
    concluida: 'Concluída',
  }

  const statusIcon: Record<StatusRevisao, string> = {
    nao_iniciada: '⭕',
    em_progresso: '⏳',
    concluida: '✅',
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {([
          { label: 'Total', value: estatisticas.total, color: '' },
          { label: 'Não iniciadas', value: estatisticas.nao_iniciada, color: 'text-muted-foreground' },
          { label: 'Em progresso', value: estatisticas.em_progresso, color: 'text-blue-600' },
          { label: 'Concluídas', value: estatisticas.concluida, color: 'text-green-600' },
        ] as const).map(item => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão nova revisão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nova Revisão
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar nova revisão</DialogTitle>
            <DialogDescription>
              Crie uma nova sessão de revisão para uma das suas tarefas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tarefa</label>
              <Select value={novaRevisao.tarefas_id} onValueChange={v => setNovaRevisao({ ...novaRevisao, tarefas_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma tarefa" /></SelectTrigger>
                <SelectContent>
                  {tarefas.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.concluida ? '[Concluída] ' : ''}{t.titulo} ({t.disciplina?.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome da revisão (opcional)</label>
              <Input value={novaRevisao.titulo} onChange={e => setNovaRevisao({ ...novaRevisao, titulo: e.target.value })} placeholder="Ex: Revisão de conceitos..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data</label>
              <Input type="date" value={novaRevisao.data_revisao} onChange={e => setNovaRevisao({ ...novaRevisao, data_revisao: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tempo estimado (min)</label>
              <Input type="number" min="15" step="15" value={novaRevisao.tempo_estimado} onChange={e => setNovaRevisao({ ...novaRevisao, tempo_estimado: parseInt(e.target.value) || 30 })} />
            </div>
            <Button onClick={handleAddRevisao} className="w-full" disabled={!novaRevisao.tarefas_id}>
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['todas', 'nao_iniciada', 'em_progresso', 'concluida'] as const).map(f => (
          <Button
            key={f}
            variant={filtro === f ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap text-xs flex-shrink-0"
            onClick={() => setFiltro(f)}
          >
            {f === 'todas' ? `Todas (${estatisticas.total})` :
             f === 'nao_iniciada' ? `Não iniciadas (${estatisticas.nao_iniciada})` :
             f === 'em_progresso' ? `Em progresso (${estatisticas.em_progresso})` :
             `Concluídas (${estatisticas.concluida})`}
          </Button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {revisoesFilter.length === 0 ? (
          <Card><CardContent className="text-center py-8 text-muted-foreground">Nenhuma revisão encontrada</CardContent></Card>
        ) : (
          revisoesFilter.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5 flex-shrink-0">{statusIcon[r.status]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{r.tarefa?.titulo}</p>
                    {r.titulo && <p className="text-xs text-muted-foreground italic mt-0.5">{r.titulo}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: r.tarefa?.disciplina?.cor, color: r.tarefa?.disciplina?.cor }}>
                        {r.tarefa?.disciplina?.codigo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(r.data_revisao), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      {r.tempo_estimado && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />{r.tempo_estimado}min
                        </span>
                      )}
                    </div>
                    {/* Status select inline no mobile */}
                    <div className="mt-2">
                      <Select value={r.status} onValueChange={v => handleUpdateStatus(r.id, v as StatusRevisao)}>
                        <SelectTrigger className="h-7 text-xs w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
                          <SelectItem value="em_progresso">Em progresso</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => abrirEdicao(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRevisao(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edição */}
      <Dialog open={!!editRevisao} onOpenChange={open => { if (!open) setEditRevisao(null) }}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar revisão</DialogTitle>
            <DialogDescription>
              Altere os detalhes da sua sessão de revisão
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="font-medium">{editRevisao?.tarefa?.titulo}</span>
              <span className="ml-2 text-muted-foreground text-xs">({editRevisao?.tarefa?.disciplina?.codigo})</span>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome da revisão (opcional)</label>
              <Input
                value={editFields.titulo}
                onChange={e => setEditFields({ ...editFields, titulo: e.target.value })}
                placeholder="Ex: Revisão de conceitos..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={editFields.data_revisao}
                onChange={e => setEditFields({ ...editFields, data_revisao: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tempo estimado (min)</label>
              <Input
                type="number"
                min="0"
                step="15"
                value={editFields.tempo_estimado === null ? '' : editFields.tempo_estimado}
                onChange={e => setEditFields({ ...editFields, tempo_estimado: e.target.value === '' ? null : parseInt(e.target.value) })}
                placeholder="Deixe em branco para nenhum"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={editFields.status} onValueChange={v => setEditFields({ ...editFields, status: v as StatusRevisao })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
                  <SelectItem value="em_progresso">Em progresso</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditRevisao(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSalvarEdicao} disabled={editLoading}>
                {editLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

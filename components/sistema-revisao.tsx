'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Revisao, Tarefa, StatusRevisao } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function SistemaRevisao() {
  const [revisoes, setRevisoes] = useState<Revisao[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'nao_iniciada' | 'em_progresso' | 'concluida'>('todas')

  const [novaRevisao, setNovaRevisao] = useState({
    tarefas_id: '',
    data_revisao: format(new Date(), 'yyyy-MM-dd'),
    tempo_estimado: 30,
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [revisoesRes, tarefasRes] = await Promise.all([
      supabase
        .from('revisoes')
        .select('*, tarefa:tarefas(*, disciplina:disciplinas(*))')
        .order('data_revisao', { ascending: true }),
      supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)')
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

    const { error } = await supabase
      .from('revisoes')
      .insert([
        {
          tarefas_id: novaRevisao.tarefas_id,
          data_revisao: novaRevisao.data_revisao,
          tempo_estimado: novaRevisao.tempo_estimado,
          status: 'nao_iniciada',
        },
      ])

    if (!error) {
      setNovaRevisao({
        tarefas_id: '',
        data_revisao: format(new Date(), 'yyyy-MM-dd'),
        tempo_estimado: 30,
      })
      setDialogOpen(false)
      fetchData()
    }
  }

  const handleUpdateStatus = async (revisaoId: string, status: StatusRevisao) => {
    const { error } = await supabase
      .from('revisoes')
      .update({ status })
      .eq('id', revisaoId)

    if (!error) {
      setRevisoes(revisoes.map(r =>
        r.id === revisaoId ? { ...r, status } : r
      ))
    }
  }

  const handleDeleteRevisao = async (revisaoId: string) => {
    const { error } = await supabase
      .from('revisoes')
      .delete()
      .eq('id', revisaoId)

    if (!error) {
      setRevisoes(revisoes.filter(r => r.id !== revisaoId))
    }
  }

  const revisoesFilter = filtro === 'todas'
    ? revisoes
    : revisoes.filter(r => r.status === filtro)

  const estatisticas = {
    total: revisoes.length,
    naoIniciada: revisoes.filter(r => r.status === 'nao_iniciada').length,
    emProgresso: revisoes.filter(r => r.status === 'em_progresso').length,
    concluida: revisoes.filter(r => r.status === 'concluida').length,
  }

  const getStatusColor = (status: StatusRevisao) => {
    switch (status) {
      case 'nao_iniciada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      case 'em_progresso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'concluida':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    }
  }

  const getStatusIcon = (status: StatusRevisao) => {
    switch (status) {
      case 'nao_iniciada':
        return '⭕'
      case 'em_progresso':
        return '⏳'
      case 'concluida':
        return '✅'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{estatisticas.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{estatisticas.naoIniciada}</p>
              <p className="text-xs text-muted-foreground">Não Iniciadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{estatisticas.emProgresso}</p>
              <p className="text-xs text-muted-foreground">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{estatisticas.concluida}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Nova Revisão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nova Revisão
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Nova Revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tarefa</label>
              <Select value={novaRevisao.tarefas_id} onValueChange={(value) => 
                setNovaRevisao({ ...novaRevisao, tarefas_id: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma tarefa" />
                </SelectTrigger>
                <SelectContent>
                  {tarefas.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.concluida ? '[Concluída] ' : ''}{t.titulo} ({t.disciplina?.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data da Revisão</label>
              <Input
                type="date"
                value={novaRevisao.data_revisao}
                onChange={(e) => setNovaRevisao({ ...novaRevisao, data_revisao: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tempo Estimado (minutos)</label>
              <Input
                type="number"
                min="15"
                step="15"
                value={novaRevisao.tempo_estimado}
                onChange={(e) => setNovaRevisao({ ...novaRevisao, tempo_estimado: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={handleAddRevisao} className="w-full">
              Agendar Revisão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filtro === 'todas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('todas')}
        >
          Todas ({estatisticas.total})
        </Button>
        <Button
          variant={filtro === 'nao_iniciada' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('nao_iniciada')}
        >
          Não Iniciadas ({estatisticas.naoIniciada})
        </Button>
        <Button
          variant={filtro === 'em_progresso' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('em_progresso')}
        >
          Em Progresso ({estatisticas.emProgresso})
        </Button>
        <Button
          variant={filtro === 'concluida' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('concluida')}
        >
          Concluídas ({estatisticas.concluida})
        </Button>
      </div>

      {/* Lista de Revisões */}
      <div className="space-y-2">
        {revisoesFilter.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Nenhuma revisão encontrada
            </CardContent>
          </Card>
        ) : (
          revisoesFilter.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.tarefa?.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {r.tarefa?.disciplina?.codigo}
                      </Badge>
                      {r.tempo_estimado && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.tempo_estimado}min
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(r.data_revisao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{getStatusIcon(r.status)}</span>
                      <Select value={r.status} onValueChange={(value) => 
                        handleUpdateStatus(r.id, value as StatusRevisao)
                      }>
                        <SelectTrigger className="w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                          <SelectItem value="em_progresso">Em Progresso</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRevisao(r.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Anotacao, Disciplina } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnotacoesAulaProps {
  anotacoes: Anotacao[]
  disciplinas: Disciplina[]
  disciplinaFiltro?: string | null
  onUpdate: () => void
}

export function AnotacoesAula({ anotacoes, disciplinas, disciplinaFiltro, onUpdate }: AnotacoesAulaProps) {
  const [showForm, setShowForm] = useState(false)
  const [conteudo, setConteudo] = useState('')
  const [disciplinaId, setDisciplinaId] = useState<string>('')
  const [dataAnotacao, setDataAnotacao] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const anotacoesFiltradas = disciplinaFiltro
    ? anotacoes.filter(a => a.disciplina_id === disciplinaFiltro)
    : anotacoes

  const handleAddAnotacao = async () => {
    if (!conteudo.trim() || !disciplinaId) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      conteudo: conteudo.trim(),
      disciplina_id: disciplinaId,
      data: dataAnotacao,
      user_id: user.id,
    }

    const { error } = await supabase.from('anotacoes').insert(payload)

    setLoading(false)

    if (error) return

    setConteudo('')
    setDisciplinaId('')
    setDataAnotacao(format(new Date(), 'yyyy-MM-dd'))
    setShowForm(false)
    await onUpdate()
  }

  const deleteAnotacao = async (id: string) => {
    await supabase.from('anotacoes').delete().eq('id', id)
    onUpdate()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Anotações de Aula</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex gap-2">
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger className="flex-1">
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
              <input
                type="date"
                value={dataAnotacao}
                onChange={(e) => setDataAnotacao(e.target.value)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <Textarea
              placeholder="O que foi visto na aula de hoje?"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddAnotacao} disabled={loading || !conteudo.trim() || !disciplinaId}>
                Salvar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {anotacoesFiltradas.map((anotacao) => (
            <div
              key={anotacao.id}
              className="p-4 rounded-lg bg-card border border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: anotacao.disciplina?.cor + '20',
                        color: anotacao.disciplina?.cor,
                      }}
                    >
                      {anotacao.disciplina?.codigo}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(anotacao.data), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{anotacao.conteudo}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteAnotacao(anotacao.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {anotacoesFiltradas.length === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma anotação ainda. Clique em "Nova" para adicionar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

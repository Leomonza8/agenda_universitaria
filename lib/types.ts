export interface Disciplina {
  id: string
  codigo: string
  nome: string
  cor: string
  local: string
  professor: string
}

export interface Horario {
  id: string
  disciplina_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  disciplina?: Disciplina
}

export type Prioridade = 'baixa' | 'media' | 'alta'

export interface Tarefa {
  id: string
  disciplina_id: string
  titulo: string
  descricao: string | null
  data_entrega: string | null
  prioridade: Prioridade
  concluida: boolean
  created_at: string
  disciplina?: Disciplina
}

export interface Anotacao {
  id: string
  disciplina_id: string
  data: string
  conteudo: string
  created_at: string
  disciplina?: Disciplina
}

export type StatusRevisao = 'nao_iniciada' | 'em_progresso' | 'concluida'

export interface Revisao {
  id: string
  tarefas_id: string
  data_revisao: string
  status: StatusRevisao
  tempo_estimado: number | null
  created_at: string
  tarefa?: Tarefa
}

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]


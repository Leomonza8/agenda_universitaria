-- Tabela de disciplinas (pré-populada com os dados do SIGAA)
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  professor TEXT NOT NULL,
  local TEXT,
  cor TEXT DEFAULT '#3b82f6'
);

-- Tabela de horários das aulas
CREATE TABLE IF NOT EXISTS horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL
);

-- Tabela de tarefas/afazeres
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_entrega DATE,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de anotações diárias por aula
CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as disciplinas do Leonardo
INSERT INTO disciplinas (codigo, nome, professor, local, cor) VALUES
  ('CB0704', 'Cálculo Fundamental I', 'Julio Cesar Silva Araujo', 'Bloco 707 Sala 13', '#ef4444'),
  ('CD0381', 'Fundamentos de Física I', 'Jose Ramos Goncalves', 'Sala 14 - Bloco 707', '#f97316'),
  ('CK0211', 'Fundamentos de Programação', 'Wladimir Araujo Tavares', 'LEC3 / 726-19', '#22c55e'),
  ('CE0900', 'Química Aplicada à Engenharia', 'Tercio de Freitas Paulo / Idalina Maria Moreira', 'Bloco 950 Sala 08', '#8b5cf6'),
  ('TL0015', 'Expressão Gráfica de Projetos', 'Antonio Paulo de Hollanda Cavalcante', 'CT', '#ec4899'),
  ('TI0139', 'Introdução à Eng. de Computação', 'Ricardo Jardel Nunes da Silveira', 'Bloco 707', '#06b6d4');

-- Inserir os horários das aulas
-- Cálculo I: SEG 08-10, QUA 08-10
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 1, '08:00', '10:00' FROM disciplinas WHERE codigo = 'CB0704';
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 3, '08:00', '10:00' FROM disciplinas WHERE codigo = 'CB0704';

-- Física I: TER 08-10, QUI 08-10
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 2, '08:00', '10:00' FROM disciplinas WHERE codigo = 'CD0381';
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 4, '08:00', '10:00' FROM disciplinas WHERE codigo = 'CD0381';

-- Fund. Programação: TER 10-12, SEX 08-10
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 2, '10:00', '12:00' FROM disciplinas WHERE codigo = 'CK0211';
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 5, '08:00', '10:00' FROM disciplinas WHERE codigo = 'CK0211';

-- Química: QUA 10-12, SEX 10-12
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 3, '10:00', '12:00' FROM disciplinas WHERE codigo = 'CE0900';
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 5, '10:00', '12:00' FROM disciplinas WHERE codigo = 'CE0900';

-- Expressão Gráfica: SEG 14-18
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 1, '14:00', '18:00' FROM disciplinas WHERE codigo = 'TL0015';

-- Intro Eng. Computação: SEG 10-12
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
SELECT id, 1, '10:00', '12:00' FROM disciplinas WHERE codigo = 'TI0139';

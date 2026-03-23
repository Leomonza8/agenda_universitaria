-- Create disciplinas table
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  professor TEXT NOT NULL,
  local TEXT,
  cor TEXT DEFAULT '#3b82f6'
);

-- Create horarios table
CREATE TABLE IF NOT EXISTS horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL
);

-- Create tarefas table
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_entrega DATE,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anotacoes table
CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create revisoes table
CREATE TABLE IF NOT EXISTS revisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefas_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  data_revisao DATE NOT NULL,
  status TEXT DEFAULT 'nao_iniciada' CHECK (status IN ('nao_iniciada', 'em_progresso', 'concluida')),
  tempo_estimado INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample disciplines
INSERT INTO disciplinas (codigo, nome, professor, local, cor) VALUES
  ('CB0704', 'Cálculo Fundamental I', 'Julio Cesar Silva Araujo', 'Bloco 707 Sala 13', '#ef4444'),
  ('CD0381', 'Fundamentos de Física I', 'Jose Ramos Goncalves', 'Sala 14 - Bloco 707', '#f97316'),
  ('CK0211', 'Fundamentos de Programação', 'Wladimir Araujo Tavares', 'LEC3 / 726-19', '#22c55e'),
  ('CE0900', 'Química Aplicada à Engenharia', 'Tercio de Freitas Paulo', 'Bloco 950 Sala 08', '#8b5cf6'),
  ('TL0015', 'Expressão Gráfica de Projetos', 'Antonio Paulo de Hollanda Cavalcante', 'CT', '#ec4899'),
  ('TI0139', 'Introdução à Eng. de Computação', 'Ricardo Jardel Nunes da Silveira', 'Bloco 707', '#06b6d4')
ON CONFLICT DO NOTHING;

-- Insert sample horários (this approach works better in Supabase)
INSERT INTO horarios (disciplina_id, dia_semana, hora_inicio, hora_fim)
VALUES 
  ((SELECT id FROM disciplinas WHERE codigo = 'CB0704' LIMIT 1), 1, '08:00', '10:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CB0704' LIMIT 1), 3, '08:00', '10:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CD0381' LIMIT 1), 2, '08:00', '10:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CD0381' LIMIT 1), 4, '08:00', '10:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CK0211' LIMIT 1), 2, '10:00', '12:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CK0211' LIMIT 1), 5, '08:00', '10:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CE0900' LIMIT 1), 3, '10:00', '12:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'CE0900' LIMIT 1), 5, '10:00', '12:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'TL0015' LIMIT 1), 1, '14:00', '18:00'),
  ((SELECT id FROM disciplinas WHERE codigo = 'TI0139' LIMIT 1), 1, '10:00', '12:00')
ON CONFLICT DO NOTHING;

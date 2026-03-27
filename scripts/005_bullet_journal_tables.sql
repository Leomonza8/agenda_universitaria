-- Tabelas do Bullet Journal (sem foreign keys para evitar erros)

-- Daily Log: entradas diarias (tarefas, eventos, notas)
CREATE TABLE IF NOT EXISTS bujo_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('tarefa', 'evento', 'nota')),
  texto TEXT NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  migrada BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit Tracker: habitos para acompanhar
CREATE TABLE IF NOT EXISTS bujo_habitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(50) DEFAULT 'circle',
  cor VARCHAR(20) DEFAULT '#3b82f6',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit Log: registro diario dos habitos
CREATE TABLE IF NOT EXISTS bujo_habitos_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habito_id UUID NOT NULL,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN DEFAULT FALSE,
  UNIQUE(habito_id, data)
);

-- Mood Tracker: registro de humor
CREATE TABLE IF NOT EXISTS bujo_humor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  nivel INT NOT NULL CHECK (nivel >= 1 AND nivel <= 5),
  nota TEXT,
  UNIQUE(user_id, data)
);

-- Collections: listas personalizadas
CREATE TABLE IF NOT EXISTS bujo_colecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  cor VARCHAR(20) DEFAULT '#8b5cf6',
  icone VARCHAR(50) DEFAULT 'list',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Items: itens das colecoes
CREATE TABLE IF NOT EXISTS bujo_colecoes_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colecao_id UUID NOT NULL,
  user_id UUID NOT NULL,
  texto TEXT NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_bujo_entradas_user_data ON bujo_entradas(user_id, data);
CREATE INDEX IF NOT EXISTS idx_bujo_habitos_user ON bujo_habitos(user_id);
CREATE INDEX IF NOT EXISTS idx_bujo_habitos_log_user_data ON bujo_habitos_log(user_id, data);
CREATE INDEX IF NOT EXISTS idx_bujo_humor_user_data ON bujo_humor(user_id, data);
CREATE INDEX IF NOT EXISTS idx_bujo_colecoes_user ON bujo_colecoes(user_id);
CREATE INDEX IF NOT EXISTS idx_bujo_colecoes_itens_colecao ON bujo_colecoes_itens(colecao_id);

-- Habilitar RLS
ALTER TABLE bujo_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bujo_habitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bujo_habitos_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bujo_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE bujo_colecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bujo_colecoes_itens ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS bujo_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'tarefa',
  texto TEXT NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bujo_habitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3b82f6',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bujo_habitos_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habito_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(habito_id, data)
);

CREATE INDEX IF NOT EXISTS idx_bujo_entradas_user_data ON bujo_entradas(user_id, data);
CREATE INDEX IF NOT EXISTS idx_bujo_habitos_user ON bujo_habitos(user_id);
CREATE INDEX IF NOT EXISTS idx_bujo_habitos_log_habito ON bujo_habitos_log(habito_id, data);

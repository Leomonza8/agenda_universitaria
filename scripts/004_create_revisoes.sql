-- Tabela de revisoes (spaced repetition system)
CREATE TABLE IF NOT EXISTS revisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  proxima_revisao DATE NOT NULL,
  intervalo_dias INTEGER DEFAULT 1,
  nivel INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desabilitar RLS para revisoes (app pessoal sem auth)
ALTER TABLE revisoes DISABLE ROW LEVEL SECURITY;

-- Adicionar coluna local na tabela de horarios se nao existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='horarios' AND column_name='local') THEN
    ALTER TABLE horarios ADD COLUMN local TEXT;
  END IF;
END $$;

-- Atualizar os locais nos horarios existentes
UPDATE horarios h
SET local = d.local
FROM disciplinas d
WHERE h.disciplina_id = d.id AND h.local IS NULL;

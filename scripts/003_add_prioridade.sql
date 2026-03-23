-- Adicionar campo de prioridade nas tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta'));

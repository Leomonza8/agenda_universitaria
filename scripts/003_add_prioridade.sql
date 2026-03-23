-- Add priority column to tarefas
ALTER TABLE tarefas 
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta'));

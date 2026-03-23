-- Desabilitar RLS para uso pessoal (sem autenticação)
-- Como é uma agenda pessoal só para você, não precisa de autenticação

ALTER TABLE disciplinas DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas DISABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes DISABLE ROW LEVEL SECURITY;

-- OU se preferir manter RLS, criar políticas públicas:
-- DROP POLICY IF EXISTS "public_read_disciplinas" ON disciplinas;
-- DROP POLICY IF EXISTS "public_read_horarios" ON horarios;
-- DROP POLICY IF EXISTS "public_all_tarefas" ON tarefas;
-- DROP POLICY IF EXISTS "public_all_anotacoes" ON anotacoes;

-- CREATE POLICY "public_read_disciplinas" ON disciplinas FOR SELECT USING (true);
-- CREATE POLICY "public_read_horarios" ON horarios FOR SELECT USING (true);
-- CREATE POLICY "public_all_tarefas" ON tarefas FOR ALL USING (true);
-- CREATE POLICY "public_all_anotacoes" ON anotacoes FOR ALL USING (true);

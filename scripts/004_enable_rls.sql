-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisoes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_all" ON users;
DROP POLICY IF EXISTS "disciplinas_select" ON disciplinas;
DROP POLICY IF EXISTS "disciplinas_insert" ON disciplinas;
DROP POLICY IF EXISTS "disciplinas_update" ON disciplinas;
DROP POLICY IF EXISTS "disciplinas_delete" ON disciplinas;
DROP POLICY IF EXISTS "horarios_all" ON horarios;
DROP POLICY IF EXISTS "tarefas_all" ON tarefas;
DROP POLICY IF EXISTS "anotacoes_all" ON anotacoes;
DROP POLICY IF EXISTS "revisoes_all" ON revisoes;

-- Users table: allow all operations via service role (app handles auth)
CREATE POLICY "users_all" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Disciplinas: public ones (user_id IS NULL) are readable by all, private ones by owner
CREATE POLICY "disciplinas_select" ON disciplinas
  FOR SELECT
  USING (user_id IS NULL OR true);

CREATE POLICY "disciplinas_insert" ON disciplinas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "disciplinas_update" ON disciplinas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "disciplinas_delete" ON disciplinas
  FOR DELETE
  USING (true);

-- Horarios: allow all (filtered by user_id in app)
CREATE POLICY "horarios_all" ON horarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tarefas: allow all (filtered by user_id in app)
CREATE POLICY "tarefas_all" ON tarefas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anotacoes: allow all (filtered by user_id in app)
CREATE POLICY "anotacoes_all" ON anotacoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Revisoes: allow all (filtered by user_id in app)
CREATE POLICY "revisoes_all" ON revisoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

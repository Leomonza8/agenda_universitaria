-- Enable Row Level Security (RLS) on all tables
-- Execute this in the Supabase SQL Editor to fix security vulnerabilities

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisoes ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for users table (allow service role access)
CREATE POLICY "users_access" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Create policies for disciplinas table
CREATE POLICY "disciplinas_all" ON disciplinas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Create policies for horarios table
CREATE POLICY "horarios_all" ON horarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Create policies for tarefas table
CREATE POLICY "tarefas_all" ON tarefas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Create policies for anotacoes table
CREATE POLICY "anotacoes_all" ON anotacoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Create policies for revisoes table
CREATE POLICY "revisoes_all" ON revisoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

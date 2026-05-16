-- ============================================================
-- MIGRAÇÃO 002 - GYMRATS SQUADS (FASE 27)
-- Novas tabelas para o hub social e de gamificação
-- ============================================================

-- 1. SQUADS (Grupos de Treino)
CREATE TABLE IF NOT EXISTS gym_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES gym_students(id),
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MEMBROS DO SQUAD
CREATE TABLE IF NOT EXISTS gym_squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES gym_squads(id) ON DELETE CASCADE,
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(squad_id, student_id)
);

-- 3. CHECK-INS SOCIAIS E DESAFIOS (Feed Squad)
CREATE TABLE IF NOT EXISTS gym_squad_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES gym_squads(id) ON DELETE CASCADE,
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'check-in', -- 'check-in', 'achievement', 'challenge_start'
    content TEXT,
    photo_url TEXT,
    muscle_group TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DESAFIOS DE SQUAD
CREATE TABLE IF NOT EXISTS gym_squad_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES gym_squads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    rules JSONB, -- Ex: { "point_per_workout": 10, "goal_workouts": 20 }
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LOGS DE PONTUAÇÃO (Gamificação)
CREATE TABLE IF NOT EXISTS gym_squad_score_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES gym_squads(id) ON DELETE CASCADE,
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES gym_squad_challenges(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'consistency', 'intensity', 'time'
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- HABILITANDO RLS E ADICIONANDO POLÍTICAS
-- ============================================================

ALTER TABLE gym_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_squad_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_squad_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_squad_score_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon manage squads" ON gym_squads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage squad members" ON gym_squad_members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage squad posts" ON gym_squad_posts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage squad challenges" ON gym_squad_challenges FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage squad score logs" ON gym_squad_score_logs FOR ALL TO anon USING (true) WITH CHECK (true);

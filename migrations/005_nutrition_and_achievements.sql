-- Migration: Nutrição e Conquistas
-- Criação das tabelas referentes ao IA Coach Nutricional e Sistema de Conquistas (Achievements)

-- 1. Tabela de Nutrição (Macros e Água)
CREATE TABLE IF NOT EXISTS gym_nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    water_ml INTEGER DEFAULT 0,
    protein_g INTEGER DEFAULT 0,
    carbs_g INTEGER DEFAULT 0,
    fats_g INTEGER DEFAULT 0,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, log_date)
);

-- Habilitar RLS para Nutrição
ALTER TABLE gym_nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon manage nutrition logs" ON gym_nutrition_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Tabelas de Conquistas (Achievements)
CREATE TABLE IF NOT EXISTS gym_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    requirement_type TEXT, -- 'workouts_count', 'consecutive_days', 'max_weight'
    requirement_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gym_student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES gym_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, achievement_id)
);

-- Habilitar RLS para Conquistas
ALTER TABLE gym_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read achievements" ON gym_achievements FOR SELECT TO anon USING (true);
CREATE POLICY "Master manage achievements" ON gym_achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE gym_student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon manage student achievements" ON gym_student_achievements FOR ALL TO anon USING (true) WITH CHECK (true);

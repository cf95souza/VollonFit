-- ============================================================
-- ESTRUTURA MESTRE - VOLLONFIT (PRODUÇÃO)
-- Consolidado: Tabelas Base + SaaS + RLS Fix + Web Push
-- ============================================================

-- 0. CONFIGURAÇÕES GLOBAIS
CREATE TABLE IF NOT EXISTS gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO gym_settings (key, value) VALUES ('price_per_student', '30.00') ON CONFLICT (key) DO NOTHING;

-- 1. PROFESSORES (Tenants)
CREATE TABLE IF NOT EXISTS gym_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    quota_limit INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',
    contract_start_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ALUNOS
CREATE TABLE IF NOT EXISTS gym_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER,
    height NUMERIC(3,2),
    initial_weight NUMERIC(5,2),
    goals TEXT,
    partner_id UUID REFERENCES gym_students(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. EXERCÍCIOS
CREATE TABLE IF NOT EXISTS gym_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    gif_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TREINOS (Cabeçalho)
CREATE TABLE IF NOT EXISTS gym_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ITENS DO TREINO
CREATE TABLE IF NOT EXISTS gym_workout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES gym_workouts(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES gym_exercises(id),
    sequence_order INTEGER NOT NULL,
    target_sets INTEGER DEFAULT 3,
    target_reps TEXT DEFAULT '10-12',
    rest_time TEXT DEFAULT '60s',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LOGS DE TREINO
CREATE TABLE IF NOT EXISTS gym_training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES gym_workouts(id),
    exercise_id UUID REFERENCES gym_exercises(id),
    set_number INTEGER NOT NULL,
    reps_done INTEGER NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    workout_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. BIOPEDÂNCIA
CREATE TABLE IF NOT EXISTS gym_biopedance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    weight NUMERIC(5,2) NOT NULL,
    height NUMERIC(3,2),
    bmi NUMERIC(4,2),
    body_fat_pct NUMERIC(4,2),
    muscle_mass_kg NUMERIC(5,2),
    visceral_fat INTEGER,
    body_water_pct NUMERIC(4,2),
    bone_mass_kg NUMERIC(4,2),
    body_age INTEGER,
    tmb INTEGER,
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NOTAS DE EQUIPAMENTO
CREATE TABLE IF NOT EXISTS gym_student_exercise_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES gym_exercises(id) ON DELETE CASCADE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, exercise_id)
);

-- 9. NOTIFICAÇÕES (In-App)
CREATE TABLE IF NOT EXISTS gym_social_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. WEB PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS gym_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. FATURAMENTO
CREATE TABLE IF NOT EXISTS gym_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL,
    student_count INTEGER NOT NULL,
    price_per_student NUMERIC(6,2) NOT NULL,
    total_amount NUMERIC(8,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. FOTOS DE EVOLUÇÃO
CREATE TABLE IF NOT EXISTS gym_evolution_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REGRAS DE SEGURANÇA (RLS) - OTIMIZADO PARA LOGIN CUSTOM
-- ============================================================

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_biopedance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_evolution_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_student_exercise_notes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS MASTER ADMIN (cf95.souza@gmail.com)
CREATE POLICY "Master full access" ON gym_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master teachers" ON gym_teachers FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master students" ON gym_students FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master billing" ON gym_billing_records FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');

-- POLÍTICAS ANON/PUBLIC (Essencial para o app funcionar sem Auth padrão)
CREATE POLICY "Anon manage teachers" ON gym_teachers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage students" ON gym_students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage exercises" ON gym_exercises FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage workouts" ON gym_workouts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage workout items" ON gym_workout_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage training logs" ON gym_training_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage biopedance" ON gym_biopedance_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage notifications" ON gym_social_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage push" ON gym_push_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage photos" ON gym_evolution_photos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage billing" ON gym_billing_records FOR SELECT TO anon USING (true);
CREATE POLICY "Anon manage settings" ON gym_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Anon manage notes" ON gym_student_exercise_notes FOR ALL TO anon USING (true) WITH CHECK (true);


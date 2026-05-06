-- ESTRUTURA DO BANCO DE DADOS - VOLLONFIT (VERSÃO SaaS)

-- ============================================================
-- 0. CONFIGURAÇÕES GLOBAIS DO SISTEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valor padrão: R$ 30,00 por aluno/mês
INSERT INTO gym_settings (key, value) VALUES ('price_per_student', '30.00');

-- ============================================================
-- 1. PROFESSORES (Tenants / Clientes do Sistema)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    quota_limit INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',             -- active, blocked, trial
    contract_start_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ALUNOS (Vinculados a um Professor)
-- ============================================================

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

-- ============================================================
-- 3. BIBLIOTECA DE EXERCÍCIOS (Global — gerenciada pelo Master)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    gif_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. TREINOS (Cabeçalho)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. ITENS DO TREINO
-- ============================================================

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

-- ============================================================
-- 6. LOGS DE TREINO (Registros do Aluno)
-- ============================================================

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

-- ============================================================
-- 7. BIOPEDÂNCIA (Composição Corporal)
-- ============================================================

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

-- ============================================================
-- 8. NOTAS DE EQUIPAMENTO (Por aluno x exercício)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_student_exercise_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES gym_exercises(id) ON DELETE CASCADE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, exercise_id)
);

-- ============================================================
-- 9. NOTIFICAÇÕES SOCIAIS (Parceiro/Casal)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_social_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. FOTOS DE EVOLUÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_evolution_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. COBRANÇAS / FATURAMENTO (Gestão Comercial)
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES gym_teachers(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL,               -- Formato: '2026-05'
    student_count INTEGER NOT NULL,              -- Qtd de alunos na data da cobrança
    price_per_student NUMERIC(6,2) NOT NULL,     -- Preço unitário usado na cobrança
    total_amount NUMERIC(8,2) NOT NULL,          -- student_count × price_per_student
    status TEXT DEFAULT 'pending',               -- pending, paid, overdue
    due_date DATE NOT NULL,                      -- Vencimento calculado a partir de contract_start_date
    paid_at TIMESTAMPTZ,                         -- Data/hora do pagamento registrado
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REGRAS DE SEGURANÇA (RLS)
-- ============================================================

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_billing_records ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para o MASTER ADMIN (cf95.souza@gmail.com)
CREATE POLICY "Master full access settings" ON gym_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master full access" ON gym_teachers FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master access all students" ON gym_students FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');
CREATE POLICY "Master access all billing" ON gym_billing_records FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');

-- 2. Políticas para os PROFESSORES
CREATE POLICY "Teacher own access" ON gym_teachers FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Teacher manage own students" ON gym_students FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher manage own exercises" ON gym_exercises FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher manage own workouts" ON gym_workouts FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- 3. Acesso Público (Alunos) — Login via username/password direto na tabela
CREATE POLICY "Public Student Access" ON gym_students FOR SELECT TO public USING (true);

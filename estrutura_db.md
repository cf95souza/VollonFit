-- ESTRUTURA DO BANCO DE DADOS - CASALGYM
-- Este script cria todas as tabelas necessárias para o projeto.

-- 1. Tabela de Alunos (Autenticação Customizada Mobile)
CREATE TABLE IF NOT EXISTS gym_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER,
    height NUMERIC(3,2), -- Altura (ex: 1.75)
    initial_weight NUMERIC(5,2), -- Peso Inicial
    goals TEXT, -- Metas e foco definidos pelo professor
    partner_id UUID REFERENCES gym_students(id), -- Vínculo com o parceiro(a)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Biblioteca de Exercícios
CREATE TABLE IF NOT EXISTS gym_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Ex: Peito, Pernas, Costas
    description TEXT,
    gif_url TEXT, -- URL para demonstração da execução
    created_by UUID REFERENCES auth.users(id), -- Referência ao Admin (Supabase Auth)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Cabeçalho de Treinos (Rotinas)
CREATE TABLE IF NOT EXISTS gym_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Ex: Treino A - Superior
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Itens do Treino (Vínculo Exercício <-> Treino)
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

-- 5. Tabela de Logs de Treino (Registros Reais na Academia)
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

-- 6. Tabela de Biopedância (Evolução Corporal)
CREATE TABLE IF NOT EXISTS gym_biopedance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    weight NUMERIC(5,2) NOT NULL, -- Peso Total
    height NUMERIC(3,2), -- Altura (ex: 1.75)
    bmi NUMERIC(4,2), -- IMC (Índice de Massa Corporal)
    body_fat_pct NUMERIC(4,2), -- % Gordura
    muscle_mass_kg NUMERIC(5,2), -- Massa Muscular
    visceral_fat INTEGER, -- Nível de Gordura Visceral
    body_water_pct NUMERIC(4,2), -- % Água Corporal
    bone_mass_kg NUMERIC(4,2), -- Massa Óssea (kg)
    body_age INTEGER, -- Idade Corporal
    tmb INTEGER, -- Taxa Metabolismo Basal
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- REGRAS DE SEGURANÇA (RLS - Row Level Security)
-- Habilitar RLS em todas as tabelas
ALTER TABLE gym_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_biopedance_records ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para o Administrador (Supabase Auth)
CREATE POLICY "Admin full access students" ON gym_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access exercises" ON gym_exercises FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access workouts" ON gym_workouts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access items" ON gym_workout_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access logs" ON gym_training_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access bio" ON gym_biopedance_records FOR ALL TO authenticated USING (true);

-- 2. Políticas para os Alunos (Acesso Público Controlado pelo App)
-- Como os alunos não usam Supabase Auth, liberamos acesso público para as operações básicas
CREATE POLICY "Public select students" ON gym_students FOR SELECT TO public USING (true);
CREATE POLICY "Public update students" ON gym_students FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public select exercises" ON gym_exercises FOR SELECT TO public USING (true);
CREATE POLICY "Public select workouts" ON gym_workouts FOR SELECT TO public USING (true);
CREATE POLICY "Public select items" ON gym_workout_items FOR SELECT TO public USING (true);
CREATE POLICY "Public insert logs" ON gym_training_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public select logs" ON gym_training_logs FOR SELECT TO public USING (true);
CREATE POLICY "Public insert bio" ON gym_biopedance_records FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public select bio" ON gym_biopedance_records FOR SELECT TO public USING (true);

-- 3. Tabela de Notas de Exercícios (Ajustes de Máquina/Anotações)
CREATE TABLE IF NOT EXISTS gym_student_exercise_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES gym_exercises(id) ON DELETE CASCADE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, exercise_id)
);

ALTER TABLE gym_student_exercise_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin CRUD Exercise Notes" ON gym_student_exercise_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Public Exercise Notes Access" ON gym_student_exercise_notes FOR ALL TO public USING (true);

-- 7. Tabela de Notificações Sociais (Feed do Casal)
CREATE TABLE IF NOT EXISTS gym_social_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'workout_finished', 'pr_beaten', 'motivation'
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_social_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Social Notifications Access" ON gym_social_notifications FOR ALL TO public USING (true);

-- 8. Tabela de Fotos de Evolução (Check-in Visual)
CREATE TABLE IF NOT EXISTS gym_evolution_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES gym_students(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_evolution_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Evolution Photos Access" ON gym_evolution_photos FOR ALL TO public USING (true);

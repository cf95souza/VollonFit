-- ============================================================
-- MIGRAÇÃO 001: Gestão Comercial SaaS - VollonFit
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO gym_settings (key, value) 
VALUES ('price_per_student', '30.00')
ON CONFLICT (key) DO NOTHING;

-- 2. Novos campos na tabela de Professores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gym_teachers' AND column_name='phone') THEN
        ALTER TABLE gym_teachers ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gym_teachers' AND column_name='contract_start_date') THEN
        ALTER TABLE gym_teachers ADD COLUMN contract_start_date DATE DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gym_teachers' AND column_name='notes') THEN
        ALTER TABLE gym_teachers ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 3. Tabela de Cobranças / Faturamento
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

-- 4. RLS para novas tabelas
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_billing_records ENABLE ROW LEVEL SECURITY;

-- Políticas Master Admin
CREATE POLICY "Master full access settings" ON gym_settings 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');

CREATE POLICY "Master access all billing" ON gym_billing_records 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'cf95.souza@gmail.com');

-- Acesso público de leitura para settings (para o app consultar o preço)
CREATE POLICY "Public read settings" ON gym_settings
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Public read settings auth" ON gym_settings
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- FIM DA MIGRAÇÃO 001
-- ============================================================

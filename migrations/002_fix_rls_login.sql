-- ============================================================
-- MIGRAÇÃO 002: Fix RLS para Login de Professores
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Permitir leitura pública da tabela gym_teachers para o fluxo de login
-- (O professor precisa consultar a tabela antes de estar autenticado)
CREATE POLICY "Public teacher login" ON gym_teachers
    FOR SELECT TO anon
    USING (true);

-- Permitir leitura pública da tabela gym_students (já pode existir, ON CONFLICT ignora)
-- Necessário para login de alunos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'gym_students' AND policyname = 'Public Student Access'
    ) THEN
        CREATE POLICY "Public Student Access" ON gym_students FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- ============================================================
-- FIM DA MIGRAÇÃO 002
-- ============================================================

-- ============================================================
-- MIGRAÇÃO 003: Fix RLS para todas as tabelas do Professor
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- O professor agora faz login via tabela (sem Supabase Auth),
-- então as queries chegam como "anon". Precisamos permitir
-- acesso anon às tabelas que o professor consulta.

-- 1. gym_students - Professor precisa ler/criar/editar alunos
CREATE POLICY "Anon manage students" ON gym_students
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 2. gym_exercises - Professor precisa ler/criar exercícios
CREATE POLICY "Anon manage exercises" ON gym_exercises
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 3. gym_workouts - Professor precisa ler/criar treinos
CREATE POLICY "Anon manage workouts" ON gym_workouts
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 4. gym_workout_items - Professor precisa ler/criar itens de treino
CREATE POLICY "Anon manage workout items" ON gym_workout_items
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 5. gym_training_logs - Aluno precisa registrar séries
CREATE POLICY "Anon manage training logs" ON gym_training_logs
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 6. gym_biopedance_records - Admin registra / aluno visualiza
CREATE POLICY "Anon manage biopedance" ON gym_biopedance_records
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 7. gym_student_exercise_notes - Aluno salva notas de ajuste
CREATE POLICY "Anon manage exercise notes" ON gym_student_exercise_notes
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 8. gym_social_notifications - Notificações entre parceiros
CREATE POLICY "Anon manage notifications" ON gym_social_notifications
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 9. gym_evolution_photos - Fotos de evolução
CREATE POLICY "Anon manage evolution photos" ON gym_evolution_photos
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 10. gym_teachers - Professor precisa UPDATE no próprio registro
CREATE POLICY "Anon update teachers" ON gym_teachers
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

-- 11. gym_billing_records - Leitura anon para consultas
CREATE POLICY "Anon read billing" ON gym_billing_records
    FOR SELECT TO anon
    USING (true);

-- ============================================================
-- FIM DA MIGRAÇÃO 003
-- ============================================================

-- SCRIPT DE RESET DE EXECUÇÕES (VOLLONFIT)
-- Use este script para limpar apenas os logs de treino, mantendo a estrutura do sistema intacta.

-- Limpar logs de séries e repetições
DELETE FROM gym_training_logs;

-- Limpar notificações de feed social (Pings, etc)
DELETE FROM gym_social_notifications;

-- NOTA: Professores, Alunos, Exercícios, Montagem de Treinos e Biopedância são PRESERVADOS.

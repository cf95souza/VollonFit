/**
 * Utilitários de Data para o VollonFit
 * Garante que as datas sejam tratadas corretamente no fuso horário de Brasília (UTC-3)
 */

// Retorna a data de hoje no formato YYYY-MM-DD local
export const getTodayLocally = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - offset).toISOString().split('T')[0];
  return localISOTime;
};

// Formata uma data ISO ou Date para o padrão brasileiro DD/MM/YYYY
export const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Adiciona o offset para evitar que mude o dia ao converter UTC para Local
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + userTimezoneOffset);
  return localDate.toLocaleDateString('pt-BR');
};

// Converte uma string de data do banco para objeto Date local sem perda de dia
export const parseDatabaseDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

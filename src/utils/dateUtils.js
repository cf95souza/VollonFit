/**
 * Utilitários de Data para o VollonFit
 * Garante que as datas sejam tratadas corretamente no fuso horário local (UTC-3),
 * sem deslocamento para UTC após as 21h.
 */

// Retorna a data de hoje no formato YYYY-MM-DD local
export const getTodayLocally = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Retorna a data de N dias atrás no formato YYYY-MM-DD local
export const daysAgoLocally = (days = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Retorna a data do primeiro dia da semana atual (domingo) no formato YYYY-MM-DD local
export const startOfWeekLocally = () => {
  const now = new Date()
  const d = new Date(now)
  d.setDate(now.getDate() - now.getDay())
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Formata uma data ISO ou Date para o padrão brasileiro DD/MM/YYYY
export const formatDateBR = (dateStr) => {
  if (!dateStr) return ''
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

// Converte uma string de data do banco para objeto Date local sem perda de dia
export const parseDatabaseDate = (dateStr) => {
  if (!dateStr) return null
  const clean = dateStr.split('T')[0]
  const [year, month, day] = clean.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

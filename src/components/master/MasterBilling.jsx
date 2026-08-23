import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function MasterBilling({ showToast }) {
  const [records, setRecords] = useState([])
  const [teachers, setTeachers] = useState([])
  const [academies, setAcademies] = useState([])
  const [loading, setLoading] = useState(true)
  const [pricePerStudent, setPricePerStudent] = useState(30)
  const [pricePremium, setPricePremium] = useState(45)
  const [priceEnterprise, setPriceEnterprise] = useState(899)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchAll() }, [selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    const { data: sData } = await supabase.from('gym_settings').select('value').eq('key', 'price_per_student').single()
    if (sData) setPricePerStudent(parseFloat(sData.value))
    
    const { data: pData } = await supabase.from('gym_settings').select('value').eq('key', 'price_premium').single()
    if (pData) setPricePremium(parseFloat(pData.value))

    const { data: eData } = await supabase.from('gym_settings').select('value').eq('key', 'price_enterprise').single()
    if (eData) setPriceEnterprise(parseFloat(eData.value))

    const { data: bData } = await supabase
      .from('gym_billing_records')
      .select('*, gym_teachers(name, email), gym_academies(name)')
      .eq('reference_month', selectedMonth)
      .order('due_date')
    setRecords(bData || [])

    const { data: tData } = await supabase.from('gym_teachers').select('*').eq('status', 'active')
    setTeachers(tData || [])

    const { data: aData } = await supabase.from('gym_academies').select('*')
    setAcademies(aData || [])

    setLoading(false)
  }

  const generateAll = async () => {
    setGenerating(true)
    let count = 0
    
    // 1. Cobranças de Professores
    for (const t of teachers) {
      const existing = records.find(r => r.teacher_id === t.id)
      if (existing) continue

      const { count: stCount } = await supabase.from('gym_students').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id)
      const studentCount = stCount || 0
      if (studentCount === 0) continue

      const price = t.plan_type === 'premium' ? pricePremium : pricePerStudent

      const cd = new Date((t.contract_start_date || new Date().toISOString().split('T00:00:00')) + 'T00:00:00')
      const today = new Date()
      const days = Math.floor((today - cd) / (1000*60*60*24))
      const cycle = Math.floor(days / 30)
      const dueDate = new Date(cd)
      dueDate.setDate(dueDate.getDate() + ((cycle + 1) * 30))

      await supabase.from('gym_billing_records').insert([{
        teacher_id: t.id,
        reference_month: selectedMonth,
        student_count: studentCount,
        price_per_student: price,
        total_amount: studentCount * price,
        status: 'pending',
        due_date: dueDate.toISOString().split('T')[0]
      }])
      count++
    }

    // 2. Cobranças de Academias (B2B)
    for (const acc of academies) {
      const existing = records.find(r => r.academy_id === acc.id)
      if (existing) continue

      const dueDate = new Date()
      dueDate.setDate(10) // Vencimento padrão dia 10 para academias

      await supabase.from('gym_billing_records').insert([{
        academy_id: acc.id,
        reference_month: selectedMonth,
        student_count: 0, // Ignorado para academias
        price_per_student: 0,
        total_amount: acc.monthly_fee || priceEnterprise,
        status: 'pending',
        due_date: dueDate.toISOString().split('T')[0]
      }])
      count++
    }

    showToast(`${count} cobrança(s) gerada(s)!`)
    setGenerating(false)
    fetchAll()
  }

  const markAs = async (id, status) => {
    const update = { status }
    if (status === 'paid') update.paid_at = new Date().toISOString()
    await supabase.from('gym_billing_records').update(update).eq('id', id)
    showToast(status === 'paid' ? 'Marcado como pago!' : 'Marcado como inadimplente')
    fetchAll()
  }

  const summary = {
    total: records.reduce((a, r) => a + Number(r.total_amount), 0),
    paid: records.filter(r => r.status === 'paid').reduce((a, r) => a + Number(r.total_amount), 0),
    pending: records.filter(r => r.status === 'pending').length,
    overdue: records.filter(r => r.status === 'overdue').length,
  }
  const paidPct = summary.total > 0 ? (summary.paid / summary.total) * 100 : 0

  const months = []
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const formatMonth = (m) => {
    const [y, mo] = m.split('-')
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    return `${names[parseInt(mo)-1]} ${y}`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filtro de Mês */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass-panel p-6 rounded-[32px] border border-outline-variant/30">
        <div className="flex gap-2 flex-wrap">
          {months.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              className={`px-4 py-2 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-all ${selectedMonth === m ? 'bg-primary-container text-on-primary-container neon-glow shadow-lg shadow-primary-container/20' : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >{formatMonth(m)}</button>
          ))}
        </div>
        <button onClick={generateAll} disabled={generating}
          className="w-full sm:w-auto bg-primary-container hover:brightness-110 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95 neon-glow disabled:opacity-50 whitespace-nowrap">
          {generating ? 'Gerando...' : 'Gerar Cobranças do Mês'}
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total do Mês</p>
          <p className="font-display-md text-2xl text-on-surface mt-1">R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Recebido</p>
          <p className="font-display-md text-2xl text-primary-container mt-1">R$ {summary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary-container neon-glow transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Pendentes</p>
          <p className="font-display-md text-2xl text-warning mt-1">{summary.pending}</p>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Inadimplentes</p>
          <p className="font-display-md text-2xl text-error mt-1">{summary.overdue}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-panel border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-surface-container-highest/50 border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Professor</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-center">Alunos</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Valor Unit.</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-center">Vencimento</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-on-surface-variant"><span className="material-symbols-outlined w-6 h-6 animate-spin mx-auto block">sync</span></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-on-surface-variant font-body-md text-sm">Nenhuma cobrança para {formatMonth(selectedMonth)}.</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="px-6 py-4">
                    {r.academy_id ? (
                      <>
                        <p className="font-headline-sm text-primary-container text-sm flex items-center gap-1.5 mb-0.5">
                          <span className="material-symbols-outlined text-[14px]">domain</span> {r.gym_academies?.name || 'Academia'}
                        </p>
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">Plano Enterprise</p>
                      </>
                    ) : (
                      <>
                        <p className="font-headline-sm text-on-surface text-sm mb-0.5">{r.gym_teachers?.name || '-'}</p>
                        <p className="font-body-md text-xs text-on-surface-variant">{r.gym_teachers?.email}</p>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-headline-sm text-sm text-on-surface">{r.student_count}</td>
                  <td className="px-6 py-4 text-right font-body-md text-sm text-on-surface-variant">R$ {Number(r.price_per_student).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-display-sm text-sm text-on-surface">R$ {Number(r.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center font-body-md text-sm text-on-surface-variant">{r.due_date ? new Date(r.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-label-caps text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border ${
                      r.status === 'paid' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' :
                      r.status === 'overdue' ? 'bg-error/10 text-error border-error/20' : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {r.status === 'paid' ? 'Pago' : r.status === 'overdue' ? 'Inadimplente' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== 'paid' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => markAs(r.id, 'paid')} className="font-label-caps text-[9px] text-[#4ade80] bg-[#4ade80]/10 hover:bg-[#4ade80]/20 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors border border-[#4ade80]/20">Pago</button>
                        {r.status !== 'overdue' && (
                          <button onClick={() => markAs(r.id, 'overdue')} className="font-label-caps text-[9px] text-error bg-error/10 hover:bg-error/20 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors border border-error/20">Inadimpl.</button>
                        )}
                      </div>
                    )}
                    {r.status === 'paid' && r.paid_at && (
                      <p className="font-body-md text-[10px] text-on-surface-variant mt-2">Pago em {new Date(r.paid_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Receipt, CheckCircle2, AlertCircle, Clock, Search, Filter, X, Loader2 } from 'lucide-react'

export default function MasterBilling({ showToast }) {
  const [records, setRecords] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pricePerStudent, setPricePerStudent] = useState(30)
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

    const { data: bData } = await supabase
      .from('gym_billing_records')
      .select('*, gym_teachers(name, email)')
      .eq('reference_month', selectedMonth)
      .order('due_date')
    setRecords(bData || [])

    const { data: tData } = await supabase.from('gym_teachers').select('*').eq('status', 'active')
    setTeachers(tData || [])
    setLoading(false)
  }

  const generateAll = async () => {
    setGenerating(true)
    const price = pricePerStudent
    let count = 0
    for (const t of teachers) {
      const existing = records.find(r => r.teacher_id === t.id)
      if (existing) continue

      const { count: stCount } = await supabase.from('gym_students').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id)
      const studentCount = stCount || 0
      if (studentCount === 0) continue

      const cd = new Date((t.contract_start_date || new Date().toISOString().split('T')[0]) + 'T00:00:00')
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
    <div className="space-y-4">
      {/* Filtro de Mês */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {months.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${selectedMonth === m ? 'bg-[#DFFF5E] text-black' : 'bg-[#111111] border border-white/10 text-slate-400 hover:bg-white/5'}`}
            >{formatMonth(m)}</button>
          ))}
        </div>
        <button onClick={generateAll} disabled={generating}
          className="bg-[#DFFF5E] hover:bg-[#B8E600] text-black px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50 transition-colors whitespace-nowrap">
          {generating ? 'Gerando...' : 'Gerar Cobranças do Mês'}
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Total do Mês</p>
          <p className="text-xl font-bold text-white">R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Recebido</p>
          <p className="text-xl font-bold text-[#DFFF5E]">R$ {summary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2">
            <div className="h-full bg-[#DFFF5E] rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Pendentes</p>
          <p className="text-xl font-bold text-amber-400">{summary.pending}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Inadimplentes</p>
          <p className="text-xl font-bold text-rose-400">{summary.overdue}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-black/50 border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Professor</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Alunos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Valor Unit.</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Vencimento</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500 text-sm">Nenhuma cobrança para {formatMonth(selectedMonth)}.</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white text-sm">{r.gym_teachers?.name || '-'}</p>
                    <p className="text-xs text-slate-400">{r.gym_teachers?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-300">{r.student_count}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-400">R$ {Number(r.price_per_student).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-white">R$ {Number(r.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-400">{r.due_date ? new Date(r.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {r.status === 'paid' ? 'Pago' : r.status === 'overdue' ? 'Inadimplente' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== 'paid' && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => markAs(r.id, 'paid')} className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors">Pago</button>
                        {r.status !== 'overdue' && (
                          <button onClick={() => markAs(r.id, 'overdue')} className="text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded transition-colors">Inadimpl.</button>
                        )}
                      </div>
                    )}
                    {r.status === 'paid' && r.paid_at && (
                      <p className="text-[10px] text-slate-500 mt-1">Pago em {new Date(r.paid_at).toLocaleDateString('pt-BR')}</p>
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

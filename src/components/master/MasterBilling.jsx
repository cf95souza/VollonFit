import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Users,
  Check,
  X
} from 'lucide-react'
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

    // 2. Cobranças de Academias (B2B)
    for (const acc of academies) {
      const existing = records.find(r => r.academy_id === acc.id)
      if (existing) continue

      const dueDate = new Date()
      dueDate.setDate(10)

      await supabase.from('gym_billing_records').insert([{
        academy_id: acc.id,
        reference_month: selectedMonth,
        student_count: 0,
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
      
      {/* Filtro de Mês e Ações */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {months.map(m => (
            <button 
              key={m} 
              onClick={() => setSelectedMonth(m)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedMonth === m 
                  ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/40' 
                  : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white'
              }`}
            >
              {formatMonth(m)}
            </button>
          ))}
        </div>
        <button 
          onClick={generateAll} 
          disabled={generating}
          className="vollon-btn-primary w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.3)] disabled:opacity-50 whitespace-nowrap"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
          <span>{generating ? 'Processando...' : 'Gerar Cobranças do Mês'}</span>
        </button>
      </div>

      {/* 4 Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="vollon-card rounded-3xl p-5 sm:p-6 space-y-1">
          <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider">Total do Mês</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-white">
            R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="vollon-card rounded-3xl p-5 sm:p-6 space-y-2">
          <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider">Recebido</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-[#FF3B4A]">
            R$ {summary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="w-full h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
            <div className="h-full bg-gradient-to-r from-[#E11D2E] to-[#FF3B4A] transition-all duration-700" style={{ width: `${paidPct}%` }} />
          </div>
        </div>

        <div className="vollon-card rounded-3xl p-5 sm:p-6 space-y-1">
          <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider">Pendentes</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-white">
            {summary.pending}
          </p>
        </div>

        <div className="vollon-card rounded-3xl p-5 sm:p-6 space-y-1">
          <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider">Inadimplentes</p>
          <p className="font-display text-2xl sm:text-3xl font-black text-[#FF3B4A]">
            {summary.overdue}
          </p>
        </div>

      </div>

      {/* Tabela de Faturamento */}
      <div className="vollon-card rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Treinador / Unidade</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Alunos</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-right">Valor Unit.</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Vencimento</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-[#A3A3A3]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-[#A3A3A3] text-xs font-bold uppercase tracking-wider">
                    Nenhuma cobrança registrada para {formatMonth(selectedMonth)}.
                  </td>
                </tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-[#1A1A1A]/40 transition-colors">
                  <td className="px-6 py-4">
                    {r.academy_id ? (
                      <div>
                        <p className="font-bold text-sm text-[#FF3B4A] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> {r.gym_academies?.name || 'Academia B2B'}
                        </p>
                        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase">Plano Enterprise</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-sm text-white">{r.gym_teachers?.name || '—'}</p>
                        <p className="text-xs text-[#A3A3A3]">{r.gym_teachers?.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-display text-base font-black text-white">
                    {r.student_count}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-[#A3A3A3] font-semibold">
                    R$ {Number(r.price_per_student).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-display text-base font-black text-white">
                    R$ {Number(r.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-[#A3A3A3] font-medium">
                    {r.due_date ? new Date(r.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      r.status === 'paid' ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border-[#E11D2E]/30' :
                      r.status === 'overdue' ? 'bg-[#2A2A2A] text-white border-[#3A3A3A]' : 
                      'bg-white/10 text-white border-white/20'
                    }`}>
                      {r.status === 'paid' ? 'Pago' : r.status === 'overdue' ? 'Inadimplente' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== 'paid' && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => markAs(r.id, 'paid')} 
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 hover:bg-[#E11D2E]/25 transition-colors cursor-pointer"
                        >
                          Pago
                        </button>
                        {r.status !== 'overdue' && (
                          <button 
                            onClick={() => markAs(r.id, 'overdue')} 
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white transition-colors cursor-pointer"
                          >
                            Inadimpl.
                          </button>
                        )}
                      </div>
                    )}
                    {r.status === 'paid' && r.paid_at && (
                      <p className="text-[10px] text-[#A3A3A3]">
                        Pago em {new Date(r.paid_at).toLocaleDateString('pt-BR')}
                      </p>
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

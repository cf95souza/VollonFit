import React, { useState, useEffect } from 'react'
import { AlertCircle, CreditCard, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function FinanceiroTab({ teacherInfo }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, paid: 0, total: 0 })

  const fetchBills = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('gym_billing_records')
      .select('*')
      .eq('teacher_id', teacherInfo.id)
      .order('reference_month', { ascending: false })
    
    if (data) {
      setBills(data)
      const pending = data.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + Number(b.total_amount), 0)
      const paid = data.filter(b => b.status === 'paid').reduce((acc, b) => acc + Number(b.total_amount), 0)
      setStats({ pending, paid, total: pending + paid })
    }
    setLoading(false)
  }

  const handleCheckout = () => {
    alert("Redirecionando para o Gateway de Pagamento (Mock Stripe)...")
    // Simulando sucesso imediato
    supabase.from('gym_subscriptions').update({ status: 'active' }).eq('id', teacherInfo.subscription?.id).then(() => {
      window.location.reload()
    })
  }

  useEffect(() => {
    fetchBills()
  }, [teacherInfo?.id])

  const subscription = teacherInfo?.subscription
  const isTrial = subscription?.status === 'trialing'
  const isPastDue = subscription?.status === 'past_due' || subscription?.status === 'canceled'
  const isActive = subscription?.status === 'active'

  const trialDaysLeft = isTrial ? Math.max(0, Math.ceil((new Date(subscription.current_period_end) - new Date()) / (1000 * 60 * 60 * 24))) : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Bloco de Assinatura (SaaS Pro) */}
      <div className={`p-8 rounded-[40px] border shadow-2xl ${
        isPastDue ? 'bg-rose-500/10 border-rose-500/30' :
        isTrial ? 'bg-amber-500/10 border-amber-500/30' :
        'bg-primary/10 border-primary/30'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${
              isPastDue ? 'bg-rose-500 text-white' :
              isTrial ? 'bg-amber-500 text-black' :
              'bg-primary text-black'
            }`}>
              {isPastDue ? <Lock className="w-8 h-8" /> : isTrial ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-400">Status da Conta</p>
              <h2 className={`text-3xl font-black font-display uppercase tracking-tighter ${
                isPastDue ? 'text-rose-400' : isTrial ? 'text-amber-400' : 'text-primary'
              }`}>
                {isPastDue ? 'Acesso Bloqueado' : isTrial ? 'Período de Teste' : 'Pro Ativo'}
              </h2>
              {isTrial && <p className="text-sm font-bold text-slate-300 mt-1">Você tem <span className="text-amber-400 font-black">{trialDaysLeft} dias restantes</span> no seu trial gratuito.</p>}
              {isPastDue && <p className="text-sm font-bold text-slate-300 mt-1">Seu período de testes acabou ou há faturas pendentes.</p>}
              {isActive && <p className="text-sm font-bold text-slate-300 mt-1">Sua conta está totalmente operacional.</p>}
            </div>
          </div>
          
          {(isTrial || isPastDue) && (
            <button 
              onClick={handleCheckout}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
                isPastDue ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' : 'bg-primary hover:bg-primary-dark text-black shadow-primary/20'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              {isPastDue ? 'Desbloquear Agora' : 'Assinar Plano Pro'}
            </button>
          )}
        </div>
      </div>

      <div className={`transition-all duration-500 ${isPastDue ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Pendente</p>
          <h3 className="text-3xl font-black text-rose-400 font-display">R$ {stats.pending.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Pago</p>
          <h3 className="text-3xl font-black text-emerald-400 font-display">R$ {stats.paid.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Preço por Aluno</p>
          <h3 className="text-3xl font-black text-white font-display">R$ 30,00</h3>
        </div>
      </div>

      <section className="bg-[#111111] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white">Histórico de Faturas</h3>
          <p className="text-xs text-slate-400">Cobranças mensais baseadas na quantidade de alunos ativos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Mês Referência</th>
                <th className="px-6 py-4">Qtd Alunos</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2].map(i => <tr key={i} className="animate-pulse h-16 bg-white/5" />)
              ) : bills.map(bill => (
                <tr key={bill.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-bold text-white">{bill.reference_month}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">{bill.student_count} alunos</td>
                  <td className="px-6 py-5 font-black text-white font-display">R$ {Number(bill.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-5 text-xs text-slate-400">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      bill.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      bill.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-500 mb-1">Informação sobre Pagamentos</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            As faturas são geradas automaticamente todo dia 01 com base no número de alunos ativos (R$ 30 por aluno). 
            Para realizar o pagamento ou contestar valores, acesse a área de pagamento seguro.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
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
      <div className={`p-8 rounded-[40px] border shadow-2xl glass-panel ${
        isPastDue ? 'bg-error/10 border-error/30' :
        isTrial ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' :
        'bg-primary-container/10 border-primary-container/30'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${
              isPastDue ? 'bg-error text-on-error' :
              isTrial ? 'bg-[#f59e0b] text-black' :
              'bg-primary-container text-on-primary-container'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {isPastDue ? 'lock' : isTrial ? 'warning' : 'check_circle'}
              </span>
            </div>
            <div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest mb-1 text-on-surface-variant">Status da Conta</p>
              <h2 className={`font-display-lg text-3xl uppercase tracking-tighter ${
                isPastDue ? 'text-error' : isTrial ? 'text-[#f59e0b]' : 'text-primary-container'
              }`}>
                {isPastDue ? 'Acesso Bloqueado' : isTrial ? 'Período de Teste' : 'Pro Ativo'}
              </h2>
              {isTrial && <p className="font-body-md text-sm text-on-surface-variant mt-1">Você tem <span className="text-[#f59e0b] font-bold">{trialDaysLeft} dias restantes</span> no seu trial gratuito.</p>}
              {isPastDue && <p className="font-body-md text-sm text-on-surface-variant mt-1">Seu período de testes acabou ou há faturas pendentes.</p>}
              {isActive && <p className="font-body-md text-sm text-on-surface-variant mt-1">Sua conta está totalmente operacional.</p>}
            </div>
          </div>
          
          {(isTrial || isPastDue) && (
            <button 
              onClick={handleCheckout}
              className={`px-8 py-4 rounded-2xl font-label-caps uppercase tracking-widest text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
                isPastDue ? 'bg-error hover:brightness-110 text-on-error shadow-error/20' : 'bg-primary-container hover:brightness-110 text-on-primary-container shadow-primary-container/20 neon-glow'
              }`}
            >
              <span className="material-symbols-outlined text-lg">credit_card</span>
              {isPastDue ? 'Desbloquear Agora' : 'Assinar Plano Pro'}
            </button>
          )}
        </div>
      </div>

      <div className={`transition-all duration-500 ${isPastDue ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <p className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Total Pendente</p>
          <h3 className="font-display-lg text-3xl text-error">R$ {stats.pending.toFixed(2)}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <p className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Total Pago</p>
          <h3 className="font-display-lg text-3xl text-[#4ade80]">R$ {stats.paid.toFixed(2)}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <p className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Preço por Aluno</p>
          <h3 className="font-display-lg text-3xl text-on-surface">R$ 30,00</h3>
        </div>
      </div>

      <section className="glass-panel rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30">
          <h3 className="font-headline-lg text-on-surface">Histórico de Faturas</h3>
          <p className="font-body-md text-xs text-on-surface-variant">Cobranças mensais baseadas na quantidade de alunos ativos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4">Mês Referência</th>
                <th className="px-6 py-4">Qtd Alunos</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                [1, 2].map(i => <tr key={i} className="animate-pulse h-16 bg-surface-container/50" />)
              ) : bills.map(bill => (
                <tr key={bill.id} className="hover:bg-surface-container transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-headline-md text-on-surface">{bill.reference_month}</span>
                  </td>
                  <td className="px-6 py-5 font-body-md text-sm text-on-surface-variant">{bill.student_count} alunos</td>
                  <td className="px-6 py-5 font-display-md text-on-surface">R$ {Number(bill.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-5 font-body-md text-xs text-on-surface-variant">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full font-label-caps text-[10px] uppercase tracking-widest border ${
                      bill.status === 'paid' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' : 
                      bill.status === 'overdue' ? 'bg-error/10 text-error border-error/20' :
                      'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
                    }`}>
                      {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-on-surface-variant font-body-md italic">
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <div className="glass-panel border-[#f59e0b]/30 p-6 rounded-3xl flex gap-4 bg-[#f59e0b]/5 mt-8">
        <span className="material-symbols-outlined text-[#f59e0b] shrink-0 text-3xl">info</span>
        <div>
          <p className="font-headline-md text-sm text-[#f59e0b] mb-1">Informação sobre Pagamentos</p>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            As faturas são geradas automaticamente todo dia 01 com base no número de alunos ativos (R$ 30 por aluno). 
            Para realizar o pagamento ou contestar valores, acesse a área de pagamento seguro.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

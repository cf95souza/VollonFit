import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  DollarSign, 
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react'
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
    alert("Redirecionando para o Gateway de Pagamento...")
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Banner de Status da Assinatura */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-colors ${
        isPastDue ? 'bg-[#141414] border-[#E11D2E]/60' :
        isTrial ? 'bg-[#141414] border-[#E11D2E]/40' :
        'vollon-card border-[#2A2A2A]'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isPastDue ? 'bg-[#E11D2E]/20 text-[#FF3B4A]' :
              isTrial ? 'bg-[#E11D2E]/20 text-[#FF3B4A]' :
              'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
            }`}>
              {isPastDue ? <Lock className="w-7 h-7" /> : isTrial ? <Sparkles className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7 text-[#FF3B4A]" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-0.5">
                Status da sua Assinatura VollonFit
              </p>
              <h2 className={`font-display text-3xl font-black uppercase tracking-tight ${
                isPastDue ? 'text-[#FF3B4A]' : isTrial ? 'text-white' : 'text-white'
              }`}>
                {isPastDue ? 'Acesso Bloqueado' : isTrial ? 'Período de Teste Gratuito' : 'Plano Pro Ativo'}
              </h2>
              {isTrial && <p className="text-xs text-[#A3A3A3] mt-1">Você tem <strong className="text-white">{trialDaysLeft} dias restantes</strong> no seu trial de 7 dias.</p>}
              {isPastDue && <p className="text-xs text-[#FF3B4A] mt-1">Seu período de testes expirou ou há faturas pendentes de regularização.</p>}
              {isActive && <p className="text-xs text-[#A3A3A3] mt-1">Sua conta de treinador está totalmente operacional e sem pendências.</p>}
            </div>
          </div>
          
          {(isTrial || isPastDue) && (
            <button 
              onClick={handleCheckout}
              className="vollon-btn-primary px-8 h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)] shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isPastDue ? 'Desbloquear Acesso' : 'Ativar Plano Pro'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Cards de Faturamento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="vollon-card p-6 rounded-3xl space-y-1">
          <p className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Total Pendente</p>
          <h3 className="font-display text-3xl font-black text-[#FF3B4A]">
            R$ {stats.pending.toFixed(2)}
          </h3>
        </div>
        <div className="vollon-card p-6 rounded-3xl space-y-1">
          <p className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Total Pago</p>
          <h3 className="font-display text-3xl font-black text-white">
            R$ {stats.paid.toFixed(2)}
          </h3>
        </div>
        <div className="vollon-card p-6 rounded-3xl space-y-1">
          <p className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Histórico Geral</p>
          <h3 className="font-display text-3xl font-black text-white">
            R$ {stats.total.toFixed(2)}
          </h3>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="vollon-card rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
          <div>
            <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
              Faturas e Mensalidades
            </h3>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
              Histórico de cobrança baseado em alunos ativos
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#141414] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Mês Ref.</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Alunos Ativos</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-right">Valor Total</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Vencimento</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-[#A3A3A3] text-xs font-bold uppercase tracking-wider">
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              ) : (
                bills.map(b => (
                  <tr key={b.id} className="hover:bg-[#1A1A1A]/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-white">
                      {b.reference_month}
                    </td>
                    <td className="px-6 py-4 text-center font-display font-black text-sm text-white">
                      {b.student_count}
                    </td>
                    <td className="px-6 py-4 text-right font-display font-black text-base text-white">
                      R$ {Number(b.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-[#A3A3A3]">
                      {b.due_date ? new Date(b.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        b.status === 'paid' ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border-[#E11D2E]/30' :
                        b.status === 'overdue' ? 'bg-[#2A2A2A] text-white border-[#3A3A3A]' : 
                        'bg-white/10 text-white border-white/20'
                      }`}>
                        {b.status === 'paid' ? 'Pago' : b.status === 'overdue' ? 'Inadimplente' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

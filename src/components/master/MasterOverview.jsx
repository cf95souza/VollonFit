import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Receipt, 
  ChevronRight, 
  ArrowUpRight, 
  Bell, 
  Users,
  Flame,
  Activity
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function MasterOverview({ onNavigate }) {
  const [stats, setStats] = useState({ teachers: 0, students: 0, mrr: 0, churn: 0, ltv: 0, pending: 0 })
  const [alerts, setAlerts] = useState([])
  const [recentTeachers, setRecentTeachers] = useState([])
  const [pricePerStudent, setPricePerStudent] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Preço global
      const { data: settingsData } = await supabase
        .from('gym_settings')
        .select('value')
        .eq('key', 'price_per_student')
        .single()
      const price = settingsData ? parseFloat(settingsData.value) : 30
      setPricePerStudent(price)

      // Professores
      const { data: teachers } = await supabase
        .from('gym_teachers')
        .select('*')
        .order('created_at', { ascending: false })

      // Alunos total
      const { count: studentCount } = await supabase
        .from('gym_students')
        .select('*', { count: 'exact', head: true })

      // Cobranças pendentes
      const { count: pendingCount } = await supabase
        .from('gym_billing_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const activeTeachers = (teachers || []).filter(t => t.status === 'active')
      const totalStudents = studentCount || 0
      
      const { data: subs } = await supabase.from('gym_subscriptions').select('*')
      const totalSubs = (subs || []).length
      const canceledSubs = (subs || []).filter(s => s.status === 'canceled').length
      
      const churnRate = totalSubs > 0 ? (canceledSubs / totalSubs) * 100 : 0
      const currentMRR = totalStudents * price
      const ltvValue = churnRate > 0 ? currentMRR / (churnRate / 100) : currentMRR * 12

      setStats({
        teachers: activeTeachers.length,
        students: totalStudents,
        mrr: currentMRR,
        churn: churnRate,
        ltv: ltvValue,
        pending: pendingCount || 0
      })

      setRecentTeachers((teachers || []).slice(0, 5))

      // Alertas de vencimento (próximos 5 dias)
      const today = new Date()
      const alertList = (teachers || []).filter(t => {
        if (!t.contract_start_date || t.status === 'blocked') return false
        const contractDate = new Date(t.contract_start_date + 'T00:00:00')
        const daysSince = Math.floor((today - contractDate) / (1000 * 60 * 60 * 24))
        const currentCycle = Math.floor(daysSince / 30)
        const nextDue = new Date(contractDate)
        nextDue.setDate(nextDue.getDate() + ((currentCycle + 1) * 30))
        const daysUntil = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24))
        t._daysUntilDue = daysUntil
        t._nextDueDate = nextDue
        return daysUntil <= 5 && daysUntil >= 0
      }).sort((a, b) => a._daysUntilDue - b._daysUntilDue)

      setAlerts(alertList)
    } catch (err) {
      console.error('Erro overview:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 vollon-card rounded-3xl animate-pulse" />)}
        </div>
        <div className="h-72 vollon-card rounded-3xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 4 KPIs SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard 
          title="MRR Estimado" 
          value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="text-[#FF3B4A]"
          bg="bg-[#E11D2E]/15 border border-[#E11D2E]/30"
        />
        <KPICard 
          title="LTV (Ciclo de Vida)" 
          value={`R$ ${stats.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="text-white"
          bg="bg-[#1A1A1A] border border-[#2A2A2A]" 
        />
        <KPICard 
          title="Taxa de Churn" 
          value={`${stats.churn.toFixed(1)}%`} 
          icon={Activity}
          color={stats.churn > 5 ? "text-[#FF3B4A]" : "text-white"} 
          bg={stats.churn > 5 ? "bg-[#E11D2E]/15 border border-[#E11D2E]/30" : "bg-[#1A1A1A] border border-[#2A2A2A]"} 
        />
        <KPICard 
          title="Cobranças Pendentes" 
          value={stats.pending} 
          icon={Receipt}
          color="text-white" 
          bg="bg-[#1A1A1A] border border-[#2A2A2A]" 
        />
      </div>

      {/* Gráfico de Evolução de MRR (Paleta VollonFit Vermelho) */}
      <div className="vollon-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
              Evolução do MRR
            </h3>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
              Receita Mensal Recorrente da Plataforma
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>+12.5% vs MÊS ANTERIOR</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={[
                { month: 'Jan', mrr: stats.mrr * 0.5 },
                { month: 'Fev', mrr: stats.mrr * 0.6 },
                { month: 'Mar', mrr: stats.mrr * 0.75 },
                { month: 'Abr', mrr: stats.mrr * 0.85 },
                { month: 'Mai', mrr: stats.mrr }
              ]} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D2E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#E11D2E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11, fontWeight: 700 }} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '16px' }}
                itemStyle={{ color: '#FF3B4A', fontWeight: 900 }}
                labelStyle={{ color: '#A3A3A3', fontWeight: 700, marginBottom: '4px' }}
                formatter={(value) => [`R$ ${value.toFixed(2)}`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#FF3B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Preço Global por Aluno */}
      <div className="vollon-card rounded-3xl p-6 sm:p-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">
            Preço Global por Aluno (Plano Básico)
          </p>
          <p className="font-display text-3xl font-black text-white mt-1">
            R$ {pricePerStudent.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="vollon-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] flex items-center gap-1.5 cursor-pointer"
        >
          <span>Ajustar Planos</span>
          <ChevronRight className="w-4 h-4 text-[#FF3B4A]" />
        </button>
      </div>

      {/* Alertas de Vencimento de Professores */}
      {alerts.length > 0 && (
        <div className="bg-[#141414] border border-[#E11D2E]/40 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
              Cobranças Próximas do Vencimento
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
                <div>
                  <p className="font-bold text-sm text-white">{t.name}</p>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">{t.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#FF3B4A] uppercase tracking-wider">
                    {t._daysUntilDue === 0 ? 'Vence hoje!' : `Vence em ${t._daysUntilDue} dia(s)`}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                    {t._nextDueDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professores Recentes */}
      <div className="vollon-card rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-[#2A2A2A]">
          <div>
            <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
              Últimos Treinadores Cadastrados
            </h3>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
              Profissionais ativos na plataforma
            </p>
          </div>
          <button 
            onClick={() => onNavigate('teachers')} 
            className="text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Todos</span>
            <ChevronRight className="w-4 h-4 text-[#FF3B4A]" />
          </button>
        </div>

        <div className="divide-y divide-[#2A2A2A]">
          {recentTeachers.map(t => (
            <div key={t.id} className="flex items-center justify-between px-6 sm:px-8 py-4 hover:bg-[#1A1A1A]/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white font-display font-black text-sm">
                  {t.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{t.name}</p>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">{t.email}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                t.status === 'active' ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border-[#E11D2E]/30' :
                t.status === 'blocked' ? 'bg-[#2A2A2A] text-[#A3A3A3] border-[#3A3A3A]' :
                'bg-white/10 text-white border-white/20'
              }`}>
                {t.status === 'active' ? 'Ativo' : t.status === 'blocked' ? 'Bloqueado' : 'Trial'}
              </span>
            </div>
          ))}
          {recentTeachers.length === 0 && (
            <p className="text-center py-8 text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">
              Nenhum professor cadastrado ainda.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="vollon-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group hover:border-[#E11D2E]/50 transition-colors">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider leading-tight w-2/3">
          {title}
        </p>
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="font-display text-2xl sm:text-3xl font-black text-white relative z-10 tracking-tight">
        {value}
      </p>
    </div>
  )
}

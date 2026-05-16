import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Users2, Dumbbell, Receipt, TrendingUp, AlertTriangle, Bell, ChevronRight, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
      const currentMRR = totalStudents * price // Simplificado para fins do SaaS
      const ltvValue = churnRate > 0 ? currentMRR / (churnRate / 100) : currentMRR * 12 // LTV Estimado

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
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[#111111] rounded-lg animate-pulse border border-white/5" />)}
        </div>
        <div className="h-48 bg-[#111111] rounded-lg animate-pulse border border-white/5" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SaaS KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="MRR Estimado" 
          value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp} color="text-primary" bg="bg-primary/10"
        />
        <KPICard 
          title="LTV (Ciclo de Vida)" 
          value={`R$ ${stats.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10" 
        />
        <KPICard 
          title="Churn Rate" 
          value={`${stats.churn.toFixed(1)}%`} 
          icon={Activity} color={stats.churn > 5 ? "text-rose-400" : "text-sky-400"} bg={stats.churn > 5 ? "bg-rose-500/10" : "bg-sky-500/10"} 
        />
        <KPICard title="Cobranças Pendentes" value={stats.pending} icon={Receipt} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* Gráfico de Evolução de MRR (Simulado) */}
      <div className="bg-[#111111] rounded-[32px] border border-white/5 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">Evolução do MRR</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Crescimento da Receita Recorrente</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-black">
            <ArrowUpRight className="w-4 h-4" /> +12.5%
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { month: 'Jan', mrr: stats.mrr * 0.5 },
              { month: 'Fev', mrr: stats.mrr * 0.6 },
              { month: 'Mar', mrr: stats.mrr * 0.75 },
              { month: 'Abr', mrr: stats.mrr * 0.85 },
              { month: 'Mai', mrr: stats.mrr }
            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFFF5E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#DFFF5E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff1a', borderRadius: '16px' }}
                itemStyle={{ color: '#DFFF5E', fontWeight: 900 }}
                labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}
                formatter={(value) => [`R$ ${value.toFixed(2)}`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#DFFF5E" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Preço global */}
      <div className="bg-[#111111] rounded-lg border border-white/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço Global por Aluno</p>
          <p className="text-2xl font-bold text-white">R$ {pricePerStudent.toFixed(2)}</p>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
        >
          Alterar <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Alertas de Vencimento */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-amber-400 text-sm">Cobranças Próximas do Vencimento</h3>
          </div>
          <div className="space-y-2">
            {alerts.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-black/50 rounded-md p-3 border border-amber-500/10">
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">
                    {t._daysUntilDue === 0 ? 'Vence hoje!' : `Vence em ${t._daysUntilDue} dia(s)`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t._nextDueDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professores Recentes */}
      <div className="bg-[#111111] rounded-lg border border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Últimos Professores</h3>
          <button onClick={() => onNavigate('teachers')} className="text-xs font-semibold text-[#C6C4FF] hover:text-white">
            Ver todos →
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {recentTeachers.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                  {t.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.email}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                t.status === 'blocked' ? 'bg-rose-500/10 text-rose-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {t.status === 'active' ? 'Ativo' : t.status === 'blocked' ? 'Bloqueado' : 'Trial'}
              </span>
            </div>
          ))}
          {recentTeachers.length === 0 && (
            <p className="text-center py-8 text-slate-500 text-sm">Nenhum professor cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-[#111111] rounded-lg border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
        <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

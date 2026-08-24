import { useState, useEffect } from 'react'
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
          {[1,2,3,4].map(i => <div key={i} className="h-28 glass-panel border border-outline-variant/30 rounded-3xl animate-pulse" />)}
        </div>
        <div className="h-48 glass-panel border border-outline-variant/30 rounded-[32px] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* SaaS KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="MRR Estimado" 
          value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="trending_up" color="text-primary" bg="bg-primary/10"
        />
        <KPICard 
          title="LTV (Ciclo de Vida)" 
          value={`R$ ${stats.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="attach_money" color="text-[#4ade80]" bg="bg-[#4ade80]/10" 
        />
        <KPICard 
          title="Churn Rate" 
          value={`${stats.churn.toFixed(1)}%`} 
          icon="monitoring" color={stats.churn > 5 ? "text-error" : "text-[#4ade80]"} bg={stats.churn > 5 ? "bg-error/10" : "bg-[#4ade80]/10"} 
        />
        <KPICard title="Cobranças Pendentes" value={stats.pending} icon="receipt_long" color="text-on-surface" bg="bg-white/10" />
      </div>

      {/* Gráfico de Evolução de MRR (Simulado) */}
      <div className="bg-[#15171a] rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-display-md text-xl text-on-surface uppercase tracking-tight font-bold">Evolução do MRR</h3>
            <p className="font-label-caps text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Crescimento da Receita Recorrente</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 px-3 py-1.5 rounded-full text-[10px] font-label-caps tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm font-bold">arrow_outward</span> +12.5%
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
      <div className="bg-[#15171a] rounded-3xl p-8 flex items-center justify-between">
        <div>
          <p className="font-label-caps text-[10px] text-[#64748b] uppercase tracking-widest">Preço Global por Aluno</p>
          <p className="font-display-lg font-bold text-2xl text-on-surface mt-2">R$ {pricePerStudent.toFixed(2)}</p>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="font-label-caps text-[10px] text-primary hover:brightness-110 flex items-center gap-1 transition-all tracking-widest uppercase"
        >
          Alterar <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>

      {/* Alertas de Vencimento */}
      {alerts.length > 0 && (
        <div className="glass-panel bg-warning/10 border border-warning/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-warning text-xl">notifications</span>
            <h3 className="font-headline-md text-warning text-sm">Cobranças Próximas do Vencimento</h3>
          </div>
          <div className="space-y-2">
            {alerts.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-surface/50 rounded-2xl p-4 border border-warning/10">
                <div>
                  <p className="font-headline-sm text-on-surface text-sm">{t.name}</p>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{t.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-label-caps text-xs text-warning uppercase tracking-widest mb-1">
                    {t._daysUntilDue === 0 ? 'Vence hoje!' : `Vence em ${t._daysUntilDue} dia(s)`}
                  </p>
                  <p className="font-body-md text-xs text-on-surface-variant">
                    {t._nextDueDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professores Recentes */}
      <div className="bg-[#15171a] rounded-3xl overflow-hidden">
        <div className="p-8 pb-4 flex items-center justify-between">
          <h3 className="font-display-md text-on-surface text-sm uppercase font-bold">Últimos Professores</h3>
          <button onClick={() => onNavigate('teachers')} className="font-label-caps text-[10px] text-[#64748b] hover:text-on-surface transition-all tracking-widest uppercase flex items-center gap-1">
            Ver todos <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
          </button>
        </div>
        <div className="flex flex-col">
          {recentTeachers.map(t => (
            <div key={t.id} className="flex items-center justify-between px-8 py-5 hover:bg-white/5 transition-colors border-t border-white/5 first:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-headline-sm text-xs">
                  {t.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-display-md text-on-surface text-sm font-bold">{t.name}</p>
                  <p className="font-body-md text-xs text-[#64748b] mt-0.5">{t.email}</p>
                </div>
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${
                t.status === 'active' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30' :
                t.status === 'blocked' ? 'bg-error/10 text-error border-error/30' :
                'bg-warning/10 text-warning border-warning/30'
              }`}>
                {t.status === 'active' ? 'Ativo' : t.status === 'blocked' ? 'Bloqueado' : 'Trial'}
              </span>
            </div>
          ))}
          {recentTeachers.length === 0 && (
            <p className="text-center py-8 font-body-md text-on-surface-variant text-sm">Nenhum professor cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon, color, bg }) {
  return (
    <div className="bg-[#15171a] rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between mb-8 relative z-10">
        <p className="font-label-caps text-[#64748b] text-[10px] uppercase tracking-widest leading-tight w-2/3">{title}</p>
        <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined text-lg ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>
      <p className="font-display-lg text-2xl text-on-surface font-bold relative z-10">{value}</p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../supabaseClient'

export default function SquadLeaderboard({ squadId, studentId }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('weekly') // 'weekly' ou 'monthly'

  useEffect(() => {
    if (!squadId) return

    const fetchLeaderboard = async () => {
      setIsLoading(true)
      try {
        // Obter data conforme o filtro
        const now = new Date()
        const days = timeRange === 'weekly' ? 7 : 30
        const pastDate = new Date(now)
        pastDate.setDate(now.getDate() - days)
        const dateStr = pastDate.toISOString().split('T')[0]

        // Buscar membros do squad
        const { data: members } = await supabase
          .from('gym_squad_members')
          .select('student_id, gym_students(name, username)')
          .eq('squad_id', squadId)

        if (!members) return

        // Buscar logs de pontuação (Ranking dos últimos 7 dias)
        const studentIds = members.map(m => m.student_id)
        const { data: scoreLogs, error: scoreError } = await supabase
          .from('gym_squad_score_logs')
          .select('student_id, points, created_at')
          .in('student_id', studentIds)
          .gte('created_at', dateStr)

        if (scoreError) console.error("Erro na busca de pontos:", scoreError)
        
        const scoresArray = scoreLogs || []
        console.log(`Pontos encontrados para o Squad (${squadId}):`, scoresArray.length)

        // Calcular pontos por aluno
        const scoreMap = {}
        scoresArray.forEach(log => {
          if (!scoreMap[log.student_id]) scoreMap[log.student_id] = 0
          scoreMap[log.student_id] += log.points
        })

        // Formatar e ordenar
        const ranking = members.map(m => ({
          id: m.student_id,
          name: m.gym_students?.name,
          username: m.gym_students?.username,
          points: scoreMap[m.student_id] || 0
        })).sort((a, b) => b.points - a.points)

        setLeaderboard(ranking)
      } catch (err) {
        console.error("Erro ao carregar ranking", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [squadId, timeRange])

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-surface-container-highest rounded-3xl"></div>
  }

  if (leaderboard.length === 0) return null

  return (
    <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h3 className="font-display-lg text-on-surface text-lg tracking-tight">Ranking</h3>
           <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30">
             <button 
               onClick={() => setTimeRange('weekly')}
               className={`px-3 py-1 rounded-lg font-label-caps text-[10px] uppercase transition-all ${timeRange === 'weekly' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               7D
             </button>
             <button 
               onClick={() => setTimeRange('monthly')}
               className={`px-3 py-1 rounded-lg font-label-caps text-[10px] uppercase transition-all ${timeRange === 'monthly' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               30D
             </button>
           </div>
        </div>
        <span className="font-label-caps text-[9px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary-container/20">Pontos Reais</span>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user, index) => (
          <div key={user.id} className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-outline-variant/30 relative overflow-hidden group">
            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-primary-container shadow-[0_0_10px_rgba(195,244,0,0.5)]"></div>}
            
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {index === 0 ? <span className="material-symbols-outlined text-2xl text-primary-container drop-shadow-[0_0_5px_rgba(195,244,0,0.5)]">military_tech</span> : 
               index === 1 ? <span className="material-symbols-outlined text-2xl text-slate-300">military_tech</span> : 
               index === 2 ? <span className="material-symbols-outlined text-2xl text-amber-600">military_tech</span> : 
               <span className="font-headline-lg text-on-surface-variant text-sm">{index + 1}º</span>}
            </div>
            
            <div className="flex-1">
              <p className={`font-headline-md text-sm ${index === 0 ? 'text-primary-container' : 'text-on-surface'}`}>{user.name}</p>
              <p className="font-body-md text-[10px] text-on-surface-variant">@{user.username}</p>
            </div>

            <div className="text-right">
              <p className="font-display-lg text-on-surface text-lg tracking-tight">{user.points}</p>
              <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest -mt-1">pontos ganhos</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico Desempenho Coletivo */}
      {leaderboard.length > 1 && (() => {
        const myPoints = leaderboard.find(u => u.id === studentId)?.points || 0;
        const others = leaderboard.filter(u => u.id !== studentId);
        const othersPoints = others.reduce((acc, u) => acc + u.points, 0);
        const avgOthersPoints = others.length > 0 ? Math.round(othersPoints / others.length) : 0;

        const themeColor = localStorage.getItem('vollonfit_theme_color') || '#C3F400';
        const chartData = [
          { name: 'Você', points: myPoints, fill: themeColor }, 
          { name: 'Média', points: avgOthersPoints, fill: '#334155' }
        ]

        return (
          <div className="pt-6 border-t border-outline-variant/30">
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mb-4 text-center">Sua Pontuação vs Bando ({timeRange === 'weekly' ? '7d' : '30d'})</p>
            <div className="h-28 w-full" style={{ minWidth: 10, minHeight: 10 }}>
              <ResponsiveContainer width="99%" height="99%" minWidth={10} minHeight={10} debounce={50}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 10, fontWeight: 900 }} width={40} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #404040', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="points" radius={[0, 8, 8, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

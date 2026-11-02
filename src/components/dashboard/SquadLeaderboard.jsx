import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../supabaseClient'
import { daysAgoLocally } from '../../utils/dateUtils'

export default function SquadLeaderboard({ squadId, studentId }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('weekly') // 'weekly' ou 'monthly'

  useEffect(() => {
    if (!squadId) return

    const fetchLeaderboard = async () => {
      setIsLoading(true)
      try {
        const days = timeRange === 'weekly' ? 7 : 30
        const dateStr = daysAgoLocally(days)

        // Buscar membros do squad
        const { data: members } = await supabase
          .from('gym_squad_members')
          .select('student_id, gym_students(name, username)')
          .eq('squad_id', squadId)

        if (!members) return

        // Buscar logs de pontuação (Ranking dos últimos 7 ou 30 dias)
        const studentIds = members.map(m => m.student_id)
        const { data: scoreLogs, error: scoreError } = await supabase
          .from('gym_squad_score_logs')
          .select('student_id, points, created_at')
          .in('student_id', studentIds)
          .gte('created_at', dateStr)

        if (scoreError) console.error("Erro na busca de pontos:", scoreError)
        
        const scoresArray = scoreLogs || []

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
    return <div className="animate-pulse h-20 bg-surface-container-highest rounded-2xl"></div>
  }

  if (leaderboard.length === 0) return null

  return (
    <div className="vollon-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h3 className="font-display text-white text-xl uppercase tracking-wider font-extrabold">Ranking</h3>
           <div className="flex bg-[#1A1A1A] p-0.5 rounded-xl border border-[#2A2A2A]">
             <button 
               onClick={() => setTimeRange('weekly')}
               className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase transition-all ${timeRange === 'weekly' ? 'bg-[#E11D2E] text-white shadow-[0_2px_10px_rgba(225,29,46,0.4)]' : 'text-[#A3A3A3] hover:text-white'}`}
             >
               7D
             </button>
             <button 
               onClick={() => setTimeRange('monthly')}
               className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase transition-all ${timeRange === 'monthly' ? 'bg-[#E11D2E] text-white shadow-[0_2px_10px_rgba(225,29,46,0.4)]' : 'text-[#A3A3A3] hover:text-white'}`}
             >
               30D
             </button>
           </div>
        </div>
        <span className="text-[10px] bg-[#E11D2E]/20 text-[#FF3B4A] px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-[#E11D2E]/30 font-bold">Pontos Reais</span>
      </div>

      <div className="space-y-2.5">
        {leaderboard.map((user, index) => (
          <div key={user.id} className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A] relative overflow-hidden group">
            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-[#E11D2E] shadow-[0_0_10px_rgba(225,29,46,0.5)]"></div>}
            
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {index === 0 ? <span className="material-symbols-outlined text-2xl text-[#E11D2E] drop-shadow-[0_0_8px_rgba(225,29,46,0.5)]">military_tech</span> : 
               index === 1 ? <span className="material-symbols-outlined text-2xl text-slate-300">military_tech</span> : 
               index === 2 ? <span className="material-symbols-outlined text-2xl text-amber-600">military_tech</span> : 
               <span className="font-display text-[#A3A3A3] text-base">{index + 1}º</span>}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${index === 0 ? 'text-white' : 'text-[#E5E5E5]'}`}>{user.name}</p>
              <p className="text-[11px] text-[#A3A3A3] truncate">@{user.username}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-display text-white text-xl font-extrabold tracking-tight">{user.points}</p>
              <p className="text-[9px] text-[#A3A3A3] uppercase tracking-wider -mt-1 font-semibold">pts</p>
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

        const chartData = [
          { name: 'Você', points: myPoints, fill: '#E11D2E' }, 
          { name: 'Média', points: avgOthersPoints, fill: '#52525B' }
        ]

        return (
          <div className="pt-4 border-t border-[#2A2A2A]">
            <p className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3 text-center font-bold">Sua Pontuação vs Bando ({timeRange === 'weekly' ? '7d' : '30d'})</p>
            <div className="h-24 w-full" style={{ minWidth: 10, minHeight: 10 }}>
              <ResponsiveContainer width="99%" height="99%" minWidth={10} minHeight={10} debounce={50}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11, fontWeight: 700 }} width={42} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="points" radius={[0, 8, 8, 0]} barSize={20}>
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

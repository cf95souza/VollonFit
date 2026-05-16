import { useState, useEffect } from 'react'
import { Trophy, Medal, Flame } from 'lucide-react'
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
    return <div className="animate-pulse h-20 bg-white/5 rounded-[32px]"></div>
  }

  if (leaderboard.length === 0) return null

  return (
    <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h3 className="font-black text-white text-lg font-display tracking-tight">Ranking</h3>
           <div className="flex bg-black p-1 rounded-xl border border-white/5">
             <button 
               onClick={() => setTimeRange('weekly')}
               className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${timeRange === 'weekly' ? 'bg-primary text-black' : 'text-slate-500'}`}
             >
               7D
             </button>
             <button 
               onClick={() => setTimeRange('monthly')}
               className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${timeRange === 'monthly' ? 'bg-primary text-black' : 'text-slate-500'}`}
             >
               30D
             </button>
           </div>
        </div>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-primary/20">Pontos Reais</span>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user, index) => (
          <div key={user.id} className="flex items-center gap-4 bg-black p-3 rounded-2xl border border-white/5 relative overflow-hidden group">
            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_10px_#DFFF5E]"></div>}
            
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {index === 0 ? <Medal className="w-6 h-6 text-primary drop-shadow-[0_0_5px_rgba(223,255,94,0.5)]" /> : 
               index === 1 ? <Medal className="w-6 h-6 text-slate-300" /> : 
               index === 2 ? <Medal className="w-6 h-6 text-amber-600" /> : 
               <span className="font-black text-slate-600 text-sm">{index + 1}º</span>}
            </div>
            
            <div className="flex-1">
              <p className={`font-black text-sm ${index === 0 ? 'text-primary' : 'text-white'}`}>{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold">@{user.username}</p>
            </div>

            <div className="text-right">
              <p className="font-black text-white font-display text-lg tracking-tight">{user.points}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest -mt-1">pontos ganhos</p>
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
          { name: 'Você', points: myPoints, fill: '#DFFF5E' }, 
          { name: 'Média', points: avgOthersPoints, fill: '#334155' }
        ]

        return (
          <div className="pt-6 border-t border-white/5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 text-center">Sua Pontuação vs Bando ({timeRange === 'weekly' ? '7d' : '30d'})</p>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} width={40} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
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

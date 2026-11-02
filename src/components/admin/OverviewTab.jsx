import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Dumbbell, 
  Activity, 
  Flame, 
  Brain, 
  AlertTriangle, 
  History, 
  ArrowRight, 
  Clock,
  Send,
  Sparkles
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

function KPICard({ title, value, label, icon: Icon, color, bg }) {
  return (
    <div className="vollon-card rounded-3xl p-6 relative overflow-hidden group hover:border-[#E11D2E]/50 transition-colors">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <h3 className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">{title}</h3>
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="font-display text-4xl font-black text-white tracking-tight relative z-10">{value}</div>
      <div className="flex items-center gap-1.5 text-[#A3A3A3] text-xs font-medium mt-2 relative z-10">
        <Clock className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
    </div>
  )
}

export default function OverviewTab({ onViewProfile, onMotivate, searchTerm, teacherInfo }) {
  const [stats, setStats] = useState({ exercises: 0, workouts: 0, students: 0, sessionsToday: 0 })
  const [recentStudents, setRecentStudents] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [atRiskStudents, setAtRiskStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const today = getTodayLocally()
    
    const teacherId = teacherInfo.id
    const [exCount, woCount, stCount, logCount] = await Promise.all([
      supabase.from('gym_exercises').select('*', { count: 'exact', head: true }),
      supabase.from('gym_workouts').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId),
      supabase.from('gym_students').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId),
      supabase.from('gym_training_logs')
        .select('*, gym_students!inner(teacher_id)', { count: 'exact', head: true })
        .eq('workout_date', today)
        .eq('gym_students.teacher_id', teacherId)
    ])

    const { data: logs } = await supabase
      .from('gym_training_logs')
      .select('*, gym_students(name, teacher_id), gym_exercises(name)')
      .eq('gym_students.teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(6)

    if (logs) setRecentActivities(logs)

    setStats({
      exercises: exCount.count || 0,
      workouts: woCount.count || 0,
      students: stCount.count || 0,
      sessionsToday: logCount.count || 0
    })

    const { data: students } = await supabase
      .from('gym_students')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (students) setRecentStudents(students)

    // Radar de Evasão
    const { data: studentsWithLogs } = await supabase
      .from('gym_students')
      .select('id, name, username, gym_training_logs(created_at)')
      .eq('teacher_id', teacherId)
      .order('name')

    const riskList = (studentsWithLogs || []).map(student => {
      const logs = student.gym_training_logs || []
      if (logs.length === 0) return { ...student, daysInactive: 99 }
      
      const lastLogDate = new Date(logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at)
      const diffTime = Math.abs(new Date() - lastLogDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return { ...student, daysInactive: diffDays }
    }).filter(s => s.daysInactive >= 3)
      .sort((a, b) => b.daysInactive - a.daysInactive)

    setAtRiskStudents(riskList)
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [teacherInfo?.id])

  const filteredAtRisk = atRiskStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 3 Stats KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard 
          title="ALUNOS ATIVOS" 
          value={stats.students} 
          label="Alunos sob sua gestão" 
          icon={Users}
          color="text-[#FF3B4A]"
          bg="bg-[#E11D2E]/15 border border-[#E11D2E]/30"
        />
        <KPICard 
          title="TREINOS CRIADOS" 
          value={stats.workouts} 
          label="Rotinas cadastradas" 
          icon={Dumbbell}
          color="text-white"
          bg="bg-[#1A1A1A] border border-[#2A2A2A]"
        />
        <KPICard 
          title="SESSÕES HOJE" 
          value={stats.sessionsToday} 
          label="Séries executadas hoje" 
          icon={Flame}
          color="text-white"
          bg="bg-[#1A1A1A] border border-[#2A2A2A]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar de Evasão (7 colunas) */}
        <div className="lg:col-span-7 vollon-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
                  Radar Anti-Evasão
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">
                  Alunos inativos há mais de 3 dias
                </p>
              </div>
            </div>
            <span className="bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {atRiskStudents.length} em Risco
            </span>
          </div>
          
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {filteredAtRisk.length > 0 ? (
              filteredAtRisk.map(student => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] hover:border-[#E11D2E]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-center justify-center font-bold text-xs text-white">
                      {student.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{student.name}</h4>
                      <p className="text-[10px] text-[#A3A3A3] mt-0.5">
                        Inativo há: <strong className="text-[#FF3B4A]">{student.daysInactive >= 99 ? 'Nunca treinou' : `${student.daysInactive} dias`}</strong>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onMotivate({ open: true, student: student, message: '' })}
                    className="vollon-btn-primary px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(255,59,74,0.3)]"
                  >
                    <Send className="w-3 h-3" />
                    <span>Motivar</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-[#A3A3A3] font-bold uppercase tracking-wider py-10">
                Parabéns! Todos os alunos estão com a frequência em dia. 🔥
              </p>
            )}
          </div>
        </div>

        {/* Atividades Recentes do Bando (5 colunas) */}
        <div className="lg:col-span-5 vollon-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#2A2A2A]">
            <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
                Feed de Atividades
              </h3>
              <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">
                Últimos registros de séries
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {recentActivities.map(log => (
              <div 
                key={log.id} 
                className="flex items-start gap-3 p-3 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]"
              >
                <div className="w-2 h-2 bg-[#E11D2E] rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(225,29,46,0.6)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white leading-snug">
                    <strong className="text-white">{log.gym_students?.name}</strong> fez <span className="text-[#FF3B4A] font-semibold">{log.gym_exercises?.name}</span>
                  </p>
                  <p className="text-[10px] text-[#A3A3A3] mt-1 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.weight_kg}kg · {log.reps} reps
                  </p>
                </div>
              </div>
            ))}
            {!loading && recentActivities.length === 0 && (
              <p className="text-center text-xs text-[#A3A3A3] font-bold uppercase tracking-wider py-10">
                Nenhuma série registrada hoje.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

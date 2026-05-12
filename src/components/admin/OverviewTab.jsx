import React, { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  ClipboardList, 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

function KPICard({ title, value, change, trend }) {
  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-white/5 shadow-sm">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {change && (
          <span className={`text-xs font-bold ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {change}
          </span>
        )}
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
      .limit(5)

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

    // Radar de Evasão: Alunos sem treinar há > 3 dias
    // Buscar todos os alunos do professor e seus últimos logs
    const { data: studentsWithLogs } = await supabase
      .from('gym_students')
      .select('id, name, username, gym_training_logs(created_at)')
      .eq('teacher_id', teacherId)
      .order('name')

    const riskList = (studentsWithLogs || []).map(student => {
      const logs = student.gym_training_logs || []
      if (logs.length === 0) return { ...student, daysInactive: 99 } // Nunca treinou
      
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

  const filteredRecent = recentStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Exercícios" value={stats.exercises} icon={Dumbbell} trend="up" change="+3" />
        <KPICard title="Treinos Ativos" value={stats.workouts} icon={ClipboardList} />
        <KPICard title="Alunos" value={stats.students} icon={Users} />
        <KPICard title="Sessões Hoje" value={stats.sessionsToday} icon={Activity} trend="up" change="+100%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#DFFF5E]" />
            <h3 className="font-bold text-white">Alunos Recentes</h3>
          </div>
          <div className="space-y-4">
            {filteredRecent.map((student) => (
              <div key={student.id} onClick={() => onViewProfile(student)} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#DFFF5E]/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-300 border border-white/5 group-hover:border-[#DFFF5E]/30">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{student.name}</h4>
                    <p className="text-xs text-slate-400">@{student.username}</p>
                  </div>
                </div>
                <button 
                  className="text-[10px] font-bold text-[#DFFF5E] hover:text-[#B8E600]"
                >
                  Ver Perfil ›
                </button>
              </div>
            ))}
            {!loading && recentStudents.length === 0 && (
              <p className="text-center py-10 text-slate-400 italic">Nenhum aluno cadastrado.</p>
            )}
          </div>
        </section>

        <section className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-[#DFFF5E]" />
            <h3 className="font-bold text-white">Atividades Recentes</h3>
          </div>
          <div className="space-y-6">
            {recentActivities.map(log => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="w-2 h-2 bg-[#DFFF5E] rounded-full mt-1.5 ring-4 ring-[#DFFF5E]/20 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-400">
                    <span className="font-bold text-white">{log.gym_students?.name}</span> treinou 
                    <span className="font-bold text-white"> {log.gym_exercises?.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.weight_kg}kg
                  </p>
                </div>
              </div>
            ))}
            {!loading && recentActivities.length === 0 && (
              <p className="text-center py-10 text-slate-400 italic">Nenhuma atividade registrada hoje.</p>
            )}
          </div>
        </section>
      </div>

      {/* Radar de Evasão */}
      <section className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">Radar de Evasão</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Alunos em risco de desistência (+3 dias off)</p>
            </div>
          </div>
          <span className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
            {atRiskStudents.length} Alunos
          </span>
        </div>

        {filteredAtRisk.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAtRisk.map(student => (
              <div key={student.id} className="p-6 bg-white/5 rounded-[32px] border border-white/5 hover:border-rose-500/30 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl border border-white/5 shadow-sm group-hover:border-rose-500/30 transition-colors">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm group-hover:text-rose-400 transition-colors">{student.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{student.username}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inatividade</p>
                    <p className="text-2xl font-black text-rose-500 font-display">
                      {student.daysInactive >= 99 ? 'Nunca' : `${student.daysInactive} dias`}
                    </p>
                  </div>
                  <button 
                    onClick={() => onMotivate({ open: true, student: student, message: '' })}
                    className="bg-slate-800 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20"
                  >
                    Motivar ›
                  </button>
                </div>
                
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-white/5">
              <CheckCircle2 className="w-8 h-8 text-[#DFFF5E]" />
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Todos os alunos estão ativos! 🚀</p>
          </div>
        )}
      </section>
    </div>
  )
}

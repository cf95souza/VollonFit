import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

function KPICard({ title, value, change, trend, icon }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:text-primary-container transition-colors">{icon}</span>
        <p className="text-on-surface-variant text-xs font-label-caps uppercase tracking-wider">{title}</p>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-display-lg text-on-surface tracking-tight">{value}</h3>
        {change && (
          <span className={`text-[10px] font-label-caps uppercase ${
            trend === 'up' ? 'text-primary-container' : trend === 'down' ? 'text-error' : 'text-on-surface-variant'
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
        <KPICard title="Exercícios" value={stats.exercises} icon="fitness_center" trend="up" change="+3" />
        <KPICard title="Treinos Ativos" value={stats.workouts} icon="assignment" />
        <KPICard title="Alunos" value={stats.students} icon="groups" />
        <KPICard title="Sessões Hoje" value={stats.sessionsToday} icon="insights" trend="up" change="+100%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary-container">groups</span>
            <h3 className="font-headline-lg text-on-surface text-lg">Alunos Recentes</h3>
          </div>
          <div className="space-y-4">
            {filteredRecent.map((student) => (
              <div key={student.id} onClick={() => onViewProfile(student)} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary-container/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center font-headline-lg text-on-surface-variant border border-outline-variant/30 group-hover:border-primary-container/30">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-headline-md text-on-surface text-sm">{student.name}</h4>
                    <p className="font-body-md text-xs text-on-surface-variant">@{student.username}</p>
                  </div>
                </div>
                <button 
                  className="font-label-caps text-[10px] text-primary-container hover:brightness-110"
                >
                  Ver Perfil ›
                </button>
              </div>
            ))}
            {!loading && recentStudents.length === 0 && (
              <p className="text-center py-10 font-body-md text-on-surface-variant italic">Nenhum aluno cadastrado.</p>
            )}
          </div>
        </section>

        <section className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary-container">assignment</span>
            <h3 className="font-headline-lg text-on-surface text-lg">Atividades Recentes</h3>
          </div>
          <div className="space-y-6">
            {recentActivities.map(log => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="w-2 h-2 bg-primary-container rounded-full mt-1.5 ring-4 ring-primary-container/20 shrink-0 neon-glow" />
                <div className="flex-1">
                  <p className="font-body-md text-sm text-on-surface-variant">
                    <span className="font-headline-md text-on-surface">{log.gym_students?.name}</span> treinou 
                    <span className="font-headline-md text-on-surface"> {log.gym_exercises?.name}</span>
                  </p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.weight_kg}kg
                  </p>
                </div>
              </div>
            ))}
            {!loading && recentActivities.length === 0 && (
              <p className="text-center py-10 font-body-md text-on-surface-variant italic">Nenhuma atividade registrada hoje.</p>
            )}
          </div>
        </section>
      </div>

      {/* Radar de Evasão */}
      <section className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center text-error shadow-sm">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-display-xl text-on-surface tracking-tight">Radar de Evasão</h3>
              <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-0.5">Alunos em risco de desistência (+3 dias off)</p>
            </div>
          </div>
          <span className="bg-error/10 text-error px-4 py-2 rounded-full font-label-caps text-[10px] uppercase tracking-widest border border-error/20">
            {atRiskStudents.length} Alunos
          </span>
        </div>

        {filteredAtRisk.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAtRisk.map(student => (
              <div key={student.id} className="p-6 bg-surface rounded-3xl border border-outline-variant/30 hover:border-error/30 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center font-headline-lg text-on-surface-variant text-xl border border-outline-variant/30 shadow-sm group-hover:border-error/30 transition-colors">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-headline-md text-on-surface text-sm group-hover:text-error transition-colors">{student.name}</h4>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">@{student.username}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <div>
                    <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">Inatividade</p>
                    <p className="text-2xl font-display-lg text-error tracking-tight">
                      {student.daysInactive >= 99 ? 'Nunca' : `${student.daysInactive} dias`}
                    </p>
                  </div>
                  <button 
                    onClick={() => onMotivate({ open: true, student: student, message: '' })}
                    className="bg-surface-container text-error px-4 py-2 rounded-xl font-label-caps text-[10px] uppercase tracking-widest shadow-sm hover:bg-error hover:text-on-error transition-all active:scale-95 border border-error/20"
                  >
                    Motivar ›
                  </button>
                </div>
                
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-error/10 rounded-full blur-2xl group-hover:bg-error/20 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-outline-variant/30">
            <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-primary-container">check_circle</span>
            </div>
            <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest">Todos os alunos estão ativos! 🚀</p>
          </div>
        )}
      </section>
    </div>
  )
}

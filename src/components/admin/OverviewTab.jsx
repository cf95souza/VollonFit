import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

function KPICard({ title, value, label, icon }) {
  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-surface-container-high group-hover:text-surface-container transition-colors duration-500">
        <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="relative z-10">
        <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-2">{title}</h3>
        <div className="text-display-xl font-display-xl text-primary text-glow">{value}</div>
        <div className="flex items-center gap-1 text-on-surface-variant text-sm mt-2">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span className="font-data-display">{label}</span>
        </div>
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:gap-md animate-in fade-in duration-500">
      
      {/* Stats Row */}
      <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-gutter md:gap-md mb-6">
        <KPICard title="ALUNOS ATIVOS" value={stats.students} label="Alunos ativos" icon="group" />
        <KPICard title="TREINOS CRIADOS" value={stats.workouts} label="Treinos ativos" icon="fitness_center" />
        <KPICard title="SESSÕES HOJE" value={stats.sessionsToday} label="Alunos treinaram hoje" icon="insights" />
      </div>

      {/* IA Coach 2.0 Feature */}
      <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-md mb-6 lg:mb-0">
        <div className="glass-card rounded-xl p-6 border-t-2 border-t-tertiary-fixed h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <h3 className="text-headline-md font-headline-md text-primary">IA Coach 2.0</h3>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant mb-6">Análise preditiva e guias nutricionais para seus atletas.</p>
          
          <div className="space-y-4 mt-auto">
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container-high hover:border-tertiary-fixed/50 transition-colors cursor-pointer group">
              <div className="flex justify-between items-center mb-2">
                <span className="font-headline-md text-on-surface text-sm font-bold">Calculadora 1RM</span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary-fixed transition-colors">arrow_forward</span>
              </div>
              <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed w-3/4 rounded-full shadow-[0_0_8px_rgba(125,244,255,0.6)]"></div>
              </div>
              <p className="text-label-caps font-label-caps text-on-surface-variant mt-2 text-xs">Preparado com último treino de Squads.</p>
            </div>
            
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container-high hover:border-primary-container/50 transition-colors cursor-pointer group">
              <div className="flex justify-between items-center mb-2">
                <span className="font-headline-md text-on-surface text-sm font-bold">Calculadora de Macros</span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">restaurant</span>
              </div>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm">Gere planos alimentares sob medida.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Management / Radar de Evasão (Col span 8) */}
      <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 border-b border-surface-container-high pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <h3 className="font-headline-md font-bold text-on-surface uppercase">Radar de Evasão</h3>
            </div>
            <span className="bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold">{atRiskStudents.length} Risco</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            {filteredAtRisk.length > 0 ? filteredAtRisk.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-surface-container-high hover:border-error/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-on-surface">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-error transition-colors">{student.name}</h4>
                    <p className="text-xs text-[#64748b]">Inativo: {student.daysInactive >= 99 ? 'Nunca' : `${student.daysInactive} dias`}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onMotivate({ open: true, student: student, message: '' })}
                  className="text-error hover:bg-error/10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                >
                  Motivar
                </button>
              </div>
            )) : (
              <p className="text-center text-sm text-on-surface-variant py-8">Todos os alunos estão ativos! 🚀</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-surface-container-high pb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h3 className="font-headline-md font-bold text-on-surface uppercase">Atividades Recentes</h3>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            {recentActivities.map(log => (
              <div key={log.id} className="flex gap-4 items-start p-3 hover:bg-surface-container-highest rounded-lg transition-colors">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(195,244,0,0.5)]" />
                <div>
                  <p className="text-sm text-on-surface-variant">
                    <strong className="text-on-surface">{log.gym_students?.name}</strong> treinou <strong className="text-on-surface">{log.gym_exercises?.name}</strong>
                  </p>
                  <p className="text-xs text-[#64748b] mt-1 tracking-widest font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.weight_kg}kg
                  </p>
                </div>
              </div>
            ))}
            {!loading && recentActivities.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-8">Nenhuma atividade hoje.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

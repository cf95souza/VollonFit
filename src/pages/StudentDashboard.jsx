import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  TrendingUp, 
  User as UserIcon, 
  Flame, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Bell,
  Play,
  Check,
  X
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { getTodayLocally, daysAgoLocally, startOfWeekLocally } from '../utils/dateUtils'
import NutritionTab from '../components/dashboard/NutritionTab'
import MarketplaceTab from '../components/dashboard/MarketplaceTab'
import { loadTheme } from '../utils/themeLoader'

import ExecutionView from '../components/dashboard/ExecutionView'
import WorkoutSummaryView from '../components/dashboard/WorkoutSummaryView'
import EvolutionView from '../components/dashboard/EvolutionView'
import ProfileTab from '../components/dashboard/ProfileTab'
import SquadTab from '../components/dashboard/SquadTab'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [teacherPlan, setTeacherPlan] = useState('basic')
  const [teacherAcademyId, setTeacherAcademyId] = useState(null)
  const [currentTab, setCurrentTab] = useState(() => localStorage.getItem('vollonfit_student_tab') || 'train')
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('vollonfit_student_view') || 'home') // 'home', 'workout-detail', 'executing'
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [workoutItems, setWorkoutItems] = useState([])
  const [studentWorkouts, setStudentWorkouts] = useState([])
  const [bioRecords, setBioRecords] = useState([])
  const [personalRecords, setPersonalRecords] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [socialNotifications, setSocialNotifications] = useState([])
  const [evolutionPhotos, setEvolutionPhotos] = useState([])
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0)
  const [weeklyStats, setWeeklyStats] = useState({ volume: 0, prs: 0 })
  const [workoutLastPerformed, setWorkoutLastPerformed] = useState({})
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [completedWorkoutsThisWeek, setCompletedWorkoutsThisWeek] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [workoutSummary, setWorkoutSummary] = useState(null) 
  const [completedExercises, setCompletedExercises] = useState([]) 
  const [toast, setToast] = useState(null)

  const [editName, setEditName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  const openConfigModal = () => {
    if (student) {
      setEditName(student.name || '')
      setEditAge(student.age || '')
      setEditHeight(student.height || '')
      setEditPassword(student.password || '')
      setIsConfigModalOpen(true)
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setIsSavingConfig(true)
    try {
      const { data, error } = await supabase
        .from('gym_students')
        .update({
          name: editName,
          age: parseInt(editAge) || null,
          height: parseFloat(editHeight) || null,
          password: editPassword
        })
        .eq('id', student.id)
        .select()
        .single()

      if (error) throw error

      setStudent(data)
      localStorage.setItem('vollonfit_user', JSON.stringify(data))
      showToast('Configurações salvas com sucesso!')
      setIsConfigModalOpen(false)
    } catch (err) {
      console.error(err)
      showToast('Erro ao salvar configurações.', 'error')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_user')
    localStorage.removeItem('vollonfit_student_tab')
    localStorage.removeItem('vollonfit_student_view')
    navigate('/', { replace: true })
  }

  const handleEnableNotifications = () => {
    if (!("Notification" in window)) {
      showToast("Seu navegador não suporta notificações.", "error")
      return
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showToast("Notificações ativadas com sucesso!")
      } else if (permission === "denied") {
        showToast("Você bloqueou as notificações. Ative nas configurações do navegador.", "error")
      } else {
        showToast("Permissão não concedida.", "error")
      }
    })
  }

  const fetchWorkouts = async (studentId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gym_workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('sequence_order', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (!error) setStudentWorkouts(data || [])
      
      const { data: bioData } = await supabase
        .from('gym_biopedance_records')
        .select('*')
        .eq('student_id', studentId)
        .order('record_date', { ascending: true })
      
      if (bioData) setBioRecords(bioData)

      const { data: allLogs, error: prError } = await supabase
        .from('gym_training_logs')
        .select('exercise_id, weight_kg, reps_done, workout_date, workout_id, created_at, gym_exercises(name)')
        .eq('student_id', studentId)
        
      let currentPrs = []
      
      if (!prError && allLogs) {
        const uniqueDates = Array.from(new Set(allLogs.map(h => h.workout_date)))
        setWorkoutHistory(uniqueDates)

        const prMap = {}
        allLogs.forEach(log => {
          const exName = Array.isArray(log.gym_exercises) ? log.gym_exercises[0]?.name : log.gym_exercises?.name
          if (!prMap[log.exercise_id] || log.weight_kg > prMap[log.exercise_id].max_weight) {
            prMap[log.exercise_id] = {
              exercise_name: exName || 'Exercício',
              max_weight: log.weight_kg,
              record_date: log.workout_date
            }
          }
        })
        currentPrs = Object.values(prMap).sort((a, b) => b.max_weight - a.max_weight)
        setPersonalRecords(currentPrs)

        // Usar data local para calcular semana (evita virada UTC após 21h)
        const sevenDaysAgoStr = daysAgoLocally(7)

        const weekLogs = allLogs.filter(log => log.workout_date >= sevenDaysAgoStr)
        // Conta dias distintos de treino na semana
        const uniqueDaysThisWeek = new Set(weekLogs.map(l => l.workout_date)).size
        setWeeklyWorkouts(uniqueDaysThisWeek)

        const vol = weekLogs.reduce((acc, log) => acc + ((log.weight_kg || 0) * (log.reps_done || 0)), 0)
        const prsCount = currentPrs.filter(pr => pr.record_date >= sevenDaysAgoStr).length
        
        setWeeklyStats({ volume: vol, prs: prsCount })

        const completedIds = new Set(weekLogs.map(l => l.workout_id).filter(Boolean))
        setCompletedWorkoutsThisWeek(completedIds)

        const lastPerformedAt = {}
        allLogs.forEach(log => {
          if (log.workout_id) {
            const time = new Date(log.created_at || log.workout_date).getTime()
            if (!lastPerformedAt[log.workout_id] || time > lastPerformedAt[log.workout_id]) {
               lastPerformedAt[log.workout_id] = time
            }
          }
        })
        setWorkoutLastPerformed(lastPerformedAt)
      }

      const { data: notes } = await supabase
        .from('gym_social_notifications')
        .select('*')
        .eq('receiver_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (notes && notes.length > 0) {
        setSocialNotifications(notes)
      }

      const { data: photos } = await supabase
        .from('gym_evolution_photos')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      
      if (photos) setEvolutionPhotos(photos)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = localStorage.getItem('vollonfit_user')
    if (!user) {
      navigate('/', { replace: true })
      return
    }
    const parsedUser = JSON.parse(user)
    setStudent(parsedUser)
    
    if (parsedUser.teacher_id) {
      supabase.from('gym_teachers').select('plan_type, academy_id').eq('id', parsedUser.teacher_id).single()
        .then(({ data }) => {
          if (data?.plan_type) setTeacherPlan(data.plan_type)
          if (data?.academy_id) setTeacherAcademyId(data.academy_id)
        })
      loadTheme(parsedUser.teacher_id)
    }

    fetchWorkouts(parsedUser.id)
  }, [navigate])

  useEffect(() => {
    localStorage.setItem('vollonfit_student_tab', currentTab)
  }, [currentTab])

  useEffect(() => {
    localStorage.setItem('vollonfit_student_view', currentView)
  }, [currentView])

  const startWorkout = async (workout) => {
    setLoading(true)
    try {
      const { data: items, error: itemsError } = await supabase
        .from('gym_workout_items')
        .select('*, gym_exercises(*)')
        .eq('workout_id', workout.id)
        .order('sequence_order', { ascending: true })

      if (itemsError) throw itemsError

      const exerciseIds = (items || []).map(i => {
        return Array.isArray(i.gym_exercises) ? i.gym_exercises[0]?.id : i.gym_exercises?.id
      }).filter(Boolean)

      let historyLogs = []
      if (exerciseIds.length > 0) {
        const { data: logsData } = await supabase
          .from('gym_training_logs')
          .select('*')
          .eq('student_id', student.id)
          .in('exercise_id', exerciseIds)
          .order('created_at', { ascending: false })

        if (logsData) historyLogs = logsData
      }

      const itemsWithHistory = (items || []).map(item => {
        const exId = Array.isArray(item.gym_exercises) ? item.gym_exercises[0]?.id : item.gym_exercises?.id
        const history = historyLogs.filter(l => l.exercise_id === exId)
        return {
          ...item,
          lastPerformance: history
        }
      })

      setSelectedWorkout(workout)
      setWorkoutItems(itemsWithHistory)
      setWorkoutSummary({ totalWeight: 0, exerciseLogs: [] })
      setCompletedExercises([]) 
      setCurrentView('workout-detail')
    } catch (err) {
      console.error('Erro ao iniciar treino:', err)
      showToast('Não foi possível carregar o treino.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startExecution = (index = 0) => {
    setCurrentView('executing')
    setCurrentExerciseIndex(index)
  }

  if (currentView === 'executing') {
    return (
      <ExecutionView 
        key={currentExerciseIndex}
        workout={selectedWorkout} 
        exercises={workoutItems}
        exerciseIndex={currentExerciseIndex}
        studentId={student?.id}
        onNext={async () => {
          const currentItem = workoutItems[currentExerciseIndex]
          const exerciseId = Array.isArray(currentItem?.gym_exercises) ? currentItem.gym_exercises[0]?.id : currentItem?.gym_exercises?.id
          
          if (exerciseId) {
            setCompletedExercises(prev => [...new Set([...prev, exerciseId])])
          }

          if (currentExerciseIndex + 1 < workoutItems.length) {
            setCurrentExerciseIndex(prev => prev + 1)
          } else {
            setCurrentView('workout-detail')
            showToast('Todos os exercícios concluídos! Finalize seu treino.')
          }
        }}
        onBack={() => setCurrentView('workout-detail')}
        onLogSet={(setLog) => {
          setWorkoutSummary(prev => ({
            ...prev,
            exerciseLogs: [...(prev.exerciseLogs || []), setLog]
          }))
        }}
        showToast={showToast}
      />
    )
  }

  if (currentView === 'summary') {
    return (
      <WorkoutSummaryView 
        summary={workoutSummary}
        workout={selectedWorkout}
        onClose={() => {
          setCurrentView('home')
          setCurrentTab('train')
          fetchWorkouts(student.id)
        }}
      />
    )
  }

  // Faixa dos 7 dias da semana (conforme 02-inicio.png)
  const todayStr = getTodayLocally()
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Domingo
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - dayOfWeek)
  
  const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
    return {
      dayStr: dayLetters[i],
      dayNum: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
      hasTrained: (workoutHistory || []).includes(dateStr)
    }
  })

  const sortedWorkouts = [...(studentWorkouts || [])].sort((a, b) => {
    const timeA = workoutLastPerformed[a.id] || 0
    const timeB = workoutLastPerformed[b.id] || 0
    return timeA - timeB
  })
  
  const suggestedWorkout = sortedWorkouts[0]

  return (
    <div className="w-full min-h-dvh flex flex-col bg-[#0A0A0A] text-white font-body overflow-x-hidden selection:bg-[#E11D2E]/30 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-6 duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            toast.type === 'error' ? 'bg-[#E11D2E]/90 border-[#E11D2E] text-white' : 'bg-[#141414]/95 border-[#2A2A2A] text-white'
          }`}>
            <span className="font-bold text-xs tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* VIEW: TREINO DO DIA (05-treino-do-dia.png) */}
      {currentTab === 'train' && currentView === 'workout-detail' && (
        <div className="min-h-dvh flex flex-col justify-between max-w-md mx-auto w-full px-5 pt-8 pb-28">
          
          <div>
            {/* Top Back Button */}
            <div className="mb-6">
              <button 
                onClick={() => setCurrentView('home')} 
                className="w-11 h-11 rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white hover:border-[#E11D2E] transition-colors active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Subtítulo: SUPERIOR · DIA X */}
            <p className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-widest mb-1">
              SUPERIOR · DIA {selectedWorkout?.sequence_order || 1}
            </p>

            {/* Título Gigante em Duas Linhas (conforme 05-treino-do-dia.png) */}
            <h1 className="font-display text-5xl font-black uppercase tracking-tight leading-[0.95] mb-4">
              <span className="text-white block">{selectedWorkout?.name?.split('+')?.[0]?.trim() || selectedWorkout?.name}</span>
              {selectedWorkout?.name?.includes('+') && (
                <span className="bg-gradient-to-r from-white via-[#FFAAB1] to-[#FF4D5D] bg-clip-text text-transparent block">
                  + {selectedWorkout?.name?.split('+')?.[1]?.trim()}
                </span>
              )}
            </h1>

            {/* 3 Chips de Resumo */}
            <div className="flex gap-2 mb-8">
              <span className="px-3 py-1.5 rounded-full bg-[#141414] border border-[#2A2A2A] text-[10px] font-bold text-white uppercase tracking-wider">
                {workoutItems.length} EXERCÍCIOS
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#141414] border border-[#2A2A2A] text-[10px] font-bold text-white uppercase tracking-wider">
                {workoutItems.reduce((acc, i) => acc + (i.target_sets || 4), 0)} SÉRIES
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#141414] border border-[#2A2A2A] text-[10px] font-bold text-white uppercase tracking-wider">
                ~45 MIN
              </span>
            </div>

            {/* Linha do Tempo dos Exercícios */}
            <div className="relative pl-7 space-y-4">
              
              {/* Linha Vertical Conectora */}
              <div className="absolute left-3.5 top-5 bottom-5 w-[2px] bg-[#2A2A2A] -translate-x-1/2" />

              {workoutItems.map((item, idx) => {
                const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises
                const isFirst = idx === 0
                const isCompleted = completedExercises.includes(ex?.id)

                return (
                  <div key={idx} className="relative flex items-center gap-3.5 group">
                    
                    {/* Círculo Numerado */}
                    <div className={`absolute -left-7 w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-black z-10 transition-all ${
                      isCompleted 
                        ? 'bg-[#22C55E] text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                        : isFirst 
                        ? 'bg-[#E11D2E] text-white shadow-[0_0_12px_rgba(225,29,46,0.6)]' 
                        : 'bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3]'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    {/* Card do Exercício */}
                    <button 
                      onClick={() => startExecution(idx)}
                      className="vollon-card flex-1 p-4 rounded-2xl flex items-center justify-between hover:border-[#E11D2E]/60 text-left active:scale-[0.98] transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`font-bold text-sm truncate ${isCompleted ? 'text-[#22C55E]' : 'text-white'}`}>
                          {ex?.name || 'Exercício'}
                        </p>
                        <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                          {item?.target_sets || 4} séries · {item?.target_reps || 12} reps
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#A3A3A3] shrink-0 group-hover:text-white transition-colors" />
                    </button>

                  </div>
                )
              })}

            </div>
          </div>

          {/* Botão Fixo na Base: Iniciar Treino (Pílula 58px) */}
          <div className="fixed bottom-5 left-4 right-4 z-50 max-w-md mx-auto">
            {completedExercises.length > 0 && completedExercises.length === workoutItems.length ? (
              <button 
                onClick={async () => {
                  const totalWeight = (workoutSummary?.exerciseLogs || []).reduce((acc, log) => acc + (log.weight * log.reps), 0)
                  setWorkoutSummary(prev => ({ ...prev, totalWeight }))
                  
                  try {
                    const { data: squadMember } = await supabase.from('gym_squad_members').select('squad_id').eq('student_id', student.id).maybeSingle()
                    
                    if (squadMember?.squad_id) {
                      await supabase.from('gym_squad_posts').insert([{
                        squad_id: squadMember.squad_id,
                        student_id: student.id,
                        type: 'check-in',
                        content: `Finalizou o treino: ${selectedWorkout.name}! 🔥💪 Volume: ${totalWeight}kg.`
                      }])
                      
                      const pointsConstancy = 100
                      const pointsIntensity = Math.min(200, Math.floor(totalWeight / 10))
                      let pointsBonus = 0
                      
                      // Bônus de constância com base em dias distintos locais na semana
                      const startOfWeekStr = startOfWeekLocally()
                      const { data: weekLogs } = await supabase
                        .from('gym_training_logs')
                        .select('workout_date')
                        .eq('student_id', student.id)
                        .gte('workout_date', startOfWeekStr)

                      const distinctDays = new Set((weekLogs || []).map(l => l.workout_date))
                      distinctDays.add(getTodayLocally())

                      if (distinctDays.size === 4) {
                        pointsBonus = 500
                      }

                      const totalPoints = pointsConstancy + pointsIntensity + pointsBonus

                      await supabase.from('gym_squad_score_logs').insert([{
                        squad_id: squadMember.squad_id,
                        student_id: student.id,
                        points: totalPoints,
                        category: 'workout_completion',
                        reason: `Concluiu o treino: ${selectedWorkout.name}`
                      }])

                      showToast(`+${totalPoints} PONTOS! ${pointsBonus > 0 ? '🎁 BÔNUS DE CONSTÂNCIA!' : '🏆🔥'}`)
                    }
                  } catch (err) {
                    console.error(err)
                  }
                  setCurrentView('summary')
                }}
                className="vollon-btn-primary w-full h-[58px] rounded-full flex items-center justify-center gap-2 text-white font-bold text-lg shadow-[0_8px_28px_rgba(225,29,46,0.4)] cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Finalizar treino</span>
              </button>
            ) : (
              <button 
                onClick={() => startExecution(0)}
                className="vollon-btn-primary w-full h-[58px] rounded-full flex items-center justify-center gap-2 text-white font-bold text-lg shadow-[0_8px_28px_rgba(225,29,46,0.4)] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar treino</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* VIEW: HOME / INÍCIO (02-inicio.png) */}
      {currentTab === 'train' && currentView === 'home' && (
        <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-32 space-y-6">
          
          {/* Cabeçalho Topo (02-inicio.png) */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar com inicial */}
              <button 
                onClick={() => setCurrentTab('profile')}
                className="w-12 h-12 rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white font-display text-xl font-black active:scale-95 transition-all"
              >
                {student?.name?.[0] || 'C'}
              </button>
              
              <div>
                <h1 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  OLÁ, {student?.name?.split(' ')[0] || 'CAIO'}!
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Flame className="w-4 h-4 text-[#FF3B4A]" />
                  <span className="text-xs text-[#A3A3A3] font-medium">
                    {weeklyWorkouts} treinos na semana
                  </span>
                </div>
              </div>
            </div>

            {/* Sino de Notificações */}
            <button 
              onClick={() => setCurrentTab('social')}
              className="w-11 h-11 rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {socialNotifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E11D2E]" />
              )}
            </button>
          </header>

          {/* Faixa dos 7 Dias da Semana (02-inicio.png) */}
          <div className="grid grid-cols-7 gap-2">
            {currentWeekDays.map((d, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                  d.isToday
                    ? 'bg-gradient-to-b from-[#E11D2E] to-[#9F0012] text-white shadow-[0_4px_16px_rgba(225,29,46,0.45)] ring-1 ring-[#FF3B4A]/50'
                    : d.hasTrained
                    ? 'bg-[#141414] border border-[#E11D2E]/60 text-white'
                    : 'bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3]'
                }`}
              >
                <span className="text-[11px] font-bold uppercase mb-1 opacity-80">
                  {d.dayStr}
                </span>
                <span className="font-display text-lg font-black text-white">
                  {d.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Card do Treino Sugerido (02-inicio.png) */}
          {suggestedWorkout && (
            <div className="vollon-card p-5 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 mb-3">
                    <span className="text-[10px] font-bold text-[#FF3B4A] tracking-wider uppercase">
                      HOJE · ~45 MIN
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white mb-2">
                    {suggestedWorkout.name}
                  </h2>
                  
                  <p className="text-xs text-[#A3A3A3]">
                    Dia {suggestedWorkout.sequence_order || 1} · {suggestedWorkout.description || '5 exercícios'}
                  </p>
                </div>

                {/* Anel de Progresso na Semana */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#222222" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#E11D2E" 
                      strokeWidth="8" 
                      strokeDasharray={`${2 * Math.PI * 40}`} 
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(weeklyWorkouts / 5, 1))}`} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute text-center leading-none">
                    <span className="font-display text-2xl font-black text-white block">
                      {weeklyWorkouts}/5
                    </span>
                    <span className="text-[9px] text-[#A3A3A3] uppercase block mt-0.5">
                      na semana
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão Iniciar Treino */}
              <button 
                onClick={() => startWorkout(suggestedWorkout)}
                className="vollon-btn-primary w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-base mt-4 cursor-pointer active:scale-98 transition-transform"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar treino</span>
              </button>
            </div>
          )}

          {/* Card Volume Semanal (02-inicio.png) */}
          <div className="vollon-card p-4.5 px-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">
                VOLUME SEMANAL
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-black text-white">
                  {weeklyStats.volume || 0}
                </span>
                <span className="text-xs text-[#A3A3A3] font-semibold">kg</span>
              </div>
            </div>

            <div className="h-8 w-28 shrink-0">
              <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                <path 
                  d="M0,25 Q20,23 35,27 T60,18 T75,20 T100,5" 
                  fill="none" 
                  stroke="#FF3B4A" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
          </div>

          {/* 3 Cartões de Métricas (02-inicio.png) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="vollon-card p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">PESO</span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-black text-white">
                  {bioRecords[bioRecords.length - 1]?.weight || '--'}
                </span>
                <span className="text-[10px] text-[#A3A3A3] font-semibold">kg</span>
              </div>
            </div>

            <div className="vollon-card p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">RECORDES</span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-black text-white">
                  {weeklyStats.prs || 0}
                </span>
                <span className="text-[10px] text-[#A3A3A3] font-semibold">novos</span>
              </div>
            </div>

            <div className="vollon-card p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">TREINOS</span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-black text-white">
                  {workoutHistory.length || 0}
                </span>
                <span className="text-[10px] text-[#A3A3A3] font-semibold">total</span>
              </div>
            </div>
          </div>

          {/* Linha Horizontal com Outros Treinos (02-inicio.png) */}
          <div className="space-y-2.5">
            <h3 className="font-display text-lg uppercase font-bold text-[#A3A3A3] tracking-wider">
              Rotina de Treinos
            </h3>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {studentWorkouts.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => startWorkout(w)}
                  className="vollon-card p-3.5 rounded-2xl flex items-center gap-3 shrink-0 min-w-[190px] text-left hover:border-[#E11D2E]/60 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-[#FF3B4A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs truncate">
                      Dia {w.sequence_order || idx + 1} · {w.name}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3] truncate mt-0.5">
                      {w.description || 'Foco'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW: EVOLUÇÃO (03-evolucao.png) */}
      {currentTab === 'evolution' && (
        <div className="flex-1 pb-32">
          <EvolutionView 
            records={bioRecords} 
            prs={personalRecords}
            history={workoutHistory}
            photos={evolutionPhotos}
            studentId={student?.id}
            studentName={student?.name}
            weeklyWorkouts={weeklyWorkouts}
            onNewRecord={() => setIsBioModalOpen(true)} 
            onPhotosUpdate={(newPhotos) => setEvolutionPhotos(newPhotos)}
            showToast={showToast}
          />
        </div>
      )}

      {/* VIEW: SQUADS (04-squads.png) */}
      {currentTab === 'social' && (
        <div className="flex-1 pb-32">
          <SquadTab 
            student={student} 
            showToast={showToast} 
          />
        </div>
      )}

      {/* VIEW: NUTRIÇÃO */}
      {currentTab === 'nutrition' && (
        <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-32">
          <NutritionTab studentId={student?.id} student={student} showToast={showToast} />
        </div>
      )}

      {/* VIEW: PERFIL */}
      {currentTab === 'profile' && (
        <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-32">
          <ProfileTab 
            student={student} 
            totalWorkouts={workoutHistory.length}
            onOpenConfig={openConfigModal} 
            onOpenGoals={() => setIsGoalsModalOpen(true)}
            showToast={showToast}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Barra Inferior Flutuante com 5 Abas (02-inicio.png) */}
      {currentView !== 'workout-detail' && currentView !== 'executing' && (
        <nav className="vollon-nav-bar flex justify-around items-center px-3 py-2">
          <button 
            onClick={() => { setCurrentTab('train'); setCurrentView('home'); }} 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
              currentTab === 'train' ? 'bg-[#FF3B4A]/15 text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Dumbbell className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Treinos</span>
          </button>

          <button 
            onClick={() => setCurrentTab('evolution')} 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
              currentTab === 'evolution' ? 'bg-[#FF3B4A]/15 text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Evolução</span>
          </button>

          <button 
            onClick={() => setCurrentTab('social')} 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
              currentTab === 'social' ? 'bg-[#FF3B4A]/15 text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Squads</span>
          </button>

          <button 
            onClick={() => {
              if (teacherPlan !== 'premium') {
                showToast('Nutrição disponível para alunos Premium 🔥', 'error')
                return
              }
              setCurrentTab('nutrition')
            }} 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
              currentTab === 'nutrition' ? 'bg-[#FF3B4A]/15 text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Nutri</span>
          </button>

          <button 
            onClick={() => setCurrentTab('profile')} 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
              currentTab === 'profile' ? 'bg-[#FF3B4A]/15 text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </nav>
      )}

      {/* Modal de Configurações */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-md p-6 border border-[#2A2A2A] rounded-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-2xl font-black uppercase text-white">Configurações</h2>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-[#A3A3A3] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase block mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-white text-sm focus:border-[#E11D2E] outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A3A3A3] uppercase block mb-1">Idade</label>
                  <input 
                    type="number" 
                    value={editAge} 
                    onChange={(e) => setEditAge(e.target.value)} 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-white text-sm focus:border-[#E11D2E] outline-none" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A3A3A3] uppercase block mb-1">Altura (m)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editHeight} 
                    onChange={(e) => setEditHeight(e.target.value)} 
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-white text-sm focus:border-[#E11D2E] outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase block mb-1">Senha</label>
                <input 
                  type="text" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  required 
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-white text-sm focus:border-[#E11D2E] outline-none" 
                />
              </div>

              <div className="space-y-2.5 pt-3">
                <button 
                  type="submit" 
                  disabled={isSavingConfig} 
                  className="vollon-btn-primary w-full h-12 rounded-xl font-bold text-white text-sm uppercase"
                >
                  {isSavingConfig ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                
                <button 
                  type="button" 
                  onClick={handleEnableNotifications} 
                  className="w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl text-xs font-bold uppercase hover:bg-[#222]"
                >
                  Ativar Notificações do Navegador
                </button>

                <button 
                  type="button" 
                  onClick={() => { setIsConfigModalOpen(false); handleLogout(); }} 
                  className="w-full h-11 bg-[#E11D2E]/10 border border-[#E11D2E]/30 text-[#FF3B4A] rounded-xl text-xs font-bold uppercase hover:bg-[#E11D2E]/20"
                >
                  Sair da Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Metas */}
      {isGoalsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-md p-6 border border-[#2A2A2A] rounded-3xl">
            <h2 className="font-display text-2xl font-black uppercase text-white mb-3">Minhas Metas</h2>
            <p className="text-sm text-[#A3A3A3] mb-6 leading-relaxed">
              {student?.goals || 'Nenhuma meta definida pelo professor ainda.'}
            </p>
            <button 
              onClick={() => setIsGoalsModalOpen(false)} 
              className="vollon-btn-primary w-full h-12 rounded-xl font-bold text-white uppercase text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

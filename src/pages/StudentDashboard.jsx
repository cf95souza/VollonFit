import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  User as UserIcon, 
  LogOut, 
  CheckCircle2, 
  ChevronLeft,
  Timer,
  ChevronRight,
  ClipboardList,
  Scale,
  Flame,
  Plus,
  X,
  AlertCircle,
  Heart,
  Camera,
  ImageIcon,
  Users,
  Shield,
  ShoppingBag
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { getTodayLocally } from '../utils/dateUtils'
import NutritionTab from '../components/dashboard/NutritionTab'
import MarketplaceTab from '../components/dashboard/MarketplaceTab'
import { loadTheme } from '../utils/themeLoader'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

import ExecutionView from '../components/dashboard/ExecutionView'
import WorkoutSummaryView from '../components/dashboard/WorkoutSummaryView'
import EvolutionView from '../components/dashboard/EvolutionView'
import ProfileTab from '../components/dashboard/ProfileTab'
import SquadTab from '../components/dashboard/SquadTab'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [teacherPlan, setTeacherPlan] = useState('basic')
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
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [isPinging, setIsPinging] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workoutSummary, setWorkoutSummary] = useState(null) 
  const [completedExercises, setCompletedExercises] = useState([]) 
  const [toast, setToast] = useState(null)

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

  const fetchWorkouts = async (studentId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_workouts')
      .select('*')
      .eq('student_id', studentId)
      .order('sequence_order', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (!error) setStudentWorkouts(data)
    
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

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const weekLogs = allLogs.filter(log => log.workout_date >= sevenDaysAgoStr)
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
      .select('*, sender:gym_students!sender_id(name)')
      .eq('receiver_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (notes) setSocialNotifications(notes)

    const { data: photos } = await supabase
      .from('gym_evolution_photos')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    
    if (photos) setEvolutionPhotos(photos)
    
    setLoading(false)
  }

  useEffect(() => {
    const user = localStorage.getItem('vollonfit_user')
    if (user) {
      const parsedUser = JSON.parse(user)
      setStudent(parsedUser)
      fetchWorkouts(parsedUser.id)
      
      const channel = supabase
        .channel('social_updates') 
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'gym_social_notifications',
            filter: `receiver_id=eq.${parsedUser.id}` 
          }, 
          (payload) => {
            showToast(payload.new.message, 'success')
            fetchWorkouts(parsedUser.id)
          }
        )
        .subscribe()

      const fetchFreshData = async () => {
        try {
          const { data, error } = await supabase
            .from('gym_students')
            .select('*')
            .eq('id', parsedUser.id)
            .single()
          if (data && !error) {
            setStudent(data)
            localStorage.setItem('vollonfit_user', JSON.stringify(data))
            fetchTeacherPlan(data.teacher_id)
            loadTheme(data.teacher_id)
          }
        } catch (e) {
          console.warn("Erro ao carregar dados do aluno:", e)
        }
      }
      fetchFreshData()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const fetchTeacherPlan = async (teacherId) => {
    if (!teacherId) return
    const { data } = await supabase.from('gym_teachers').select('plan_type').eq('id', teacherId).maybeSingle()
    if (data?.plan_type) setTeacherPlan(data.plan_type)
  }

  useEffect(() => {
    localStorage.setItem('vollonfit_student_tab', currentTab)
  }, [currentTab])

  useEffect(() => {
    localStorage.setItem('vollonfit_student_view', currentView)
  }, [currentView])

  useEffect(() => {
    if (currentView === 'executing' && (!workoutItems || workoutItems.length === 0)) {
      setCurrentView('home')
    }
  }, [currentView, workoutItems])

  const startWorkout = async (workout) => {
    setLoading(true)
    try {
      const { data: items, error: itemsError } = await supabase
        .from('gym_workout_items')
        .select('*, gym_exercises(*)')
        .eq('workout_id', workout.id)
        .order('sequence_order')

      if (itemsError) throw itemsError

      const { data: lastDateData } = await supabase
        .from('gym_training_logs')
        .select('workout_date')
        .eq('student_id', student.id)
        .eq('workout_id', workout.id)
        .order('workout_date', { ascending: false })
        .limit(1)

      const lastDate = lastDateData?.[0]?.workout_date
      let lastLogs = []

      if (lastDate) {
        const { data: logs } = await supabase
          .from('gym_training_logs')
          .select('*')
          .eq('student_id', student.id)
          .eq('workout_id', workout.id)
          .eq('workout_date', lastDate)
        
        lastLogs = logs || []
      }

      const itemsWithHistory = (items || []).map(item => {
        const history = lastLogs.filter(l => l.exercise_id === item.exercise_id)
        
        let iaSuggestion = null;
        if (history.length > 0) {
          const maxWeight = Math.max(...history.map(l => l.weight_kg || 0));
          const avgReps = history.reduce((acc, l) => acc + (l.reps_done || 0), 0) / history.length;
          let targetMax = 12;
          if (item.target_reps) {
             const match = item.target_reps.match(/\d+$/);
             if (match) targetMax = parseInt(match[0], 10);
          }
          if (avgReps >= targetMax && maxWeight > 0) {
            iaSuggestion = {
               weight: maxWeight + 2,
               message: "IA Coach: Tente aumentar a carga (+2kg)"
            }
          }
        }

        return {
          ...item,
          lastPerformance: history,
          iaSuggestion
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

          setCurrentView('workout-detail')
          showToast('Exercício concluído!')
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

  const todayDate = new Date()
  const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate)
    d.setDate(todayDate.getDate() - 6 + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      dayStr: d.toLocaleDateString('pt-BR', { weekday: 'short' })[0].toUpperCase(),
      dayNum: d.getDate(),
      dateStr,
      isToday: d.toDateString() === todayDate.toDateString(),
      hasTrained: (workoutHistory || []).includes(dateStr)
    }
  })

  const sortedWorkouts = [...(studentWorkouts || [])].sort((a, b) => {
    const timeA = workoutLastPerformed[a.id] || 0
    const timeB = workoutLastPerformed[b.id] || 0
    return timeA - timeB
  })
  
  const suggestedWorkout = sortedWorkouts[0]
  const uniqueFilters = ['Todos', ...new Set((studentWorkouts || []).map(w => w.description || 'Foco').filter(Boolean))]
  const filteredWorkouts = (studentWorkouts || []).filter(w => {
    if (activeFilter === 'Todos') return true;
    return (w.description || 'Foco') === activeFilter;
  })

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-primary/20 flex flex-col items-center">
      <div className="w-full max-w-md bg-black min-h-screen flex flex-col relative pb-32">
        <header className="px-6 py-8 flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden group active:scale-95 transition-transform cursor-pointer">
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                {student?.name?.[0] || 'A'}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">OLÁ {student?.name?.split(' ')?.[0] || 'ALUNO'}</p>
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-slate-300">VollonFit Gym</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('profile')}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary transition-all active:scale-90 relative"
          >
            <Activity className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border border-black"></span>
          </button>
        </header>

        <main className="px-6 pb-10 space-y-8">
          {toast && (
            <div className="fixed top-24 left-8 right-8 z-[100] animate-in slide-in-from-top-10 duration-500">
              <div className={`flex items-center gap-3 px-6 py-5 rounded-[32px] shadow-2xl border backdrop-blur-md ${
                toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-secondary/90 border-slate-700 text-white'
              }`}>
                {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-primary" />}
                <span className="font-bold text-sm tracking-tight">{toast.message}</span>
              </div>
            </div>
          )}

          {currentTab === 'train' && currentView === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="mb-8 mt-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black font-display text-white">Sua Frequência</h2>
                </div>
                <div className="flex justify-between">
                  {currentWeekDays.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <span className={`text-[10px] font-bold ${d.isToday ? 'text-primary' : 'text-slate-500'}`}>{d.dayStr}</span>
                      <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-sm font-bold transition-all relative ${
                        d.isToday ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/20' : 'text-slate-400 bg-white/5 border border-white/5'
                      }`}>
                        {d.dayNum}
                        {d.hasTrained && (
                          <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${d.isToday ? 'bg-black' : 'bg-primary shadow-[0_0_5px_#DFFF5E]'}`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {suggestedWorkout && (
                <section className="bg-primary p-6 rounded-[32px] flex items-center justify-between group overflow-hidden relative mb-8 shadow-lg shadow-primary/20">
                  <div className="relative z-10 flex-1">
                    <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-1">Treino Sugerido</p>
                    <h3 className="text-xl font-black text-black leading-tight mb-4 font-display pr-4 line-clamp-2">
                      {suggestedWorkout.name}
                    </h3>
                    <button 
                      onClick={() => startWorkout(suggestedWorkout)}
                      className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Começar Agora
                    </button>
                  </div>
                  <div className="w-32 h-32 bg-black/5 rounded-full flex items-center justify-center absolute -right-8 -top-8">
                     <Dumbbell className="w-16 h-16 text-black/10 -rotate-45" />
                  </div>
                  <div className="relative z-10 w-20 h-20 flex items-center justify-center">
                     <Flame className="w-12 h-12 text-black opacity-80" />
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 gap-4 mb-10 mt-8">
                <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 group hover:border-accent/30 transition-all shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Volume da Semana</p>
                       <p className="text-2xl font-black text-white font-display">{weeklyStats?.volume || 0} <span className="text-xs font-bold text-slate-500">kg</span></p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 group hover:border-primary/30 transition-all shadow-lg">
                   <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Novos Recordes</p>
                         <p className="text-2xl font-black text-white font-display">{weeklyStats?.prs || 0}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-white font-display">Seus Treinos</h3>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                  {uniqueFilters.map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        activeFilter === filter 
                        ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                        : 'bg-[#1A1A1A] text-slate-500 hover:text-white border border-white/5'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {filteredWorkouts.map(workout => (
                  <button 
                    key={workout.id}
                    onClick={() => startWorkout(workout)}
                    className="w-full bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <Dumbbell className="w-7 h-7" />
                      </div>
                      <div className="text-left relative">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white font-display mb-1">{workout.name}</h4>
                          {completedWorkoutsThisWeek.has(workout.id) && (
                            <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              <span className="text-[8px] font-black text-primary uppercase">Feito</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{workout.description || 'Foco'}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                           <span className="text-[10px] font-bold text-primary uppercase">30 min</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-black transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        {currentTab === 'evolution' && (
          <EvolutionView 
            records={bioRecords} 
            prs={personalRecords}
            history={workoutHistory}
            photos={evolutionPhotos}
            studentId={student?.id}
            onNewRecord={() => setIsBioModalOpen(true)} 
            onPhotosUpdate={(newPhotos) => setEvolutionPhotos(newPhotos)}
            showToast={showToast}
          />
        )}

        {currentTab === 'nutrition' && (
          <NutritionTab studentId={student?.id} showToast={showToast} />
        )}

        {currentTab === 'marketplace' && (
          <MarketplaceTab showToast={showToast} />
        )}

        {isBioModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] w-full max-w-md rounded-[40px] p-8 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4">Novo Registro de Biopedância</h2>
              <p className="text-slate-400 mb-6">Funcionalidade de modal em desenvolvimento.</p>
              <button onClick={() => setIsBioModalOpen(false)} className="w-full bg-primary text-black py-4 rounded-full font-black uppercase">Fechar</button>
            </div>
          </div>
        )}

        {isConfigModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] w-full max-w-md rounded-[40px] p-8 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4">Configurações</h2>
              <p className="text-slate-400 mb-6">Funcionalidade de configuração em desenvolvimento.</p>
              <button onClick={() => setIsConfigModalOpen(false)} className="w-full bg-primary text-black py-4 rounded-full font-black uppercase">Fechar</button>
            </div>
          </div>
        )}

        {isGoalsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] w-full max-w-md rounded-[40px] p-8 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4">Metas</h2>
              <p className="text-slate-400 mb-6">{student?.goals || 'Nenhuma meta definida.'}</p>
              <button onClick={() => setIsGoalsModalOpen(false)} className="w-full bg-primary text-black py-4 rounded-full font-black uppercase">Fechar</button>
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <ProfileTab 
            student={student} 
            totalWorkouts={workoutHistory.length}
            onOpenConfig={() => setIsConfigModalOpen(true)} 
            onOpenGoals={() => setIsGoalsModalOpen(true)}
            showToast={showToast}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'social' && (
          <SquadTab 
            student={student} 
            showToast={showToast} 
          />
        )}

        {currentTab === 'train' && currentView === 'workout-detail' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-slate-500 mb-6 font-bold text-sm">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-2xl font-bold text-white mb-2 font-display uppercase tracking-tight">{selectedWorkout?.name}</h2>
            <div className="flex gap-4 mb-8">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">{(workoutItems || []).length} Exercícios</span>
              <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">~45 min</span>
            </div>

            <div className="space-y-4 mb-10">
              {(workoutItems || []).map((item, idx) => {
                const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises
                if (!item) return null
                const isCompleted = completedExercises.includes(ex?.id)

                return (
                  <button 
                    key={idx} 
                    onClick={() => startExecution(idx)}
                    className={`w-full flex items-center gap-4 p-5 rounded-[32px] border transition-all active:scale-[0.98] ${
                      isCompleted 
                      ? 'bg-primary/5 border-primary/20 opacity-80' 
                      : 'bg-[#1A1A1A] border-white/5'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center overflow-hidden shrink-0">
                      {ex?.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <Dumbbell className="w-6 h-6 text-slate-500" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-black font-display leading-tight ${isCompleted ? 'text-primary' : 'text-white'}`}>
                        {ex?.name || 'Exercício'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item?.target_sets || 3} séries • {item?.target_reps || '10-12'} reps</p>
                    </div>
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={async () => {
                if (completedExercises.length === 0) {
                  showToast('Faça pelo menos um exercício!', 'error')
                  return
                }

                const totalWeight = (workoutSummary?.exerciseLogs || []).reduce((acc, log) => {
                  return acc + (log.weight * log.reps)
                }, 0)
                setWorkoutSummary(prev => ({ ...prev, totalWeight }))
                
                // GymRats: Postar no Feed do Squad
                const { data: squadMember, error: squadErr } = await supabase
                  .from('gym_squad_members')
                  .select('squad_id')
                  .eq('student_id', student.id)
                  .maybeSingle()

                if (squadErr) console.error("Erro ao buscar squad do aluno:", squadErr)

                 if (squadMember?.squad_id) {
                  try {
                    // 1. Postar no Feed
                    await supabase.from('gym_squad_posts').insert([{
                      squad_id: squadMember.squad_id,
                        student_id: student.id,
                      type: 'check-in',
                      content: `Finalizou o treino: ${selectedWorkout.name}! 🔥💪 Volume: ${totalWeight}kg.`
                    }])

                    // 2. Calcular e Salvar Pontos
                    const pointsConstancy = 100
                    const pointsIntensity = Math.min(200, Math.floor(totalWeight / 10))
                    
                    // Bônus de Frequência (4x na semana)
                    let pointsBonus = 0
                    const today = new Date()
                    const startOfWeek = new Date(today)
                    startOfWeek.setDate(today.getDate() - today.getDay())
                    const dateStr = startOfWeek.toISOString().split('T')[0]

                    const { count } = await supabase
                      .from('gym_training_logs')
                      .select('*', { count: 'exact', head: true })
                      .eq('student_id', student.id)
                      .gte('workout_date', dateStr)

                    if (count === 4) { // No 4º treino ele ganha o bônus
                      pointsBonus = 500
                    }

                    const totalPoints = pointsConstancy + pointsIntensity + pointsBonus

                    console.log("Calculando pontos GymRats:", { totalWeight, totalPoints, bonus: pointsBonus })

                    const { error: scoreError } = await supabase.from('gym_squad_score_logs').insert([{
                      squad_id: squadMember.squad_id,
                      student_id: student.id,
                      points: totalPoints,
                      category: 'workout_completion',
                      reason: `Concluiu o treino: ${selectedWorkout.name}`
                    }])

                    if (scoreError) {
                      console.error("Erro ao salvar pontos:", scoreError)
                      showToast('Erro ao salvar seus pontos no Squad.', 'error')
                    } else {
                      showToast(`+${totalPoints} PONTOS! ${pointsBonus > 0 ? '🎁 BÔNUS DE CONSTÂNCIA!' : '🏆🔥'}`)
                    }
                  } catch (err) {
                    console.error("Falha no processo de pontos:", err)
                  }
                } else {
                  console.log("Aluno não está em um Squad. Pontos ignorados.")
                  showToast('Treino finalizado! Entre em um Squad para ganhar pontos. 🔥')
                }

                setCurrentView('summary')
              }}
              className="w-full fitness-gradient hover:opacity-90 text-black font-black py-6 rounded-[32px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all text-xl mt-8 neon-shadow font-display uppercase"
            >
              Finalizar Treino <CheckCircle2 className="w-7 h-7" />
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50">
        <div className="pill-nav p-2 flex justify-between items-center px-4">
          <button 
            onClick={() => {
              setCurrentTab('train')
              setCurrentView('home')
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'train' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentTab('evolution')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'evolution' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentTab('social')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'social' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (teacherPlan !== 'premium') {
                showToast('Funcionalidade disponível apenas para alunos de professores Premium 🔥', 'error')
                return
              }
              setCurrentTab('nutrition')
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
              currentTab === 'nutrition' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Flame className="w-5 h-5" />
            {teacherPlan !== 'premium' && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5 border border-black shadow-sm">
                <Shield className="w-2 h-2" />
              </div>
            )}
          </button>
          <button 
            onClick={() => setCurrentTab('marketplace')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'marketplace' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentTab('profile')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'profile' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </div>
    </div>
  )
}



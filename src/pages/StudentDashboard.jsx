import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  Activity, 
  TrendingUp, 
  User as UserIcon, 
  LogOut, 
  Play, 
  CheckCircle2, 
  ChevronLeft,
  Timer,
  Info,
  ChevronRight,
  ClipboardList,
  TrendingDown,
  Scale,
  Flame,
  Plus,
  X,
  AlertCircle,
  Heart,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { getTodayLocally } from '../utils/dateUtils'
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

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [currentTab, setCurrentTab] = useState(() => localStorage.getItem('vollonfit_student_tab') || 'train')
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('vollonfit_student_view') || 'home') // 'home', 'workout-detail', 'executing'
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [workoutItems, setWorkoutItems] = useState([])
  const [studentWorkouts, setStudentWorkouts] = useState([])
  const [bioRecords, setBioRecords] = useState([])
  const [personalRecords, setPersonalRecords] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [partner, setPartner] = useState(null)
  const [socialNotifications, setSocialNotifications] = useState([])
  const [evolutionPhotos, setEvolutionPhotos] = useState([])
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0)
  const [weeklyStats, setWeeklyStats] = useState({ volume: 0, prs: 0 })
  const [workoutLastPerformed, setWorkoutLastPerformed] = useState({})
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [partnerWeeklyVolume, setPartnerWeeklyVolume] = useState(0)
  const [partnerTrainedToday, setPartnerTrainedToday] = useState(false)
  const [isPinging, setIsPinging] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workoutSummary, setWorkoutSummary] = useState(null) // { totalWeight: 0, exercises: [] }
  const [completedExercises, setCompletedExercises] = useState([]) // IDs dos exercícios concluídos na sessão
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
      .order('created_at', { ascending: false })
    
    if (!error) setStudentWorkouts(data)
    
    // Buscar Biopedância
    const { data: bioData } = await supabase
      .from('gym_biopedance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('record_date', { ascending: true })
    
    if (bioData) setBioRecords(bioData)

    // Buscar histórico completo (Para calendário, PRs e Last Performed)
    const { data: allLogs, error: prError } = await supabase
      .from('gym_training_logs')
      .select('exercise_id, weight_kg, reps_done, workout_date, workout_id, created_at, gym_exercises(name)')
      .eq('student_id', studentId)
      
    let currentPrs = []
    
    if (!prError && allLogs) {
      // 1. Calendário Geral
      const uniqueDates = Array.from(new Set(allLogs.map(h => h.workout_date)))
      setWorkoutHistory(uniqueDates)

      // 2. Recordes Pessoais (PRs)
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

      // 3. Estatísticas da Semana (Últimos 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const weekLogs = allLogs.filter(log => log.workout_date >= sevenDaysAgoStr)

      // Dias de treino na semana
      const uniqueDaysThisWeek = new Set(weekLogs.map(l => l.workout_date)).size
      setWeeklyWorkouts(uniqueDaysThisWeek)

      // Volume da semana
      const vol = weekLogs.reduce((acc, log) => acc + ((log.weight_kg || 0) * (log.reps_done || 0)), 0)
      
      // PRs da semana
      const prsCount = currentPrs.filter(pr => pr.record_date >= sevenDaysAgoStr).length
      
      setWeeklyStats({ volume: vol, prs: prsCount })

      // 4. Última vez que cada treino foi feito
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

    // Buscar parceiro se houver
    const { data: freshStudent } = await supabase.from('gym_students').select('partner_id').eq('id', studentId).single()
    if (freshStudent?.partner_id) {
      const { data: pData } = await supabase.from('gym_students').select('*').eq('id', freshStudent.partner_id).single()
      if (pData) setPartner(pData)
      
      const { data: notes } = await supabase
        .from('gym_social_notifications')
        .select('*, sender:gym_students!sender_id(name)')
        .eq('receiver_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (notes) setSocialNotifications(notes)

      // Fetch partner's volume and today's workout
      const sevenDaysAgoP = new Date()
      sevenDaysAgoP.setDate(sevenDaysAgoP.getDate() - 7)
      const sevenDaysAgoStrP = sevenDaysAgoP.toISOString().split('T')[0]
      const todayStr = getTodayLocally()
      
      const { data: pLogs } = await supabase
        .from('gym_training_logs')
        .select('weight_kg, reps_done, workout_date')
        .eq('student_id', freshStudent.partner_id)
        .gte('workout_date', sevenDaysAgoStrP)
        
      if (pLogs) {
        const pVol = pLogs.reduce((acc, log) => acc + ((log.weight_kg || 0) * (log.reps_done || 0)), 0)
        setPartnerWeeklyVolume(pVol)
        setPartnerTrainedToday(pLogs.some(log => log.workout_date === todayStr))
      }
    }

    // Buscar fotos de evolução
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
      
      // Buscar dados atualizados do aluno (metas)
      const fetchFreshData = async () => {
        try {
          const { data, error } = await supabase
            .from('gym_students')
            .select('*')
            .eq('id', parsedUser.id)
            .single()
          if (data && !error) {
            setStudent(data)
            // Atualizar localStorage com os dados mais recentes (incluindo goals)
            localStorage.setItem('vollonfit_user', JSON.stringify(data))
          }
        } catch (e) {
          console.warn("Erro ao carregar dados do aluno:", e)
        }
      }
      fetchFreshData()
    } else {
      navigate('/', { replace: true })
    }
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
      // 1. Buscar itens do treino
      const { data: items, error: itemsError } = await supabase
        .from('gym_workout_items')
        .select('*, gym_exercises(*)')
        .eq('workout_id', workout.id)
        .order('sequence_order')

      if (itemsError) throw itemsError

      // 2. Buscar a data da última vez que este treino foi realizado
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
        // 3. Buscar os logs daquela data específica para este treino
        const { data: logs } = await supabase
          .from('gym_training_logs')
          .select('*')
          .eq('student_id', student.id)
          .eq('workout_id', workout.id)
          .eq('workout_date', lastDate)
        
        lastLogs = logs || []
      }

      // 4. Mapear itens com seus respectivos logs anteriores
      const itemsWithHistory = (items || []).map(item => ({
        ...item,
        lastPerformance: lastLogs.filter(l => l.exercise_id === item.exercise_id)
      }))

      setSelectedWorkout(workout)
      setWorkoutItems(itemsWithHistory)
      setWorkoutSummary({ totalWeight: 0, exerciseLogs: [] })
      setCompletedExercises([]) // Reseta ao iniciar novo treino
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

  if (currentView === 'executing' && (!workoutItems || workoutItems.length === 0)) {
    setCurrentView('home')
    return null
  }

  if (currentView === 'executing') {
    return (
      <ExecutionView 
        key={currentExerciseIndex} // Chave para resetar estado interno ao mudar exercício
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

  // Lógica da Semana Atual (Home)
  const todayDate = new Date()
  const currentDayOfWeek = todayDate.getDay() // 0 (Sun) to 6 (Sat)
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  
  const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate)
    d.setDate(todayDate.getDate() + mondayOffset + i)
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
  
  // Se só existe 1 treino, e ele já foi feito hoje, não precisamos sugerir "outro", mas sugerimos o mesmo (único possível).
  // A UI mostrarÃ¡ normalmente.
  const suggestedWorkout = sortedWorkouts[0]
  
  // Filtros Dinâmicos (Item 4)
  const uniqueFilters = ['Todos', ...new Set((studentWorkouts || []).map(w => w.description || 'Foco').filter(Boolean))]
  const filteredWorkouts = (studentWorkouts || []).filter(w => {
    if (activeFilter === 'Todos') return true;
    return (w.description || 'Foco') === activeFilter;
  })

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-primary/20 flex flex-col items-center">
      <div className="w-full max-w-md bg-black min-h-screen flex flex-col relative pb-32">
        {/* Premium Header */}
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
          {/* Toast Notification (Top Layer) */}
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
              
              {/* Calendário Semanal (Sua Frequência) */}
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

              {/* Treino do Dia (Challenge Card) */}
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

              {/* Estatísticas da Semana (Item 3) */}
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
                
                {/* Filtros Dinâmicos */}
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
                      <div className="text-left">
                        <h4 className="text-base font-black text-white font-display mb-1">{workout.name}</h4>
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

        {isBioModalOpen && (
          <BioModal 
            studentId={student?.id} 
            onClose={() => setIsBioModalOpen(false)} 
            showToast={showToast}
            onSave={() => {
              setIsBioModalOpen(false);
              if (student?.id) fetchWorkouts(student.id);
            }} 
          />
        )}

        {isConfigModalOpen && (
          <ConfigModal 
            student={student} 
            onClose={() => setIsConfigModalOpen(false)} 
            showToast={showToast}
            onSave={(updatedUser) => {
              setStudent(updatedUser)
              localStorage.setItem('vollonfit_user', JSON.stringify(updatedUser))
              setIsConfigModalOpen(false)
              showToast('Perfil atualizado!')
            }} 
          />
        )}

        {isGoalsModalOpen && (
          <GoalsModal 
            goals={student?.goals} 
            onClose={() => setIsGoalsModalOpen(false)} 
          />
        )}

        {currentTab === 'profile' && (
          <ProfileTab 
            student={student} 
            onOpenConfig={() => setIsConfigModalOpen(true)} 
            onOpenGoals={() => setIsGoalsModalOpen(true)}
            showToast={showToast}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'social' && (
          <SocialTab 
            student={student} 
            partner={partner} 
            weeklyStats={weeklyStats} 
            partnerWeeklyVolume={partnerWeeklyVolume} 
            partnerTrainedToday={partnerTrainedToday} 
            socialNotifications={socialNotifications} 
            isPinging={isPinging} 
            setIsPinging={setIsPinging} 
            showToast={showToast} 
            fetchWorkouts={() => fetchWorkouts(student.id)} 
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
                
                if (student?.partner_id) {
                  await supabase.from('gym_social_notifications').insert([{
                    sender_id: student.id,
                    receiver_id: student.partner_id,
                    type: 'workout_finished',
                    message: `${student.name} just crushed ${selectedWorkout.name}! ðŸ”¥`
                  }])
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

      {/* Floating Pill Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50">
        <div className="pill-nav p-2 flex justify-between items-center px-4">
          <button 
            onClick={() => {
              setCurrentTab('train')
              setCurrentView('home')
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'train' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Activity className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentTab('evolution')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'evolution' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentTab('social')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'social' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Dumbbell className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentTab('profile')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'profile' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <UserIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>
    </div>
    </div>
  )
}

function ExecutionView({ workout, exercises = [], exerciseIndex, studentId, onNext, onBack, onLogSet, showToast }) {
  const item = (exercises || [])[exerciseIndex]
  const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises

  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [exerciseNotes, setExerciseNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Carregar notas do exercÃ­cio
  useEffect(() => {
    const fetchNotes = async () => {
      if (!ex?.id || !studentId) return
      const { data } = await supabase
        .from('gym_student_exercise_notes')
        .select('notes')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .single()
      
      if (data) setExerciseNotes(data.notes)
    }
    fetchNotes()
  }, [ex?.id, studentId])

  // LÃ³gica do Timer
  useEffect(() => {
    let interval = null
    if (isTimerActive && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining(prev => prev - 1)
      }, 1000)
    } else if (restRemaining === 0 && isTimerActive) {
      setIsTimerActive(false)
      // VibraÃ§Ã£o ao terminar (se suportado pelo navegador/celular)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    return () => clearInterval(interval)
  }, [isTimerActive, restRemaining])

  if (!ex) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    const { error } = await supabase
      .from('gym_student_exercise_notes')
      .upsert({
        student_id: studentId,
        exercise_id: ex.id,
        notes: exerciseNotes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,exercise_id' })
    
    setIsSavingNotes(false)
    showToast('Note saved!')
  }

  const startRestTimer = () => {
    const timeStr = item?.rest_time || '60s'
    const seconds = parseInt(timeStr.replace('s', '')) || 60
    setRestRemaining(seconds)
    setIsTimerActive(true)
  }

  const handleNextSet = async () => {
    if (!weight || !reps) {
      showToast('Enter weight and reps!', 'error')
      return
    }

    setIsSaving(true)
    
    // Salvar log da série no Supabase
    const { error } = await supabase
      .from('gym_training_logs')
      .insert([{
        student_id: studentId,
        workout_id: workout.id,
        exercise_id: ex.id,
        set_number: currentSet,
        reps_done: parseInt(reps),
        weight_kg: parseFloat(weight),
        workout_date: getTodayLocally()
      }])

    if (!error) {
      if (onLogSet) onLogSet({ weight: parseFloat(weight), reps: parseInt(reps) })
      showToast(`Set ${currentSet} saved!`)
    }

    if (currentSet < (item?.target_sets || 1)) {
      setCurrentSet(prev => prev + 1)
      setReps('')
      startRestTimer()
    } else {
      onNext()
    }
    setIsSaving(false)
  }

  const lastPerf = item?.lastPerformance || []
  const lastBestSet = lastPerf.length > 0 ? [...lastPerf].sort((a, b) => b.weight_kg - a.weight_kg)[0] : null

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-20">
        <div 
          className="h-full bg-primary transition-all duration-700 shadow-[0_0_15px_#DFFF5E]" 
          style={{ width: `${((exerciseIndex) / exercises.length) * 100}%` }}
        />
      </div>

      <header className="px-6 py-8 flex justify-between items-center relative z-10">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Exercício {exerciseIndex + 1} de {exercises.length}</p>
          <h2 className="text-white font-black text-lg font-display leading-tight uppercase tracking-tight">{ex?.name}</h2>
        </div>
        <div className="w-12 h-12" />
      </header>

      <div className="flex-1 px-6 pb-10 flex flex-col animate-in slide-in-from-bottom-12 duration-700 overflow-y-auto space-y-8">
        <div className="w-full aspect-video rounded-[32px] bg-[#1A1A1A] overflow-hidden border border-white/5 shadow-inner flex items-center justify-center group relative">
          {ex?.gif_url ? (
            <img src={ex.gif_url} className="w-full h-full object-contain p-4" />
          ) : (
            <Dumbbell className="w-16 h-16 text-white/10" />
          )}
          
          {lastBestSet && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Melhor Marca (PR)</p>
                  <p className="text-sm font-black text-white">{lastBestSet.weight_kg}kg <span className="text-slate-500 font-bold">Ã— {lastBestSet.reps_done}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 flex flex-col gap-8 shadow-2xl relative">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Série Atual</p>
              <p className="text-5xl font-black text-white font-display">{currentSet}<span className="text-slate-700 text-2xl font-normal ml-2">/ {item?.target_sets || 1}</span></p>
            </div>
            <div className={`px-6 py-3 rounded-full flex flex-col items-center border transition-all duration-500 ${isTimerActive ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10'}`}>
               <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${isTimerActive ? 'animate-pulse' : 'text-slate-500'}`} />
                  <p className={`text-sm font-black font-display`}>
                    {isTimerActive ? `${restRemaining}s` : 'DESCANSO'}
                  </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Carga (KG)</label>
              <input 
                type="number" 
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 text-2xl font-black text-primary text-center outline-none focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Repetições</label>
              <input 
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="0"
                className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 text-2xl font-black text-primary text-center outline-none focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* AnotaÃ§Ãµes de Ajuste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AnotaÃ§Ãµes de Ajuste</span>
              </div>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-[10px] font-black text-primary uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-full hover:bg-primary/10 transition-all"
              >
                {isSavingNotes ? '...' : 'Salvar'}
              </button>
            </div>
            <textarea 
              value={exerciseNotes}
              onChange={e => setExerciseNotes(e.target.value)}
              placeholder="Ex: Banco no 4, pegada aberta..."
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-primary/30 placeholder:text-slate-600 resize-none min-h-[60px]"
            />
          </div>
        </div>

        <button 
          onClick={handleNextSet}
          disabled={isSaving}
          className="w-full fitness-gradient hover:opacity-90 text-white font-black py-7 rounded-[32px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all text-xl mt-12 disabled:opacity-50 neon-shadow"
        >
          {isSaving ? 'Gravando...' : (currentSet < (item?.target_sets || 1) ? 'Concluir SÃ©rie' : 'PrÃ³ximo ExercÃ­cio')} 
          <CheckCircle2 className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

function WorkoutSummaryView({ summary, workout, onClose }) {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans max-w-md mx-auto animate-in fade-in duration-500 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-primary/20">
          <CheckCircle2 className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(223,255,94,0.8)]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white font-display">Treino Concluído!</h2>
          <p className="text-slate-400 font-medium">Você esmagou o {workout?.name} hoje.</p>
        </div>

        <div className="w-full bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-2">Volume Total de Carga</p>
            <p className="text-5xl font-black text-primary font-display">{summary?.totalWeight || 0}<span className="text-xl font-bold ml-1 text-primary/70">kg</span></p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Exercícios</p>
              <p className="text-xl font-bold text-white font-display">{(summary?.exerciseLogs || []).length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
              <p className="text-xl font-bold text-primary font-display">Evoluindo</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-white text-black font-black py-5 rounded-[32px] active:scale-95 transition-all text-lg shadow-xl shadow-white/10 uppercase tracking-widest font-display"
        >
          Voltar para Home
        </button>
      </main>
    </div>
  )
}

function EvolutionView({ records = [], prs = [], history = [], photos = [], studentId, onNewRecord, onPhotosUpdate, showToast }) {
  const [isUploading, setIsUploading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState(null)
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('evolution_photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('evolution_photos')
        .getPublicUrl(filePath)

      const { data: newPhoto, error: dbError } = await supabase
        .from('gym_evolution_photos')
        .insert([{
          student_id: studentId,
          photo_url: publicUrl,
          caption: 'Check-in de Evolução'
        }])
        .select()
        .single()

      if (dbError) throw dbError
      
      onPhotosUpdate([newPhoto, ...photos])
      showToast('Foto de evoluÃ§Ã£o salva!', 'success')
    } catch (err) {
      console.error('Erro no upload:', err)
      showToast('Erro no Upload: ' + (err.message || err.error_description || 'Verifique o bucket'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return
    const { id, url } = photoToDelete
    setIsUploading(true) 
    
    try {
      const pathParts = url.split('evolution_photos/')
      const filePath = pathParts[pathParts.length - 1]

      const { error: storageError } = await supabase.storage
        .from('evolution_photos')
        .remove([filePath])
      
      if (storageError) console.warn('Erro ao remover do storage (pode jÃ¡ nÃ£o existir):', storageError)

      const { error: dbError } = await supabase
        .from('gym_evolution_photos')
        .delete()
        .eq('id', id)
      
      if (dbError) throw dbError

      onPhotosUpdate(photos.filter(p => p.id !== id))
      showToast('Foto excluÃ­da com sucesso.', 'success')
      setPhotoToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir foto:', err)
      showToast('Erro ao Excluir: ' + (err.message || 'Erro de permissÃ£o'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const latest = (records || []).length > 0 ? records[records.length - 1] : null
  
  const chartData = (records || []).map(r => ({
    date: r?.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
    weight: r?.weight || 0,
    fat: r?.body_fat_pct || 0,
    muscle: r?.muscle_mass_kg || 0
  }))

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' })
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      day,
      hasTrained: (history || []).includes(dateStr)
    }
  })

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Sua Jornada</p>
        <h1 className="text-4xl font-black text-white font-display">Sua Evolução</h1>
      </header>

      {/* Calendário de Frequência */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display capitalize">{monthName}</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase bg-[#1A1A1A] px-4 py-2 rounded-full border border-white/5">Frequência</span>
        </div>
        
        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-[10px] font-black text-slate-500 text-center uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(d => (
              <div 
                key={d.day}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  d.hasTrained 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-110' 
                  : 'bg-black text-slate-600 border border-white/5'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SeÃ§Ã£o de Recordes Pessoais (TrofÃ©us) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display">Hall de Recordes</h3>
          <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20">ðŸ† {prs.length} Marcas</span>
        </div>

        {(prs || []).length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {prs.map((pr, idx) => (
              <div key={idx} className="flex-shrink-0 w-40 bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 shadow-lg flex flex-col items-center text-center group hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-black text-white font-display mb-1 line-clamp-1">{pr.exercise_name}</h4>
                <p className="text-2xl font-black text-primary font-display">{pr.max_weight}<span className="text-[10px] ml-1 uppercase text-slate-500">kg</span></p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">{new Date(pr.record_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 text-center shadow-lg">
            <p className="text-xs text-slate-500 font-bold">Treine para registrar seus primeiros recordes!</p>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black text-white font-display">Composição Corporal</h3>
        <button 
          onClick={onNewRecord}
          className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center gap-2 border border-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo Registro
        </button>
      </div>

      {!records || records.length === 0 ? (
        <div className="bg-[#1A1A1A] p-10 rounded-[40px] border border-white/5 text-center space-y-4 shadow-2xl">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-500 text-sm">Registre sua primeira biopedância para começar a ver sua evolução!</p>
          <button 
            onClick={onNewRecord}
            className="bg-primary text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <>
          {/* Gráfico Principal */}
          <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" /> Peso Corporal (kg)
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                Últimos {records.length} registros
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DFFF5E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DFFF5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}}
                    itemStyle={{color: '#DFFF5E'}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px', color: '#94a3b8'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#DFFF5E" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
              <h3 className="font-bold text-white text-xs mb-4 flex items-center gap-2">
                <Flame className="w-3 h-3 text-orange-500" /> Gordura (%)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
              <h3 className="font-bold text-white text-xs mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-accent" /> Músculo (kg)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="muscle" stroke="#C6C4FF" strokeWidth={3} dot={{r: 4, fill: '#C6C4FF'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Diário de Evolução (Fotos) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display">Diário Visual</h3>
          <label className="cursor-pointer bg-primary text-black px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            {isUploading ? 'Subindo...' : 'Novo Check-in'}
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-[4/5] rounded-[32px] overflow-hidden group border border-white/10 shadow-md">
                <img src={p.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Evolução" />
                
                {/* Botão Excluir */}
                <button 
                  onClick={() => setPhotoToDelete({ id: p.id, url: p.photo_url })}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90 border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                  <p className="text-[8px] font-bold text-white uppercase tracking-widest">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-black border-2 border-dashed border-white/10 p-12 rounded-[40px] text-center space-y-4">
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-white/5">
              <ImageIcon className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Sua transformação merece ser vista. <br/> Comece seu histórico hoje!
            </p>
          </div>
        )}
      </section>

      {records && records.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Histórico Completo</h3>
          <div className="space-y-3">
            {(records || []).slice().reverse().map((r, i) => (
              <div key={i} className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5 flex items-center justify-between s                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Peso: <b className="text-slate-300">{r.weight || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Gordura: <b className="text-slate-300">{r.body_fat_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Músculo: <b className="text-slate-300">{r.muscle_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Visceral: <b className="text-slate-300">{r.visceral_fat || '-'}</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Água: <b className="text-slate-300">{r.body_water_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Óssea: <b className="text-slate-300">{r.bone_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Idade: <b className="text-slate-300">{r.body_age || '-'}</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">IMC: <b className="text-slate-300">{r.bmi || '-'}</b></span>
                  </div>
/b></span>
                    <span className="text-[10px] text-slate-500 font-medium">IMC: <b className="text-slate-300">{r.bmi || '-'}</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-sm">{r.tmb || 0} kcal</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">TMB</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de ConfirmaÃ§Ã£o Customizado */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] w-full max-w-xs rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center border border-white/10">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white font-display mb-2">Excluir Foto?</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8">Esta aÃ§Ã£o nÃ£o pode ser desfeita.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleDeletePhoto}
                disabled={isUploading}
                className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Excluindo...' : 'Confirmar ExclusÃ£o'}
              </button>
              <button 
                onClick={() => setPhotoToDelete(null)}
                disabled={isUploading}
                className="w-full bg-black text-slate-400 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all disabled:opacity-50 border border-white/5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BioModal({ studentId, onClose, onSave, showToast }) {
  const [record, setRecord] = useState({
    weight: '',
    body_fat_pct: '',
    muscle_mass_kg: '',
    tmb: '',
    bmi: '',
    visceral_fat: '',
    body_water_pct: '',
    bone_mass_kg: '',
    body_age: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const { error } = await supabase
      .from('gym_biopedance_records')
      .insert([{
        student_id: studentId,
        weight: parseFloat(record.weight),
        body_fat_pct: parseFloat(record.body_fat_pct),
        muscle_mass_kg: parseFloat(record.muscle_mass_kg),
        tmb: parseInt(record.tmb),
        bmi: record.bmi ? parseFloat(record.bmi) : null,
        visceral_fat: record.visceral_fat ? parseInt(record.visceral_fat) : null,
        body_water_pct: record.body_water_pct ? parseFloat(record.body_water_pct) : null,
        bone_mass_kg: record.bone_mass_kg ? parseFloat(record.bone_mass_kg) : null,
        body_age: record.body_age ? parseInt(record.body_age) : null,
        record_date: getTodayLocally()
      }])

    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error')
    } else {
      showToast('Evolução registrada!')
      onSave()
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#1A1A1A] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden border border-white/10">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white font-display">Novo Registro</h3>
            <p className="text-sm text-slate-500">Acompanhe sua evolução corporal</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black rounded-full text-slate-500 border border-white/5">
            <ChevronLeft className="w-6 h-6 rotate-90" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (kg)</label>
              <input 
                required type="number" step="0.1" 
                value={record.weight}
                onChange={e => setRecord({...record, weight: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Gordura (%)</label>
              <input 
                required type="number" step="0.1" 
                value={record.body_fat_pct}
                onChange={e => setRecord({...record, body_fat_pct: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Músculo (kg)</label>
              <input 
                required type="number" step="0.1" 
                value={record.muscle_mass_kg}
                onChange={e => setRecord({...record, muscle_mass_kg: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">TMB (kcal)</label>
              <input 
                required type="number" 
                value={record.tmb}
                onChange={e => setRecord({...record, tmb: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">IMC</label>
              <input 
                type="number" step="0.1"
                value={record.bmi}
                onChange={e => setRecord({...record, bmi: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Gord. Visceral</label>
              <input 
                type="number" 
                value={record.visceral_fat}
                onChange={e => setRecord({...record, visceral_fat: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="0-20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ãgua (%)</label>
              <input 
                type="number" step="0.1"
                value={record.body_water_pct}
                onChange={e => setRecord({...record, body_water_pct: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Massa Óssea</label>
              <input 
                type="number" step="0.1"
                value={record.bone_mass_kg}
                onChange={e => setRecord({...record, bone_mass_kg: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Idade Corp.</label>
              <input 
                type="number" 
                value={record.body_age}
                onChange={e => setRecord({...record, body_age: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="00"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-primary text-black font-black py-6 rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all text-xl disabled:opacity-50 uppercase tracking-widest font-display"
          >
            {isSaving ? 'Salvando...' : 'Salvar Evolução'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ConfigModal({ student, onClose, onSave, showToast }) {
  const [formData, setFormData] = useState({
    name: student.name || '',
    age: student.age || '',
    height: student.height || '',
    initial_weight: student.initial_weight || '',
    password: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const updates = {
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      initial_weight: formData.initial_weight ? parseFloat(formData.initial_weight) : null,
    }

    if (formData.password.trim()) {
      updates.password = formData.password
    }

    const { data, error } = await supabase
      .from('gym_students')
      .update(updates)
      .eq('id', student.id)
      .select()
      .single()

    if (error) {
      showToast('Erro ao atualizar: ' + error.message, 'error')
    } else {
      onSave(data)
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#1A1A1A] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden border border-white/10">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white font-display">Configurar Conta</h3>
            <p className="text-sm text-slate-500">Mantenha seus dados atualizados</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black rounded-full text-slate-500 border border-white/5">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                required type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Idade</label>
                <input 
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                  placeholder="Ex: 25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Altura (m)</label>
                <input 
                  type="number" step="0.01"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                  placeholder="Ex: 1.75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Peso Inicial (kg)</label>
              <input 
                type="number" step="0.1"
                value={formData.initial_weight}
                onChange={e => setFormData({...formData, initial_weight: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="Ex: 80.5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alterar Senha</label>
              <input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-lg font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                placeholder="Deixe em branco para não alterar"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-primary text-black font-black py-5 rounded-[32px] shadow-xl shadow-primary/20 active:scale-95 transition-all text-xl disabled:opacity-50 uppercase tracking-widest font-display"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GoalsModal({ goals, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#1A1A1A] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden border border-white/10">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
          <div>
            <h3 className="text-2xl font-black text-white font-display">Minhas Metas</h3>
            <p className="text-sm text-slate-500">Definidas pelo seu professor</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black border border-white/5 rounded-full text-slate-500 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 pb-12">
          <div className="bg-black rounded-[32px] p-8 border border-white/5 min-h-[200px] flex items-center justify-center text-center shadow-inner">
            {goals ? (
              <p className="text-lg text-primary font-medium leading-relaxed italic font-display">
                "{goals}"
              </p>
            ) : (
              <p className="text-slate-500 italic">
                Nenhuma meta definida ainda. <br/> Converse com seu professor!
              </p>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-8 bg-white text-black font-black py-5 rounded-[32px] active:scale-95 transition-all text-xl uppercase tracking-widest font-display shadow-lg shadow-white/5"
          >
            Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ student, onOpenConfig, onOpenGoals, showToast, onLogout }) {
  const [allStudents, setAllStudents] = useState([])
  const [isLinking, setIsLinking] = useState(false)
  const [search, setSearch] = useState('')
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!student?.id) return
      try {
        const { data } = await supabase.from('gym_students').select('id, name, username').neq('id', student.id)
        if (data) setAllStudents(data)
      } catch (e) {
        console.warn("Erro ao buscar alunos:", e)
      }
    }
    fetchStudents()
  }, [student?.id])

  const handleLink = async (partnerId) => {
    if (isLinking) return
    setIsLinking(true)
    try {
      const { error } = await supabase
        .from('gym_students')
        .update({ partner_id: partnerId })
        .eq('id', student.id)
      
      if (error) throw error

      // VÃ­nculo recÃ­proco
      const { error: error2 } = await supabase.from('gym_students').update({ partner_id: student.id }).eq('id', partnerId)
      if (error2) throw error2

      showToast('Parceiro(a) vinculado com sucesso!', 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      console.error('Erro ao vincular:', err)
      showToast('Erro ao vincular. Verifique se as tabelas foram atualizadas.', 'error')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    if (isLinking) return
    setIsLinking(true)
    console.log('Iniciando desvÃ­nculo para:', student.id, 'Parceiro:', student.partner_id)
    try {
      const partnerId = student.partner_id
      
      const { error } = await supabase
        .from('gym_students')
        .update({ partner_id: null })
        .eq('id', student.id)
      
      if (error) {
        console.error('Erro ao desvincular self:', error)
        throw error
      }

      if (partnerId) {
        const { error: error2 } = await supabase
          .from('gym_students')
          .update({ partner_id: null })
          .eq('id', partnerId)
        if (error2) console.warn('Erro ao desvincular parceiro (pode ser RLS):', error2)
      }

      showToast('Vínculo desfeito com sucesso.', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      console.error('Erro fatal no desvínculo:', err)
      showToast('Erro ao desvincular: ' + (err.message || 'Erro de permissão'), 'error')
    } finally {
      setIsLinking(false)
    }
  }

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in fade-in duration-500 text-center py-10 space-y-12">
      <div>
        <div className="w-32 h-32 fitness-gradient rounded-[40px] flex items-center justify-center mx-auto mb-6 border-4 border-[#1A1A1A] shadow-2xl text-black text-5xl font-black font-display neon-shadow">
          {student?.name?.[0]}
        </div>
        <h2 className="text-3xl font-black text-white font-display">{student?.name}</h2>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs mt-2">@{student?.username}</p>
      </div>
      
      {/* Sistema de Parceria */}
      {!student?.partner_id ? (
        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
          <div className="text-left">
            <h3 className="font-black text-white font-display text-lg tracking-tight">Vincular Parceiro(a)</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Treinem juntos e motivem-se!</p>
          </div>
          <input 
            type="text"
            placeholder="Buscar por nome ou @username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-slate-700"
          />
          {search && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleLink(s.id)}
                  className="w-full p-4 bg-black hover:bg-primary/5 border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">@{s.username}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-600 group-hover:text-primary transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl space-y-4">
          <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center font-black shadow-lg shadow-primary/20">
                <Heart className="w-6 h-6 fill-black" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Seu Parceiro</p>
                <p className="text-lg font-black text-white font-display tracking-tight leading-none">Vínculo Ativo</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUnlinkConfirm(true)}
              className="p-3 bg-black text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500/10 transition-all shadow-sm active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {showUnlinkConfirm && (
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-rose-500 mb-3">Confirmar desvínculo?</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleUnlink}
                  disabled={isLinking}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                >
                  {isLinking ? '...' : 'Sim, Desvincular'}
                </button>
                <button 
                  onClick={() => setShowUnlinkConfirm(false)}
                  className="flex-1 bg-black text-slate-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={onOpenConfig}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Configurações da Conta</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        <button 
          onClick={onOpenGoals}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Metas e Objetivos</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={onLogout}
          className="w-full mt-4 p-6 text-center bg-rose-500/10 rounded-[32px] border border-rose-500/20 flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all text-rose-500 active:scale-95 shadow-xl shadow-rose-500/5"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest font-display text-sm">Sair da Conta</span>
        </button>
      </div>
    </div>
  )
}

function SocialTab({ student, partner, weeklyStats, partnerWeeklyVolume, partnerTrainedToday, socialNotifications, isPinging, setIsPinging, showToast, fetchWorkouts }) {
  const handlePing = async () => {
    if (!partner) return
    setIsPinging(true)
    const { error } = await supabase.from('gym_social_notifications').insert([{
      sender_id: student.id,
      receiver_id: partner.id,
      type: 'ping',
      message: `${student.name} mandou um PING! Bora treinar! 💪`
    }])
    setIsPinging(false)
    if (!error) {
      showToast('Ping enviado com sucesso!')
      fetchWorkouts()
    } else {
      showToast('Erro ao enviar ping', 'error')
    }
  }

  const myVol = weeklyStats?.volume || 0;
  const pVol = partnerWeeklyVolume || 0;
  const totalVol = myVol + pVol;
  const myVolPercent = totalVol > 0 ? (myVol / totalVol) * 100 : 50;

  return (
    <div className="w-full max-w-md mx-auto p-6 pb-32 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-white font-display uppercase tracking-tight">VollonFit<span className="text-primary"> Social</span></h1>
        <p className="text-slate-400 font-bold mt-1">Conectado com <span className="text-white">{partner ? partner.name : 'Ninguém'}</span></p>
      </header>

      {!partner ? (
        <div className="bg-[#1A1A1A] p-8 rounded-[32px] border border-white/5 text-center">
          <Dumbbell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-white font-display mb-2">Vincule seu parceiro</h3>
          <p className="text-slate-400 text-sm font-bold">Vá até a aba Perfil e adicione o código do seu parceiro para liberar o VollonFit Social!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card de Notificações PWA */}
          {Notification.permission === 'default' && (
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between animate-in zoom-in duration-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Ativar Notificações</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Receba PINGS do seu parceiro!</p>
                </div>
              </div>
              <button 
                onClick={() => Notification.requestPermission().then(() => window.location.reload())}
                className="bg-primary text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
              >
                Permitir
              </button>
            </div>
          )}

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <UserIcon className="w-24 h-24 text-primary" />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">
                {partner.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-display">{partner.name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${partnerTrainedToday ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {partnerTrainedToday ? 'Treinou Hoje! 🔥' : 'Não treinou hoje 😴'}
                </span>
              </div>
            </div>

            <button 
              onClick={handlePing}
              disabled={isPinging}
              className="w-full fitness-gradient text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" /> {isPinging ? 'Enviando...' : 'Mandar um Ping'}
            </button>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Batalha de Carga (7 Dias)</h3>
            
            <div className="flex justify-between items-end mb-3">
              <div className="text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Você</p>
                <p className="text-2xl font-black text-white font-display">{myVol} <span className="text-xs text-slate-500">kg</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{partner.name}</p>
                <p className="text-2xl font-black text-primary font-display">{pVol} <span className="text-xs text-primary/50">kg</span></p>
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${myVolPercent}%` }}
              />
              <div 
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_#DFFF5E]"
                style={{ width: `${100 - myVolPercent}%` }}
              />
            </div>
            
            {myVol > pVol && <p className="text-center text-xs font-bold text-white mt-4">Você está ganhando! 🚀</p>}
            {myVol < pVol && <p className="text-center text-xs font-bold text-primary mt-4">Corra atrás do prejuízo! 🏃‍♂️</p>}
            {myVol === pVol && totalVol > 0 && <p className="text-center text-xs font-bold text-slate-400 mt-4">Empate técnico! 🤝</p>}
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Feed de Atividades</h3>
            <div className="space-y-4">
              {socialNotifications?.length === 0 ? (
                <p className="text-slate-500 text-sm font-bold text-center py-4">Nenhuma atividade recente.</p>
              ) : (
                socialNotifications?.map(note => (
                  <div key={note.id} className="flex gap-4 items-start p-3 bg-black rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {note.type === 'ping' ? <Activity className="w-5 h-5 text-primary" /> : <Dumbbell className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-snug">{note.message}</p>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">
                        {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



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
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [isPinging, setIsPinging] = useState(false)
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
    }
    setIsConfigModalOpen(true)
  }

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault()
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
      .select('*')
      .eq('receiver_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (notes && notes.length > 0) {
      const senderIds = [...new Set(notes.map(n => n.sender_id).filter(Boolean))]
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('gym_students')
          .select('id, name')
          .in('id', senderIds)
        
        const senderMap = {}
        if (senders) {
          senders.forEach(s => {
            senderMap[s.id] = s.name
          })
        }

        const notesWithSender = notes.map(n => ({
          ...n,
          sender: senderMap[n.sender_id] ? { name: senderMap[n.sender_id] } : { name: 'Sistema/Bando' }
        }))
        setSocialNotifications(notesWithSender)
      } else {
        setSocialNotifications(notes.map(n => ({ ...n, sender: { name: 'Sistema/Bando' } })))
      }
    } else {
      setSocialNotifications([])
    }

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
    const { data } = await supabase.from('gym_teachers').select('plan_type, academy_id').eq('id', teacherId).maybeSingle()
    if (data) {
      if (data.plan_type) setTeacherPlan(data.plan_type)
      setTeacherAcademyId(data.academy_id || null)
    }
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
          // Calcula 1RM estimado para cada série executada usando a fórmula de Epley: 1RM = W * (1 + R/30)
          const logsWith1RM = history.map(l => {
            const w = parseFloat(l.weight_kg) || 0;
            const r = parseInt(l.reps_done) || 0;
            const oneRepMax = r > 0 ? w * (1 + r / 30) : w;
            return { ...l, oneRepMax };
          });

          const maxEstimated1RM = Math.max(...logsWith1RM.map(l => l.oneRepMax), 0);
          
          // Extrai o número máximo de repetições alvo do treino (ex: "8-10" -> 10)
          let targetRepsNum = 10;
          if (item.target_reps) {
            const match = item.target_reps.match(/\d+$/); // Pega o último número da faixa (ex: 10 de "8-10")
            if (match) targetRepsNum = parseInt(match[0], 10);
          }

          if (maxEstimated1RM > 0) {
            // Peso sugerido para bater as repetições alvo com base no 1RM: Peso = 1RM / (1 + RepsAlvo / 30)
            let suggestedWeight = maxEstimated1RM / (1 + targetRepsNum / 30);
            
            // Arredonda para o mais próximo de 0.5kg
            suggestedWeight = Math.round(suggestedWeight * 2) / 2;

            // Se o peso sugerido for menor ou igual à carga máxima já levantada, mas a média de repetições
            // no histórico foi muito alta, sugere um pequeno incremento para progressão de carga.
            const maxHistoricalWeight = Math.max(...history.map(l => parseFloat(l.weight_kg) || 0), 0);
            const avgReps = history.reduce((acc, l) => acc + (parseInt(l.reps_done) || 0), 0) / history.length;
            
            if (suggestedWeight <= maxHistoricalWeight && avgReps >= targetRepsNum) {
              suggestedWeight = maxHistoricalWeight + (maxHistoricalWeight >= 50 ? 2.5 : 1.0);
            }

            if (suggestedWeight > 0) {
              iaSuggestion = {
                oneRepMax: Math.round(maxEstimated1RM * 10) / 10,
                weight: suggestedWeight,
                message: `Com base no seu 1RM preditivo de ${Math.round(maxEstimated1RM)}kg neste exercício, recomendamos ${suggestedWeight}kg para a sua meta de ${targetRepsNum} repetições.`
              };
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
    <div className="w-full h-full flex flex-col md:flex-row bg-surface text-on-surface font-body-md text-body-md overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden flex justify-between items-center px-gutter py-md bg-surface z-40 relative border-b border-outline-variant/30">
        <div className="flex items-center gap-sm">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container p-[2px]" onClick={() => setCurrentTab('profile')}>
            <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-black text-xl">
              {student?.name?.[0] || 'A'}
            </div>
          </div>
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Olá, {student?.name?.split(' ')[0] || 'Aluno'}!</h1>
            <div className="flex items-center gap-1 text-primary-container font-label-caps text-label-caps">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "16px" }}>local_fire_department</span>
              <span>{weeklyWorkouts} TREINOS (SEM)</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:text-primary transition-colors relative" onClick={() => setCurrentTab('social')}>
          <span className="material-symbols-outlined">notifications</span>
          {socialNotifications.length > 0 && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-container rounded-full border border-surface"></div>}
        </button>
      </header>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex flex-col h-screen left-0 w-64 bg-surface-container-low border-r border-outline-variant py-md z-50 shrink-0">
        <div className="px-6 mb-8">
          <span className="text-headline-md font-headline-md font-black text-primary">VollonFit</span>
        </div>
        <div className="px-6 mb-6 flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('profile')}>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container p-[1px]">
             <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-black text-lg">
                {student?.name?.[0] || 'A'}
             </div>
          </div>
          <div>
            <h2 className="font-body-md text-body-md text-primary font-bold">{student?.name?.split(' ')[0] || 'Aluno'}</h2>
            <p className="font-label-caps text-label-caps text-on-surface-variant">Aluno {teacherPlan === 'premium' ? 'Premium' : 'Basic'}</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          <button onClick={() => { setCurrentTab('train'); setCurrentView('home'); }} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left ${currentTab === 'train' && currentView === 'home' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">fitness_center</span>
            <span>Treinos</span>
          </button>
          <button onClick={() => setCurrentTab('evolution')} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left ${currentTab === 'evolution' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">trending_up</span>
            <span>Evolução</span>
          </button>
          <button onClick={() => setCurrentTab('social')} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left ${currentTab === 'social' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">groups</span>
            <span>Squads</span>
          </button>
          <button onClick={() => setCurrentTab('marketplace')} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left ${currentTab === 'marketplace' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">shopping_bag</span>
            <span>Marketplace</span>
          </button>
          <button onClick={() => setCurrentTab('nutrition')} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left relative ${currentTab === 'nutrition' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">local_fire_department</span>
            <span>Nutrição</span>
            {teacherPlan !== 'premium' && (
              <span className="material-symbols-outlined text-[10px] text-error ml-auto">lock</span>
            )}
          </button>
          <button onClick={() => setCurrentTab('profile')} className={`flex items-center gap-3 px-6 py-4 transition-colors w-full text-left ${currentTab === 'profile' ? 'bg-surface-container-high text-primary border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}>
            <span className="material-symbols-outlined">person</span>
            <span>Perfil</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-gutter md:px-lg py-sm md:py-lg relative no-scrollbar bg-surface pb-28 md:pb-8">
        <div className="max-w-container-max mx-auto space-y-md">
          
          {toast && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-500">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
                toast.type === 'error' ? 'bg-error-container/90 border-error text-on-error-container' : 'bg-surface-container-highest/90 border-outline-variant text-on-surface'
              }`}>
                {toast.type === 'error' ? <span className="material-symbols-outlined text-error">error</span> : <span className="material-symbols-outlined text-primary-container">check_circle</span>}
                <span className="font-bold text-sm tracking-tight">{toast.message}</span>
              </div>
            </div>
          )}

          {currentTab === 'train' && currentView === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full space-y-md">
              <div className="hidden md:flex justify-between items-end mb-8 mt-4">
                <div>
                  <h1 className="font-display-xl text-display-xl text-primary mb-2">Olá, {student?.name?.split(' ')[0] || 'Aluno'}!</h1>
                  <div className="flex items-center gap-2 text-primary-container">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    <span className="font-body-lg text-body-lg font-bold">{weeklyWorkouts} treinos na semana. Mantenha o ritmo.</span>
                  </div>
                </div>
              </div>

              {suggestedWorkout && (
                <section className="relative rounded-xl overflow-hidden glass-panel group cursor-pointer" onClick={() => startWorkout(suggestedWorkout)}>
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
                  <div className="relative p-gutter md:p-lg flex flex-col justify-end min-h-[300px] md:min-h-[400px]">
                    <div className="flex justify-between items-start mb-auto">
                      <span className="bg-primary-container text-on-primary-container font-label-caps text-label-caps px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                        Treino Sugerido
                      </span>
                      <span className="flex items-center gap-1 text-on-surface bg-surface/50 backdrop-blur-md px-3 py-1 rounded-full font-data-display text-data-display">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        ~45 Min
                      </span>
                    </div>
                    <div className="mt-8 relative z-10">
                      <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">{suggestedWorkout.name}</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-md">{suggestedWorkout.description || 'Foco e intensidade.'}</p>
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/2">
                          <div className="flex justify-between font-data-display text-data-display text-on-surface-variant mb-2">
                            <span>Progresso Semanal</span>
                            <span className="text-primary-container">{weeklyWorkouts}/5 Treinos</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary-container rounded-full neon-glow" style={{ width: `${Math.min((weeklyWorkouts / 5) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                        <button className="w-full md:w-auto bg-primary-container text-on-primary-container font-headline-md text-headline-md px-8 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-tint transition-all">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          Start Workout
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Metrics Grid */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-sm">monitor_weight</span>
                    <span className="font-label-caps text-label-caps uppercase">Peso Atual</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{bioRecords[bioRecords.length - 1]?.weight || '--'}</span>
                    <span className="font-data-display text-data-display text-on-surface-variant">kg</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary-container/20 to-transparent"></div>
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2 relative z-10">
                    <span className="material-symbols-outlined text-sm">fitness_center</span>
                    <span className="font-label-caps text-label-caps uppercase">Vol. Semanal</span>
                  </div>
                  <div className="flex items-baseline gap-1 relative z-10">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{weeklyStats.volume || 0}</span>
                    <span className="font-data-display text-data-display text-on-surface-variant">kg</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                    <span className="font-label-caps text-label-caps uppercase">Recordes</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{weeklyStats.prs || 0}</span>
                    <span className="font-data-display text-data-display text-on-surface-variant">novos</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span className="font-label-caps text-label-caps uppercase">Total Treinos</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{workoutHistory.length || 0}</span>
                    <span className="font-data-display text-data-display text-on-surface-variant">total</span>
                  </div>
                </div>
              </section>

              {/* Seus Treinos */}
              <section className="space-y-sm mt-8">
                <div className="flex justify-between items-end">
                  <h3 className="font-headline-md text-headline-md text-primary">Seus Treinos</h3>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {uniqueFilters.map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-1.5 rounded-full font-data-display text-data-display uppercase tracking-widest whitespace-nowrap transition-all ${
                        activeFilter === filter 
                        ? 'bg-primary-container text-on-primary-container neon-glow' 
                        : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  {filteredWorkouts.length === 0 ? (
                    <div className="glass-panel p-10 rounded-xl text-center col-span-1 md:col-span-2">
                      <p className="text-on-surface-variant font-body-md text-body-md">Nenhum treino encontrado nesta categoria.</p>
                    </div>
                  ) : (
                    filteredWorkouts.map(workout => (
                      <button 
                        key={workout.id}
                        onClick={() => startWorkout(workout)}
                        className="w-full glass-panel p-4 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary-container transition-colors">
                            <span className="material-symbols-outlined">fitness_center</span>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <h4 className="font-headline-md text-[16px] leading-snug text-primary">{workout.name}</h4>
                              {completedWorkoutsThisWeek.has(workout.id) && (
                                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{workout.description || 'Foco'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
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
            <NutritionTab studentId={student?.id} student={student} showToast={showToast} />
          )}

          {currentTab === 'marketplace' && (
            <MarketplaceTab showToast={showToast} teacherAcademyId={teacherAcademyId} />
          )}

          {currentTab === 'profile' && (
            <ProfileTab 
              student={student} 
              totalWorkouts={workoutHistory.length}
              onOpenConfig={openConfigModal} 
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
            <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
              <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-on-surface-variant mb-6 font-data-display text-data-display hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
              </button>
              <h2 className="font-display-xl text-4xl text-primary mb-2 tracking-tight">{selectedWorkout?.name}</h2>
              <div className="flex gap-4 mb-8">
                <span className="bg-primary-container/10 text-primary-container px-3 py-1 rounded-full font-label-caps text-label-caps border border-primary-container/20">{(workoutItems || []).length} EXERCÍCIOS</span>
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
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.98] ${
                        isCompleted 
                        ? 'bg-primary-container/5 border-primary-container/20 opacity-80' 
                        : 'glass-panel hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/50">
                        {ex?.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">fitness_center</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-headline-md text-[18px] leading-tight mb-1 ${isCompleted ? 'text-primary-container' : 'text-primary'}`}>
                          {ex?.name || 'Exercício'}
                        </p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant">{item?.target_sets || 3} séries • {item?.target_reps || '10-12'} reps</p>
                      </div>
                      {isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_10px_rgba(195,244,0,0.3)]">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
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
                  const totalWeight = (workoutSummary?.exerciseLogs || []).reduce((acc, log) => acc + (log.weight * log.reps), 0)
                  setWorkoutSummary(prev => ({ ...prev, totalWeight }))
                  
                  const { data: squadMember } = await supabase.from('gym_squad_members').select('squad_id').eq('student_id', student.id).maybeSingle()

                   if (squadMember?.squad_id) {
                    try {
                      await supabase.from('gym_squad_posts').insert([{
                        squad_id: squadMember.squad_id,
                        student_id: student.id,
                        type: 'check-in',
                        content: `Finalizou o treino: ${selectedWorkout.name}! 🔥💪 Volume: ${totalWeight}kg.`
                      }])
                      
                      const pointsConstancy = 100
                      const pointsIntensity = Math.min(200, Math.floor(totalWeight / 10))
                      let pointsBonus = 0
                      const today = new Date()
                      const startOfWeek = new Date(today)
                      startOfWeek.setDate(today.getDate() - today.getDay())
                      const dateStr = startOfWeek.toISOString().split('T')[0]

                      const { count } = await supabase.from('gym_training_logs').select('*', { count: 'exact', head: true }).eq('student_id', student.id).gte('workout_date', dateStr)

                      if (count === 4) { pointsBonus = 500 }
                      const totalPoints = pointsConstancy + pointsIntensity + pointsBonus

                      const { error: scoreError } = await supabase.from('gym_squad_score_logs').insert([{
                        squad_id: squadMember.squad_id,
                        student_id: student.id,
                        points: totalPoints,
                        category: 'workout_completion',
                        reason: `Concluiu o treino: ${selectedWorkout.name}`
                      }])

                      if (!scoreError) {
                        showToast(`+${totalPoints} PONTOS! ${pointsBonus > 0 ? '🎁 BÔNUS DE CONSTÂNCIA!' : '🏆🔥'}`)
                      }
                    } catch (err) { console.error(err) }
                  }
                  setCurrentView('summary')
                }}
                className="w-full bg-primary-container text-on-primary-container font-headline-md text-[18px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-tint neon-glow transition-all"
              >
                Finalizar Treino <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </button>
            </div>
          )}

          {/* Modals */}
          {isBioModalOpen && (
            <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-outline-variant">
                <h2 className="font-headline-lg text-2xl text-primary mb-4">Novo Registro de Biopedância</h2>
                <p className="text-on-surface-variant font-body-md mb-6">Em desenvolvimento.</p>
                <button onClick={() => setIsBioModalOpen(false)} className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label-caps text-label-caps uppercase">Fechar</button>
              </div>
            </div>
          )}

          {isConfigModalOpen && (
            <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-outline-variant shadow-2xl">
                <h2 className="font-headline-lg text-2xl text-primary mb-2">Configurações</h2>
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-6">Mantenha seu perfil atualizado</p>
                
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Nome Completo</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-primary font-body-md focus:border-primary-container outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Idade</label>
                      <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-primary font-body-md focus:border-primary-container outline-none transition-all" />
                    </div>
                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Altura (m)</label>
                      <input type="number" step="0.01" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-primary font-body-md focus:border-primary-container outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Senha</label>
                    <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} required className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-3 text-primary font-body-md focus:border-primary-container outline-none transition-all" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <button type="submit" disabled={isSavingConfig} className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-tint neon-glow transition-all disabled:opacity-50">
                      {isSavingConfig ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button type="button" onClick={handleEnableNotifications} className="w-full bg-primary-container/20 text-primary-container border border-primary-container/30 py-3 rounded-lg font-label-caps text-label-caps uppercase transition-all flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container">
                      <span className="material-symbols-outlined text-sm">notifications_active</span> Ativar Notificações do Navegador
                    </button>
                    <button type="button" onClick={() => { setIsConfigModalOpen(false); handleLogout(); }} className="w-full bg-error-container/20 text-error border border-error/30 py-3 rounded-lg font-label-caps text-label-caps uppercase transition-all flex items-center justify-center gap-2 hover:bg-error hover:text-on-error">
                      <span className="material-symbols-outlined text-sm">logout</span> Sair da Conta
                    </button>
                    <button type="button" onClick={() => setIsConfigModalOpen(false)} className="w-full bg-transparent text-on-surface border border-outline-variant py-3 rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-container-highest transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isGoalsModalOpen && (
            <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-outline-variant">
                <h2 className="font-headline-lg text-2xl text-primary mb-4">Metas</h2>
                <p className="font-body-md text-on-surface-variant mb-6">{student?.goals || 'Nenhuma meta definida.'}</p>
                <button onClick={() => setIsGoalsModalOpen(false)} className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label-caps text-label-caps uppercase">Fechar</button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-low/80 backdrop-blur-xl border-t border-outline-variant/30 rounded-t-xl">
        <button onClick={() => { setCurrentTab('train'); setCurrentView('home'); }} className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 w-1/5 ${currentTab === 'train' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined" style={currentTab === 'train' ? { fontVariationSettings: "'FILL' 1" } : {}}>fitness_center</span>
          <span className="font-label-caps text-[10px] mt-1">Treinos</span>
        </button>
        <button onClick={() => setCurrentTab('evolution')} className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 w-1/5 ${currentTab === 'evolution' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined" style={currentTab === 'evolution' ? { fontVariationSettings: "'FILL' 1" } : {}}>trending_up</span>
          <span className="font-label-caps text-[10px] mt-1">Evolução</span>
        </button>
        <button onClick={() => setCurrentTab('social')} className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 w-1/5 ${currentTab === 'social' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined" style={currentTab === 'social' ? { fontVariationSettings: "'FILL' 1" } : {}}>groups</span>
          <span className="font-label-caps text-[10px] mt-1">Squads</span>
        </button>
        <button onClick={() => { if (teacherPlan !== 'premium') { showToast('Funcionalidade disponível apenas para alunos Premium 🔥', 'error'); return; } setCurrentTab('nutrition'); }} className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 relative w-1/5 ${currentTab === 'nutrition' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined" style={currentTab === 'nutrition' ? { fontVariationSettings: "'FILL' 1" } : {}}>local_fire_department</span>
          <span className="font-label-caps text-[10px] mt-1">Nutri</span>
          {teacherPlan !== 'premium' && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-error"></span>
          )}
        </button>
        <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 w-1/5 ${currentTab === 'profile' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined" style={currentTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="font-label-caps text-[10px] mt-1">Perfil</span>
        </button>
      </nav>
    </div>
  )
}

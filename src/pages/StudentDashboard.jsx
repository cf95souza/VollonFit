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
  const [currentTab, setCurrentTab] = useState(() => localStorage.getItem('casalgym_student_tab') || 'train')
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('casalgym_student_view') || 'home') // 'home', 'workout-detail', 'executing'
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
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workoutSummary, setWorkoutSummary] = useState(null) // { totalWeight: 0, exercises: [] }
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = () => {
    localStorage.removeItem('casalgym_user')
    localStorage.removeItem('casalgym_student_tab')
    localStorage.removeItem('casalgym_student_view')
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

    // Buscar Stats de Treino (Última semana)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { data: logs } = await supabase
      .from('gym_training_logs')
      .select('workout_date')
      .eq('student_id', studentId)
      .gte('workout_date', oneWeekAgo.toISOString().split('T')[0])
    
    if (logs) {
      const uniqueDays = new Set(logs.map(l => l.workout_date)).size
      setWeeklyWorkouts(uniqueDays)
    }

    // Buscar histórico completo para o calendário
    const { data: history } = await supabase
      .from('gym_training_logs')
      .select('workout_date')
      .eq('student_id', studentId)
    
    if (history) {
      setWorkoutHistory(Array.from(new Set(history.map(h => h.workout_date))))
    }

    // Buscar Recordes Pessoais (Maiores cargas por exercício)
    const { data: prLogs, error: prError } = await supabase
      .from('gym_training_logs')
      .select('exercise_id, weight_kg, workout_date, gym_exercises(name)')
      .eq('student_id', studentId)
    
    if (!prError && prLogs) {
      const prMap = {}
      prLogs.forEach(log => {
        const exName = Array.isArray(log.gym_exercises) ? log.gym_exercises[0]?.name : log.gym_exercises?.name
        if (!prMap[log.exercise_id] || log.weight_kg > prMap[log.exercise_id].max_weight) {
          prMap[log.exercise_id] = {
            exercise_name: exName || 'Exercício',
            max_weight: log.weight_kg,
            record_date: log.workout_date
          }
        }
      })
      const prList = Object.values(prMap).sort((a, b) => b.max_weight - a.max_weight)
      setPersonalRecords(prList)
    }

    // Buscar parceiro se houver
    const { data: freshStudent } = await supabase.from('gym_students').select('partner_id').eq('id', studentId).single()
    if (freshStudent?.partner_id) {
      const { data: pData } = await supabase.from('gym_students').select('*').eq('id', freshStudent.partner_id).single()
      if (pData) setPartner(pData)
      
      // Buscar notificações do parceiro
      const { data: notes } = await supabase
        .from('gym_social_notifications')
        .select('*, sender:gym_students!sender_id(name)')
        .eq('receiver_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (notes) setSocialNotifications(notes)
    }

    // Buscar fotos de evolução
    const { data: photos } = await supabase
      .from('gym_evolution_photos')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    
    if (photos) setEvolutionPhotos(photos)
    
    // Estatísticas da Semana (Volume e PRs)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: weekLogs } = await supabase
      .from('gym_training_logs')
      .select('weight_kg, reps, created_at')
      .eq('student_id', studentId)
      .gte('created_at', sevenDaysAgo.toISOString())
    
    if (weekLogs) {
      const vol = weekLogs.reduce((acc, log) => acc + (log.weight_kg * log.reps), 0)
      const prsCount = personalRecords.filter(pr => new Date(pr.record_date) >= sevenDaysAgo).length
      setWeeklyStats({ volume: vol, prs: prsCount })
    }
    
    setLoading(false)
  }

  useEffect(() => {
    const user = localStorage.getItem('casalgym_user')
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
            localStorage.setItem('casalgym_user', JSON.stringify(data))
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
    localStorage.setItem('casalgym_student_tab', currentTab)
  }, [currentTab])

  useEffect(() => {
    localStorage.setItem('casalgym_student_view', currentView)
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
      setCurrentView('workout-detail')
    } catch (err) {
      console.error('Erro ao iniciar treino:', err)
      showToast('Não foi possível carregar o treino.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startExecution = () => {
    setCurrentView('executing')
    setCurrentExerciseIndex(0)
  }

  if (currentView === 'executing' && (!workoutItems || workoutItems.length === 0)) {
    setCurrentView('home')
    return null
  }

  if (currentView === 'executing') {
    return (
      <ExecutionView 
        workout={selectedWorkout} 
        exercises={workoutItems}
        exerciseIndex={currentExerciseIndex}
        studentId={student?.id}
        onNext={async () => {
          if (currentExerciseIndex < (workoutItems || []).length - 1) {
            setCurrentExerciseIndex(prev => prev + 1)
          } else {
            // Calcular resumo
            // Calcular volume total: soma de (peso * reps) de todas as séries
            const totalWeight = (workoutSummary?.exerciseLogs || []).reduce((acc, log) => {
              return acc + (log.weight * log.reps)
            }, 0)
            setWorkoutSummary(prev => ({ ...prev, totalWeight }))
            // Notificar parceiro
            if (student?.partner_id) {
              await supabase.from('gym_social_notifications').insert([{
                sender_id: student.id,
                receiver_id: student.partner_id,
                type: 'workout_finished',
                message: `${student.name} acabou de amassar no treino de ${selectedWorkout.name}! 🔥`
              }])
            }

            setCurrentView('summary')
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 flex flex-col items-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col relative pb-32">
        {/* Premium Header */}
        <header className="px-8 py-10 flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl fitness-gradient flex items-center justify-center text-white shadow-lg neon-shadow animate-float">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-black text-secondary tracking-tight text-2xl block leading-none">Casal<span className="text-primary">Gym</span></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolution App</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </header>

        <main className="px-8 pb-10 space-y-10">
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
              <header className="mb-10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Treino & Evolução</p>
                <h1 className="text-4xl font-black text-secondary font-display">Olá, {student?.name?.split(' ')?.[0] || 'Aluno'}!</h1>
              </header>

              {/* Social Feed do Casal */}
              {partner && (
                <section className="mb-10 animate-in fade-in slide-in-from-right-4 duration-1000 delay-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-secondary font-display">Feed do Casal</h3>
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg z-10">{student?.name?.[0]}</div>
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-secondary text-white flex items-center justify-center text-[10px] font-black shadow-lg">{partner?.name?.[0]}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {socialNotifications.length > 0 ? (
                      socialNotifications.map(n => (
                        <div key={n.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4 group hover:border-primary/20 transition-all">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Flame className="w-5 h-5 fill-primary/20" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-secondary leading-tight mb-1">{n.message}</p>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 p-8 rounded-[40px] text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nenhuma atividade recente</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
              
              <div className="grid grid-cols-2 gap-5 mb-10">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6 fill-primary/20" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequência</p>
                    <p className="text-3xl font-black text-secondary font-display">{weeklyWorkouts} <span className="text-xs font-bold text-slate-300">/ 5</span></p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 rounded-[20px] bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Scale className="w-6 h-6 fill-amber-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso</p>
                    <p className="text-3xl font-black text-secondary font-display">{bioRecords?.[0]?.weight || '--'} <span className="text-xs font-bold text-slate-300">kg</span></p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 rounded-[20px] bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 fill-emerald-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume (7d)</p>
                    <p className="text-3xl font-black text-secondary font-display">{weeklyStats.volume.toLocaleString()} <span className="text-xs font-bold text-slate-300">kg</span></p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-primary/20 transition-all">
                  <div className="w-12 h-12 rounded-[20px] bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 fill-indigo-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recordes (7d)</p>
                    <p className="text-3xl font-black text-secondary font-display">{weeklyStats.prs} <span className="text-xs font-bold text-slate-300">PRs</span></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-secondary font-display">Planos de Treino</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-4 py-2 rounded-full">{studentWorkouts?.length || 0} ativos</span>
              </div>

              <div className="space-y-6">
                {(studentWorkouts || []).map(workout => (
                  <button 
                    key={workout.id}
                    onClick={() => startWorkout(workout)}
                    className="w-full bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all active:scale-[0.97] tap-effect"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                        <Dumbbell className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-black text-secondary font-display group-hover:text-primary transition-colors leading-none mb-2">{workout.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{workout.description || 'Foco Geral'}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                      <ChevronRight className="w-6 h-6" />
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

        {/* Modal Biopedância (Inserido aqui para estar no contexto do aluno) */}
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
              localStorage.setItem('casalgym_user', JSON.stringify(updatedUser))
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
          />
        )}

        {currentTab === 'train' && currentView === 'workout-detail' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-slate-500 mb-6 font-bold text-sm">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-2xl font-bold text-secondary mb-2">{selectedWorkout?.name}</h2>
            <div className="flex gap-4 mb-8">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{(workoutItems || []).length} Exercícios</span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">~45 min</span>
            </div>

            <div className="space-y-3 mb-10">
              {(workoutItems || []).map((item, idx) => {
                const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises
                if (!item) return null
                return (
                  <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                      {ex?.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <Dumbbell className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-secondary leading-tight">{ex?.name || 'Exercício'}</p>
                      <p className="text-xs text-slate-400">{item?.target_sets || 3} séries • {item?.target_reps || '10-12'} reps</p>
                    </div>
                  </div>
                )
              })}
              {(!workoutItems || workoutItems.length === 0) && (
                <p className="text-center py-10 text-slate-400 italic">Este treino ainda não possui exercícios cadastrados.</p>
              )}
            </div>

            <button 
              onClick={startExecution}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-5 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg"
            >
              Começar Treino Agora <Play className="w-5 h-5 fill-white" />
            </button>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-300 w-full max-w-[90%] sm:max-w-md">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Glassmorphism Bottom Nav */}
      {currentView === 'home' && (
        <nav className="fixed bottom-6 left-6 right-6 glass-card px-8 py-4 flex justify-between items-center max-w-md mx-auto rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50">
          <button 
            onClick={() => setCurrentTab('train')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === 'train' ? 'text-primary scale-110' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <Activity className={`w-6 h-6 ${currentTab === 'train' ? 'fill-primary/10' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">Treinar</span>
          </button>
          <button 
            onClick={() => setCurrentTab('evolution')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === 'evolution' ? 'text-primary scale-110' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Evolução</span>
          </button>
          <button 
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === 'profile' ? 'text-primary scale-110' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <UserIcon className={`w-6 h-6 ${currentTab === 'profile' ? 'fill-primary/10' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
          </button>
        </nav>
      )}
      </div>
    </div>
  )
}

function ExecutionView({ workout, exercises = [], exerciseIndex, studentId, onNext, onBack, onLogSet, showToast }) {
  const item = (exercises || [])[exerciseIndex]
  const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises

  if (!ex) return null;
  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [exerciseNotes, setExerciseNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Carregar notas do exercício
  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('gym_student_exercise_notes')
        .select('notes')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .single()
      
      if (data) setExerciseNotes(data.notes)
    }
    if (ex?.id) fetchNotes()
  }, [ex?.id, studentId])

  // Lógica do Timer
  useEffect(() => {
    let interval = null
    if (isTimerActive && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining(prev => prev - 1)
      }, 1000)
    } else if (restRemaining === 0 && isTimerActive) {
      setIsTimerActive(false)
      // Vibração ao terminar (se suportado pelo navegador/celular)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    return () => clearInterval(interval)
  }, [isTimerActive, restRemaining])

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
    showToast('Anotação salva!')
  }

  const startRestTimer = () => {
    const timeStr = item?.rest_time || '60s'
    const seconds = parseInt(timeStr.replace('s', '')) || 60
    setRestRemaining(seconds)
    setIsTimerActive(true)
  }

  const handleNextSet = async () => {
    if (!weight || !reps) {
      showToast('Informe peso e reps!', 'error')
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
        workout_date: new Date().toISOString().split('T')[0]
      }])

    if (!error) {
      // 1. Verificar Recorde Pessoal (PR)
      const { data: maxData } = await supabase
        .from('gym_training_logs')
        .select('weight_kg')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .order('weight_kg', { ascending: false })
        .limit(2)

      const currentWeight = parseFloat(weight)
      const prevMax = maxData?.length > 1 ? maxData[1].weight_kg : (maxData?.length === 1 ? 0 : 0)

      if (currentWeight > prevMax && prevMax > 0) {
        showToast(`🏆 NOVO RECORDE PESSOAL: ${currentWeight}kg!`)
      } else if (prevMax === 0 && currentWeight > 0) {
        showToast(`✨ Primeiro registro de peso!`)
      }

      if (onLogSet) onLogSet({ weight: parseFloat(weight), reps: parseInt(reps) })
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
    <div className="min-h-screen bg-secondary flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 z-20">
        <div 
          className="h-full fitness-gradient transition-all duration-700 shadow-[0_0_15px_#10B981]" 
          style={{ width: `${((exerciseIndex) / exercises.length) * 100}%` }}
        />
      </div>

      <header className="px-8 py-10 flex justify-between items-center relative z-10">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Exercício {exerciseIndex + 1} de {exercises.length}</p>
          <h2 className="text-white font-black text-xl font-display leading-tight">{ex?.name}</h2>
        </div>
        <div className="w-12 h-12" />
      </header>

      <div className="flex-1 bg-white rounded-t-[50px] p-8 flex flex-col animate-in slide-in-from-bottom-12 duration-700 overflow-y-auto">
        <div className="w-full aspect-square rounded-[40px] bg-slate-50 mb-10 overflow-hidden border border-slate-100 shadow-inner flex items-center justify-center group relative">
          {ex?.gif_url ? (
            <img src={ex.gif_url} className="w-full h-full object-contain p-4" />
          ) : (
            <Dumbbell className="w-24 h-24 text-slate-100" />
          )}
          {lastBestSet && (
            <div className="absolute bottom-6 left-6 right-6 glass-card p-4 rounded-3xl border-slate-200 shadow-xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Melhor Anterior</p>
                  <p className="text-sm font-black text-secondary">{lastBestSet.weight_kg}kg <span className="text-slate-400 font-bold">× {lastBestSet.reps_done}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-10">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Série Atual</p>
              <p className="text-5xl font-black text-secondary font-display">{currentSet}<span className="text-slate-300 text-2xl font-normal ml-2">/ {item?.target_sets || 1}</span></p>
            </div>
            <div className={`px-6 py-4 rounded-3xl flex flex-col items-center border transition-all duration-500 min-w-[100px] ${isTimerActive ? 'bg-primary/5 border-primary/20 neon-shadow' : 'bg-slate-50 border-slate-100'}`}>
              <Timer className={`w-5 h-5 mb-1 ${isTimerActive ? 'text-primary animate-pulse' : 'text-slate-300'}`} />
              <p className={`text-lg font-black font-display ${isTimerActive ? 'text-primary' : 'text-slate-400'}`}>
                {isTimerActive ? `${restRemaining}s` : (item?.rest_time || '60s')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border-none rounded-[28px] p-6 text-3xl font-black text-secondary focus:ring-8 focus:ring-primary/5 transition-all text-center outline-none shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reps</label>
              <input 
                type="number" 
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={item.target_reps}
                className="w-full bg-slate-50 border-none rounded-[28px] p-6 text-3xl font-black text-secondary focus:ring-8 focus:ring-primary/5 transition-all text-center outline-none shadow-inner"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-4 shadow-inner">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotações de Ajuste</span>
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
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-600 focus:ring-0 placeholder:text-slate-300 resize-none min-h-[60px]"
            />
          </div>
        </div>

        <button 
          onClick={handleNextSet}
          disabled={isSaving}
          className="w-full fitness-gradient hover:opacity-90 text-white font-black py-7 rounded-[32px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all text-xl mt-12 disabled:opacity-50 neon-shadow"
        >
          {isSaving ? 'Gravando...' : (currentSet < (item?.target_sets || 1) ? 'Concluir Série' : 'Próximo Exercício')} 
          <CheckCircle2 className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

function WorkoutSummaryView({ summary, workout, onClose }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto animate-in fade-in duration-500">
      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-secondary">Treino Concluído!</h2>
          <p className="text-slate-500 font-medium">Você esmagou o {workout?.name} hoje.</p>
        </div>

        <div className="w-full bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Volume Total de Carga</p>
            <p className="text-5xl font-black text-primary">{summary?.totalWeight || 0}<span className="text-xl font-bold ml-1">kg</span></p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Exercícios</p>
              <p className="text-xl font-bold text-secondary">{(summary?.exerciseLogs || []).length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</p>
              <p className="text-xl font-bold text-emerald-500">Evoluindo</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-secondary text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-lg shadow-xl shadow-secondary/20"
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

      // 1. Upload para Storage (Assumindo bucket 'evolution_photos')
      const { error: uploadError } = await supabase.storage
        .from('evolution_photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('evolution_photos')
        .getPublicUrl(filePath)

      // 3. Salvar no Banco
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
      showToast('Foto de evolução salva!', 'success')
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
    setIsUploading(true) // Reutilizando para loading visual
    
    try {
      // 1. Extrair path do Storage
      // A URL é algo como .../evolution_photos/studentId/timestamp.jpg
      const pathParts = url.split('evolution_photos/')
      const filePath = pathParts[pathParts.length - 1]

      // 2. Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from('evolution_photos')
        .remove([filePath])
      
      if (storageError) console.warn('Erro ao remover do storage (pode já não existir):', storageError)

      // 3. Deletar do Banco
      const { error: dbError } = await supabase
        .from('gym_evolution_photos')
        .delete()
        .eq('id', id)
      
      if (dbError) throw dbError

      onPhotosUpdate(photos.filter(p => p.id !== id))
      showToast('Foto excluída com sucesso.', 'success')
      setPhotoToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir foto:', err)
      showToast('Erro ao Excluir: ' + (err.message || 'Erro de permissão'), 'error')
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

  // Lógica do Calendário
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' })
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      day,
      hasTrained: history.includes(dateStr)
    }
  })

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Sua Jornada</p>
        <h1 className="text-4xl font-black text-secondary font-display">Sua Evolução</h1>
      </header>

      {/* Calendário de Frequência */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-secondary font-display capitalize">{monthName}</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-4 py-2 rounded-full">Frequência</span>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase">{d}</div>
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
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                  : 'bg-slate-50 text-slate-300'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Recordes Pessoais (Troféus) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-secondary font-display">Hall de Recordes</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-4 py-2 rounded-full">🏆 {prs.length} Marcas</span>
        </div>

        {prs.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {prs.map((pr, idx) => (
              <div key={idx} className="flex-shrink-0 w-40 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-black text-secondary font-display mb-1 line-clamp-1">{pr.exercise_name}</h4>
                <p className="text-2xl font-black text-primary font-display">{pr.max_weight}<span className="text-[10px] ml-1 uppercase text-slate-300">kg</span></p>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">{new Date(pr.record_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold">Treine para registrar seus primeiros recordes!</p>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black text-secondary font-display">Composição Corporal</h3>
        <button 
          onClick={onNewRecord}
          className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Registro
        </button>
      </div>

      {!records || records.length === 0 ? (
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 text-center space-y-4">
          <TrendingUp className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="text-slate-400 text-sm">Registre sua primeira biopedância para começar a ver sua evolução!</p>
          <button 
            onClick={onNewRecord}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <>
          {/* Gráfico Principal */}
          <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" /> Peso Corporal (kg)
              </h3>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                Últimos {records.length} registros
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#FB7185" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-700 text-xs mb-4 flex items-center gap-2">
                <Flame className="w-3 h-3 text-orange-500" /> Gordura (%)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-700 text-xs mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500" /> Músculo (kg)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="muscle" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                    <Tooltip />
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
          <h3 className="text-xl font-black text-secondary font-display">Diário Visual</h3>
          <label className="cursor-pointer bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            {isUploading ? 'Subindo...' : 'Novo Check-in'}
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-[4/5] rounded-[32px] overflow-hidden group border-2 border-white shadow-md">
                <img src={p.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Evolução" />
                
                {/* Botão Excluir */}
                <button 
                  onClick={() => setPhotoToDelete({ id: p.id, url: p.photo_url })}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                  <p className="text-[8px] font-bold text-white/80 uppercase tracking-widest">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[40px] text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Sua transformação merece ser vista. <br/> Comece seu histórico hoje!
            </p>
          </div>
        )}
      </section>

      {records && records.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-bold text-secondary mb-4">Histórico Completo</h3>
          <div className="space-y-3">
            {(records || []).slice().reverse().map((r, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-secondary">{r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR') : '-'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Peso: <b className="text-slate-600">{r.weight || 0}kg</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Gordura: <b className="text-slate-600">{r.body_fat_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Músculo: <b className="text-slate-600">{r.muscle_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Visceral: <b className="text-slate-600">{r.visceral_fat || '-'}</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Água: <b className="text-slate-600">{r.body_water_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Óssea: <b className="text-slate-600">{r.bone_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">Idade: <b className="text-slate-600">{r.body_age || '-'}</b></span>
                    <span className="text-[10px] text-slate-400 font-medium">IMC: <b className="text-slate-600">{r.bmi || '-'}</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 text-sm">{r.tmb || 0} kcal</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase">TMB</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Confirmação Customizado */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-secondary font-display mb-2">Excluir Foto?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8">Esta ação não pode ser desfeita.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleDeletePhoto}
                disabled={isUploading}
                className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button 
                onClick={() => setPhotoToDelete(null)}
                disabled={isUploading}
                className="w-full bg-slate-100 text-slate-400 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all disabled:opacity-50"
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
        record_date: new Date().toISOString().split('T')[0]
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
    <div className="fixed inset-0 bg-secondary/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-secondary">Novo Registro</h3>
            <p className="text-sm text-slate-400">Acompanhe sua evolução corporal</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
            <ChevronLeft className="w-6 h-6 rotate-90" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
              <input 
                required type="number" step="0.1" 
                value={record.weight}
                onChange={e => setRecord({...record, weight: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gordura (%)</label>
              <input 
                required type="number" step="0.1" 
                value={record.body_fat_pct}
                onChange={e => setRecord({...record, body_fat_pct: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Músculo (kg)</label>
              <input 
                required type="number" step="0.1" 
                value={record.muscle_mass_kg}
                onChange={e => setRecord({...record, muscle_mass_kg: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">TMB (kcal)</label>
              <input 
                required type="number" 
                value={record.tmb}
                onChange={e => setRecord({...record, tmb: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IMC</label>
              <input 
                type="number" step="0.1"
                value={record.bmi}
                onChange={e => setRecord({...record, bmi: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gord. Visceral</label>
              <input 
                type="number" 
                value={record.visceral_fat}
                onChange={e => setRecord({...record, visceral_fat: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0-20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Água (%)</label>
              <input 
                type="number" step="0.1"
                value={record.body_water_pct}
                onChange={e => setRecord({...record, body_water_pct: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Massa Óssea</label>
              <input 
                type="number" step="0.1"
                value={record.bone_mass_kg}
                onChange={e => setRecord({...record, bone_mass_kg: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Idade Corp.</label>
              <input 
                type="number" 
                value={record.body_age}
                onChange={e => setRecord({...record, body_age: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="00"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-6 rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all text-xl disabled:opacity-50"
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
    <div className="fixed inset-0 bg-secondary/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-secondary">Configurar Conta</h3>
            <p className="text-sm text-slate-400">Mantenha seus dados atualizados</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                required type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Idade</label>
                <input 
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Ex: 25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Altura (m)</label>
                <input 
                  type="number" step="0.01"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Ex: 1.75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Peso Inicial (kg)</label>
              <input 
                type="number" step="0.1"
                value={formData.initial_weight}
                onChange={e => setFormData({...formData, initial_weight: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Ex: 80.5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Alterar Senha</label>
              <input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Deixe em branco para não alterar"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all text-xl disabled:opacity-50"
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
    <div className="fixed inset-0 bg-secondary/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-primary/5">
          <div>
            <h3 className="text-2xl font-black text-secondary">Minhas Metas</h3>
            <p className="text-sm text-slate-500">Definidas pelo seu professor</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 pb-12">
          <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 min-h-[200px] flex items-center justify-center text-center">
            {goals ? (
              <p className="text-lg text-slate-700 font-medium leading-relaxed italic">
                "{goals}"
              </p>
            ) : (
              <p className="text-slate-400 italic">
                Nenhuma meta definida ainda. <br/> Converse com seu professor!
              </p>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-8 bg-secondary text-white font-black py-5 rounded-3xl active:scale-95 transition-all text-xl"
          >
            Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ student, onOpenConfig, onOpenGoals, showToast }) {
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

      // Vínculo recíproco
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
    console.log('Iniciando desvínculo para:', student.id, 'Parceiro:', student.partner_id)
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
        <div className="w-32 h-32 fitness-gradient rounded-[40px] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl text-white text-5xl font-black font-display neon-shadow">
          {student?.name?.[0]}
        </div>
        <h2 className="text-3xl font-black text-secondary font-display">{student?.name}</h2>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs mt-2">@{student?.username}</p>
      </div>
      
      {/* Sistema de Parceria */}
      {!student?.partner_id ? (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="text-left">
            <h3 className="font-black text-secondary font-display text-lg tracking-tight">Vincular Parceiro(a)</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Treinem juntos e motivem-se!</p>
          </div>
          <input 
            type="text"
            placeholder="Buscar por nome ou @username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
          />
          {search && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleLink(s.id)}
                  className="w-full p-4 bg-slate-50 hover:bg-primary/5 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">@{s.username}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
          <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Seu Casal</p>
                <p className="text-lg font-black text-secondary font-display tracking-tight leading-none">Vínculo Ativo</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUnlinkConfirm(true)}
              className="p-3 bg-white text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all shadow-sm active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {showUnlinkConfirm && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-rose-600 mb-3">Confirmar desvínculo?</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleUnlink}
                  disabled={isLinking}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                >
                  {isLinking ? '...' : 'Sim, Desvincular'}
                </button>
                <button 
                  onClick={() => setShowUnlinkConfirm(false)}
                  className="flex-1 bg-white text-slate-400 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100"
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
          className="w-full p-8 text-left bg-white rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="font-black text-secondary font-display text-lg tracking-tight">Configurações da Conta</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-all" />
        </button>

        <button 
          onClick={onOpenGoals}
          className="w-full p-8 text-left bg-white rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="font-black text-secondary font-display text-lg tracking-tight">Metas e Objetivos</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-all" />
        </button>
      </div>
    </div>
  )
}

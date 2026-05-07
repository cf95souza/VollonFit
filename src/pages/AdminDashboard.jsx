import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  LogOut, 
  Dumbbell, 
  Users, 
  LayoutDashboard, 
  Plus, 
  Search,
  ChevronRight,
  ClipboardList,
  Activity,
  ChevronLeft,
  TrendingUp,
  Scale,
  History,
  X,
  Timer,
  CheckCircle2,
  AlertCircle,
  Menu,
  Settings,
  User
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MOCK_EXERCISES, MOCK_STUDENTS } from '../services/mockData'
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('vollonfit_admin_tab') || 'overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [exercises, setExercises] = useState(MOCK_EXERCISES)
  const [viewingStudent, setViewingStudent] = useState(() => {
    const saved = localStorage.getItem('vollonfit_admin_viewing_student')
    return saved ? JSON.parse(saved) : null
  })
  const [toast, setToast] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const [teacherInfo, setTeacherInfo] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const saved = localStorage.getItem('vollonfit_teacher')
      if (!saved) {
        navigate('/', { replace: true })
        return
      }
      const teacher = JSON.parse(saved)
      setTeacherInfo(teacher)
    }
    checkAuth()
  }, [navigate])

  useEffect(() => {
    localStorage.setItem('vollonfit_admin_tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (viewingStudent) {
      localStorage.setItem('vollonfit_admin_viewing_student', JSON.stringify(viewingStudent))
    } else {
      localStorage.removeItem('vollonfit_admin_viewing_student')
    }
  }, [viewingStudent])

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_teacher')
    localStorage.removeItem('vollonfit_admin_tab')
    localStorage.removeItem('vollonfit_admin_viewing_student')
    navigate('/')
  }

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
        <div className="bg-[#DFFF5E] p-2 rounded-lg text-black">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <span className="text-white font-bold tracking-tight text-lg">VOLLON<span className="text-[#DFFF5E] text-xs font-normal ml-0.5">FIT</span></span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        <SidebarLink icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setViewingStudent(null); setDrawerOpen(false); }} />
        <SidebarLink icon={<Dumbbell className="w-5 h-5" />} label="Exercícios" active={activeTab === 'exercises'} onClick={() => { setActiveTab('exercises'); setViewingStudent(null); setDrawerOpen(false); }} />
        <SidebarLink icon={<ClipboardList className="w-5 h-5" />} label="Treinos" active={activeTab === 'workouts'} onClick={() => { setActiveTab('workouts'); setViewingStudent(null); setDrawerOpen(false); }} />
        <SidebarLink icon={<Users className="w-5 h-5" />} label="Alunos" active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setViewingStudent(null); setDrawerOpen(false); }} />
        <SidebarLink icon={<Scale className="w-5 h-5" />} label="Financeiro" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setViewingStudent(null); setDrawerOpen(false); }} />
        <SidebarLink icon={<Settings className="w-5 h-5" />} label="Configurações" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setViewingStudent(null); setDrawerOpen(false); }} />
      </nav>
      <div className="p-3 border-t border-slate-700/50">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-all text-sm">
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black font-sans text-slate-200">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-60 bg-[#0F172A] border-r border-white/5 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 h-full bg-[#0F172A] flex flex-col animate-in slide-in-from-left duration-200 border-r border-white/10">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A]">
        {/* Header */}
        <header className="h-14 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-white truncate">
              {activeTab === 'overview' && 'Painel de Controle'}
              {activeTab === 'exercises' && 'Exercícios'}
              {activeTab === 'workouts' && 'Treinos'}
              {activeTab === 'students' && 'Alunos'}
              {activeTab === 'finance' && 'Financeiro'}
              {activeTab === 'settings' && 'Configurações'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all w-48 lg:w-64"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#DFFF5E]/10 flex items-center justify-center text-[#DFFF5E] font-bold text-xs border border-[#DFFF5E]/20 shadow-[0_0_10px_rgba(223,255,94,0.1)]">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {viewingStudent ? (
            <div className="max-w-5xl mx-auto animate-in slide-in-from-right-10 duration-500">
              <StudentDetailView 
                student={viewingStudent} 
                onBack={() => setViewingStudent(null)} 
                showToast={showToast}
              />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-10">
              <header className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-[#DFFF5E] uppercase tracking-[0.3em] mb-2">Painel de Gestão</p>
                  <h1 className="text-4xl font-black text-white font-display">
                    {activeTab === 'overview' && 'Visão Geral'}
                    {activeTab === 'exercises' && 'Biblioteca de Exercícios'}
                    {activeTab === 'workouts' && 'Gestão de Treinos'}
                    {activeTab === 'students' && 'Meus Alunos'}
                    {activeTab === 'finance' && 'Financeiro & Faturas'}
                    {activeTab === 'settings' && 'Configurações do Perfil'}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 bg-[#111111] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all w-72 shadow-sm"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#DFFF5E] flex items-center justify-center text-black font-black text-sm shadow-[0_0_20px_rgba(223,255,94,0.3)]">
                    AD
                  </div>
                </div>
              </header>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'overview' && <OverviewTab onViewProfile={setViewingStudent} searchTerm={searchTerm} teacherInfo={teacherInfo} />}
                {activeTab === 'exercises' && <ExercisesTab exercises={exercises} showToast={showToast} searchTerm={searchTerm} teacherInfo={teacherInfo} />}
                {activeTab === 'workouts' && <WorkoutsTab showToast={showToast} searchTerm={searchTerm} teacherInfo={teacherInfo} />}
                {activeTab === 'students' && <StudentsTab onViewProfile={setViewingStudent} showToast={showToast} searchTerm={searchTerm} teacherInfo={teacherInfo} />}
                {activeTab === 'finance' && <FinanceiroTab teacherInfo={teacherInfo} />}
                {activeTab === 'settings' && <SettingsTab teacherInfo={teacherInfo} setTeacherInfo={setTeacherInfo} showToast={showToast} />}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-[#DFFF5E] text-black font-bold' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-black' : 'text-slate-500'}`}>
        {icon}
      </div>
      {label}
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  )
}

function OverviewTab({ onViewProfile, searchTerm, teacherInfo }) {
  const [stats, setStats] = useState({ exercises: 0, workouts: 0, students: 0, sessionsToday: 0 })
  const [recentStudents, setRecentStudents] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [atRiskStudents, setAtRiskStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    const today = getTodayLocally()
    
    const teacherId = teacherInfo?.id
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
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    // Buscar todos os alunos e seus últimos logs
    const { data: studentsWithLogs } = await supabase
      .from('gym_students')
      .select('id, name, username, gym_training_logs(created_at)')
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
  }, [])

  const filteredAtRisk = atRiskStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRecent = recentStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Exercícios" value={stats.exercises} icon={Dumbbell} trend="+3" />
        <KPICard title="Treinos Ativos" value={stats.workouts} icon={ClipboardList} />
        <KPICard title="Alunos" value={stats.students} icon={Users} />
        <KPICard title="Sessões Hoje" value={stats.sessionsToday} icon={Activity} trend="+100%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#DFFF5E]" />
            <h3 className="font-bold text-white">Alunos Recentes</h3>
          </div>
          <div className="space-y-4">
            {filteredRecent.map((student, i) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#DFFF5E]/30 transition-all cursor-pointer group">
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
                  onClick={() => onViewProfile(student)}
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
                    onClick={() => onViewProfile(student)}
                    className="bg-slate-800 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20"
                  >
                    Motivar ›
                  </button>
                </div>
                
                {/* Efeito visual de fundo */}
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

function ExercisesTab({ showToast, searchTerm, teacherInfo }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGif, setSelectedGif] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Peito', description: '', gif_url: '' })
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const categories = ['Todos', 'Peito', 'Costas', 'Pernas', 'Bíceps', 'Tríceps', 'Ombros', 'Abdômen']

  const fetchExercises = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_exercises')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar exercícios:', error)
    } else {
      setExercises(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const handleOpenEdit = (ex) => {
    setEditingId(ex.id)
    setNewExercise({
      name: ex.name,
      category: ex.category,
      description: ex.description || '',
      gif_url: ex.gif_url || ''
    })
    setIsModalOpen(true)
  }

  const handleCreateExercise = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    if (editingId) {
      const { error } = await supabase
        .from('gym_exercises')
        .update(newExercise)
        .eq('id', editingId)

      if (error) {
        showToast('Erro ao atualizar: ' + error.message, 'error')
      } else {
        showToast('Exercício atualizado!')
      }
    } else {
      const { error } = await supabase
        .from('gym_exercises')
        .insert([{ ...newExercise, teacher_id: teacherInfo.id }])

      if (error) {
        showToast('Erro ao cadastrar: ' + error.message, 'error')
      } else {
        showToast('Exercício cadastrado com sucesso!')
      }
    }

    setIsModalOpen(false)
    setEditingId(null)
    setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
    fetchExercises()
    setIsSaving(false)
  }

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || ex.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Pills de Filtro */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              selectedCategory === cat
                ? 'bg-[#DFFF5E] text-black border-[#DFFF5E] shadow-[0_0_15px_rgba(223,255,94,0.3)]'
                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-[#111111] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111111] sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-lg text-white">Acervo Global de Exercícios</h3>
            <p className="text-xs text-slate-400">Consulte a biblioteca padronizada para montar seus treinos</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="3" className="px-6 py-4 h-16 bg-white/5"></td>
                  </tr>
                ))
              ) : (
                filteredExercises.map(ex => (
                  <tr 
                    key={ex.id} 
                    onClick={() => setSelectedGif(ex)}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-[#DFFF5E] transition-colors">
                        {ex.gif_url ? (
                          <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">{ex.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredExercises.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-slate-500 italic">
                    Nenhum exercício encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro Exercício */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                {editingId ? 'Editar Exercício' : 'Cadastrar Exercício'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
            <form onSubmit={handleCreateExercise} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    value={newExercise.name}
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                    placeholder="Ex: Supino Reto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select 
                    value={newExercise.category}
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                  >
                    <option>Peito</option>
                    <option>Costas</option>
                    <option>Pernas</option>
                    <option>Bíceps</option>
                    <option>Tríceps</option>
                    <option>Ombros</option>
                    <option>Abdômen</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">GIF URL (Demonstração)</label>
                <input 
                  type="url" 
                  value={newExercise.gif_url}
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                  placeholder="https://exemplo.com/exercicio.gif"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Observações</label>
                <textarea 
                  rows="3"
                  value={newExercise.description}
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none resize-none"
                  placeholder="Instruções de execução..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-[#DFFF5E] text-black rounded-xl font-bold text-sm hover:bg-[#B8E600] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gif Viewer Modal - REDESENHADO ITEM 3 */}
      {selectedGif && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-[32px] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#111111]">
              <div>
                <span className="bg-[#DFFF5E]/10 text-[#DFFF5E] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#DFFF5E]/20 mb-2 inline-block">
                  {selectedGif.category}
                </span>
                <h3 className="font-black text-2xl text-white font-display uppercase tracking-tight">{selectedGif.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedGif(null)}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video bg-black flex items-center justify-center relative group">
              {selectedGif.gif_url ? (
                <img src={selectedGif.gif_url} alt={selectedGif.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-700">
                  <Dumbbell className="w-16 h-16" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sem demonstração visual</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            <div className="p-8 bg-[#111111]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#DFFF5E]" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruções de Execução</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {selectedGif.description || 'Nenhuma instrução específica cadastrada para este exercício.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button 
                onClick={() => setSelectedGif(null)}
                className="w-full py-4 bg-[#DFFF5E] text-black font-black rounded-2xl hover:bg-[#B8E600] transition-all shadow-[0_0_20px_rgba(223,255,94,0.15)] uppercase text-xs tracking-widest"
              >
                Entendido, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutsTab({ showToast, searchTerm, teacherInfo }) {
  const [students, setStudents] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estado do novo/existente treino
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentWorkouts, setStudentWorkouts] = useState([])
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [workoutItems, setWorkoutItems] = useState([]) // { exercise_id, target_sets, target_reps, rest_time }

  const fetchData = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase.from('gym_students').select('id, name').eq('teacher_id', teacherInfo.id).order('name')
    if (!error) setStudents(data)
    
    const { data: exData } = await supabase.from('gym_exercises').select('id, name, category').order('name')
    if (exData) setExercises(exData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [teacherInfo?.id])

  // Buscar treinos do aluno quando selecionado
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentWorkouts()
    } else {
      setStudentWorkouts([])
    }
  }, [selectedStudent])

  const fetchStudentWorkouts = async () => {
    const { data, error } = await supabase
      .from('gym_workouts')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
    
    if (!error) setStudentWorkouts(data)
  }

  const loadWorkoutForEdit = async (workout) => {
    setLoading(true)
    setEditingWorkoutId(workout.id)
    setWorkoutName(workout.name)
    setWorkoutDescription(workout.description || '')
    
    const { data, error } = await supabase
      .from('gym_workout_items')
      .select('*')
      .eq('workout_id', workout.id)
      .order('sequence_order')

    if (!error) {
      setWorkoutItems(data.map(item => ({
        id: item.id, // Manter o ID para saber se é update ou insert
        exercise_id: item.exercise_id,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        rest_time: item.rest_time
      })))
    }
    setLoading(false)
  }

  const handleSaveWorkout = async () => {
    if (!selectedStudent || !workoutName || workoutItems.length === 0) {
      showToast('Preencha todos os campos do treino.', 'error')
      return
    }

    setIsSaving(true)
    
    let workoutId = editingWorkoutId

    if (editingWorkoutId) {
      // Atualizar nome e descrição do treino se mudou
      await supabase.from('gym_workouts').update({ 
        name: workoutName,
        description: workoutDescription 
      }).eq('id', editingWorkoutId)
      // Para simplificar a edição de itens, vamos deletar os antigos e inserir os novos
      await supabase.from('gym_workout_items').delete().eq('workout_id', editingWorkoutId)
    } else {
      // Criar novo cabeçalho
      const { data, error } = await supabase
        .from('gym_workouts')
        .insert([{ 
          name: workoutName, 
          description: workoutDescription,
          student_id: selectedStudent, 
          teacher_id: teacherInfo.id 
        }])
        .select().single()
      
      if (error) { 
        showToast('Erro ao criar treino: ' + error.message, 'error')
        setIsSaving(false)
        return
      }
      workoutId = data.id
    }

    // Inserir itens
    const itemsToInsert = workoutItems.map((item, index) => ({
      workout_id: workoutId,
      exercise_id: item.exercise_id,
      sequence_order: index + 1,
      target_sets: parseInt(item.target_sets),
      target_reps: item.target_reps,
      rest_time: item.rest_time
    }))

    const { error: itemsError } = await supabase.from('gym_workout_items').insert(itemsToInsert)

    if (itemsError) {
      showToast('Erro ao salvar exercícios: ' + itemsError.message, 'error')
    } else {
      showToast(editingWorkoutId ? 'Treino atualizado com sucesso!' : 'Treino criado com sucesso!')
      resetForm()
      fetchStudentWorkouts()
    }
    setIsSaving(false)
  }

  const resetForm = () => {
    setEditingWorkoutId(null)
    setWorkoutName('')
    setWorkoutDescription('')
    setWorkoutItems([])
  }

  const addExercise = () => {
    setWorkoutItems([...workoutItems, { exercise_id: '', target_sets: 3, target_reps: '12', rest_time: '60s' }])
  }

  const removeExercise = (index) => {
    setWorkoutItems(workoutItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...workoutItems]
    newItems[index][field] = value
    setWorkoutItems(newItems)
  }

  if (loading && students.length === 0) return <div className="p-20 text-center animate-pulse text-slate-400">Carregando...</div>

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Lateral: Seleção de Aluno e Treinos Existentes */}
        <div className="space-y-6">
          <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Selecione o Aluno</label>
            <select 
              value={selectedStudent}
              onChange={e => { setSelectedStudent(e.target.value); resetForm(); }}
              className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#DFFF5E]/20"
            >
              <option value="">Selecione um aluno...</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedStudent && (
            <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treinos do Aluno</label>
                <button onClick={resetForm} className="text-[10px] font-bold text-[#DFFF5E] hover:underline">Novo Treino</button>
              </div>
              <div className="space-y-2">
                {studentWorkouts.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => loadWorkoutForEdit(w)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      editingWorkoutId === w.id ? 'bg-[#DFFF5E]/10 border-[#DFFF5E] text-[#DFFF5E]' : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-sm">{w.name}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${editingWorkoutId === w.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
                {studentWorkouts.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum treino encontrado.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Principal: Editor do Treino */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="space-y-6">
              <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-[#DFFF5E]" /> {editingWorkoutId ? 'Editando Treino' : 'Novo Treino'}
                  </h3>
                  {editingWorkoutId && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Existente</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação do Treino</label>
                  <input 
                    type="text" 
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="Ex: Treino A - Superior (Foco Peito)"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#DFFF5E]/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Foco / Descrição (Pílula de Filtro)</label>
                  <input 
                    type="text" 
                    value={workoutDescription}
                    onChange={e => setWorkoutDescription(e.target.value)}
                    placeholder="Ex: Foco Peito, Superior, Cardio..."
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#DFFF5E]/20 outline-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-lg font-bold text-white">Exercícios da Rotina</h3>
                  <button 
                    onClick={addExercise}
                    className="flex items-center gap-2 text-[#DFFF5E] hover:text-[#B8E600] font-bold text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 p-0.5 bg-[#DFFF5E]/10 rounded-full" /> Adicionar Exercício
                  </button>
                </div>

                <div className="space-y-4">
                  {workoutItems.map((item, index) => (
                    <div key={index} className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exercício {index + 1}</label>
                        <select 
                          value={item.exercise_id}
                          onChange={e => updateItem(index, 'exercise_id', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm outline-none focus:border-[#DFFF5E]/50"
                        >
                          <option value="">Selecione...</option>
                          {exercises.map(ex => (
                            <option key={ex.id} value={ex.id}>[{ex.category}] {ex.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sets</label>
                        <input 
                          type="number" 
                          value={item.target_sets}
                          onChange={e => updateItem(index, 'target_sets', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm text-center outline-none focus:border-[#DFFF5E]/50"
                        />
                      </div>

                      <div className="w-24 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reps</label>
                        <input 
                          type="text" 
                          value={item.target_reps}
                          onChange={e => updateItem(index, 'target_reps', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm text-center outline-none focus:border-[#DFFF5E]/50"
                        />
                      </div>

                      <button 
                        onClick={() => removeExercise(index)}
                        className="p-3 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5 rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveWorkout}
                  disabled={isSaving}
                  className="bg-[#DFFF5E] hover:bg-[#B8E600] text-black px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingWorkoutId ? 'Salvar Alterações' : 'Criar Treino'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center bg-[#111111] border-2 border-dashed border-white/5 rounded-[40px]">
              <Users className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-slate-400 font-medium">Selecione um aluno ao lado <br/> para começar a montar ou editar treinos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentsTab({ onViewProfile, showToast, searchTerm, teacherInfo }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '' })
  const [isSaving, setIsSaving] = useState(false)

  const fetchStudents = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_students')
      .select('*')
      .eq('teacher_id', teacherInfo.id)
      .order('name')
    if (error) {
      console.error('Erro ao buscar alunos:', error)
    } else {
      setStudents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [teacherInfo?.id])

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    
    // Validar quota
    if (students.length >= teacherInfo.quota_limit) {
      showToast(`Limite de alunos atingido (${teacherInfo.quota_limit}). Entre em contato com o administrador.`, 'error')
      return
    }

    setIsSaving(true)
    
    // Verificar se username já existe no sistema global
    const { data: existingStudent } = await supabase
      .from('gym_students')
      .select('id')
      .eq('username', newStudent.username.toLowerCase().trim())
      .maybeSingle()

    if (existingStudent) {
      showToast('Este nome de usuário já está sendo usado por outro aluno no sistema. Tente algo diferente (ex: nome.sobrenome).', 'error')
      setIsSaving(false)
      return
    }

      const { data, error } = await supabase
      .from('gym_students')
      .insert([{
        ...newStudent,
        teacher_id: teacherInfo.id,
        username: newStudent.username.toLowerCase().trim()
      }])
      .select()

    if (error) {
      showToast('Erro ao cadastrar aluno: ' + error.message, 'error')
    } else {
      showToast('Aluno cadastrado com sucesso!')
      setIsModalOpen(false)
      setNewStudent({ name: '', username: '', password: '' })
      fetchStudents()
    }
    setIsSaving(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Gestão de Alunos</h3>
          <p className="text-xs text-slate-500">Cadastre e gerencie o acesso de seus alunos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#DFFF5E] hover:bg-[#B8E600] text-black px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(223,255,94,0.2)]"
        >
          <Plus className="w-4 h-4" /> Novo Aluno
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-800 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudents.map(s => (
            <div key={s.id} className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between group hover:border-[#DFFF5E]/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-300 group-hover:bg-[#DFFF5E]/10 group-hover:text-[#DFFF5E] transition-colors border border-white/5">
                  {s.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{s.name}</h3>
                  <p className="text-sm text-slate-400">@{s.username}</p>
                </div>
              </div>
                  <button 
                    onClick={() => onViewProfile(s)}
                    className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-[#DFFF5E] hover:text-black transition-all group-hover:scale-110 flex items-center gap-2"
                  >
                    <span className="text-xs font-bold px-1">Ver Perfil</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
            </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full py-20 text-center bg-[#111111] rounded-3xl border-2 border-dashed border-white/5">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum aluno cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#DFFF5E]" /> Cadastrar Novo Aluno
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-300 transition-colors">Fechar</button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 transition-all outline-none"
                  placeholder="Ex: Caio França"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário (Username)</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.username}
                  onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 transition-all outline-none"
                  placeholder="Ex: caio.franca"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                <input 
                  required
                  type="password" 
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 transition-all outline-none"
                  placeholder="Defina uma senha"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-[#DFFF5E] text-black rounded-xl font-bold text-sm hover:bg-[#B8E600] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StudentDetailView({ student, onBack, showToast }) {
  const [workouts, setWorkouts] = useState([])
  const [bioRecords, setBioRecords] = useState([])
  const [goals, setGoals] = useState(student?.goals || '')
  const [loading, setLoading] = useState(true)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [currentSubTab, setCurrentSubTab] = useState('overview') // 'overview', 'workouts', 'evolution'
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState(null)
  const [workoutItems, setWorkoutItems] = useState([])
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: woData } = await supabase.from('gym_workouts').select('*').eq('student_id', student.id).order('sequence_order', { ascending: true })
      if (woData) setWorkouts(woData)
      
      const { data: bioData } = await supabase.from('gym_biopedance_records').select('*').eq('student_id', student.id).order('record_date', { ascending: true })
      if (bioData) setBioRecords(bioData)

      try {
        const { data: stuData } = await supabase.from('gym_students').select('*').eq('id', student.id).single()
        if (stuData) setGoals(stuData.goals || '')
      } catch (e) {
        console.warn('Campo goals não encontrado ou erro na busca:', e)
      }
      
      setLoading(false)
    }
    fetchData()
  }, [student.id])

  const handleSaveGoals = async () => {
    if (!student?.id) {
      showToast('Erro: ID do aluno não encontrado.', 'error');
      return;
    }

    setIsSavingGoals(true)
    try {
      const { data, error } = await supabase
        .from('gym_students')
        .update({ goals: goals })
        .eq('id', student.id)
        .select()

      if (error) {
        console.error('Erro Supabase:', error)
        showToast('Erro ao salvar metas: ' + error.message, 'error')
      } else {
        showToast('Metas atualizadas com sucesso!')
        console.log('Metas salvas:', data)
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
      showToast('Ocorreu um erro inesperado ao salvar.', 'error')
    } finally {
      setIsSavingGoals(false)
    }
  }

  const handleViewWorkoutDetail = async (workout) => {
    setSelectedWorkoutDetail(workout)
    setIsWorkoutModalOpen(true)
    setLoadingItems(true)
    
    const { data, error } = await supabase
      .from('gym_workout_items')
      .select('*, gym_exercises(*)')
      .eq('workout_id', workout.id)
      .order('sequence_order')
    
    if (data) setWorkoutItems(data)
    setLoadingItems(false)
  }

  const handleMoveWorkout = async (index, direction) => {
    const newWorkouts = [...workouts]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newWorkouts.length) return

    // Troca local
    const temp = newWorkouts[index]
    newWorkouts[index] = newWorkouts[targetIndex]
    newWorkouts[targetIndex] = temp

    // Atualiza estados
    setWorkouts(newWorkouts)

    // Salva no banco as novas ordens
    const updates = newWorkouts.map((w, idx) => ({
      id: w.id,
      sequence_order: idx
    }))

    for (const update of updates) {
      await supabase.from('gym_workouts').update({ sequence_order: update.sequence_order }).eq('id', update.id)
    }
    
    showToast('Ordem atualizada!')
  }

  const chartData = (bioRecords || []).map(r => ({
    date: r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
    weight: r.weight || 0,
    fat: r.body_fat_pct || 0,
    muscle: r.muscle_mass_kg || 0
  }))

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-[#DFFF5E] transition-colors font-bold text-sm">
        <ChevronLeft className="w-4 h-4" /> Voltar para Alunos
      </button>

      <div className="flex items-center justify-between bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#DFFF5E]/10 rounded-2xl flex items-center justify-center text-3xl font-bold text-[#DFFF5E]">
            {student?.name?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{student?.name || 'Aluno'}</h2>
            <p className="text-slate-400">@{student?.username || 'usuario'}</p>
          </div>
        </div>
        
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10">
          <button 
            onClick={() => setCurrentSubTab('overview')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'overview' ? 'bg-[#DFFF5E] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setCurrentSubTab('workouts')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'workouts' ? 'bg-[#DFFF5E] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Treinos
          </button>
          <button 
            onClick={() => setCurrentSubTab('evolution')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'evolution' ? 'bg-[#DFFF5E] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Evolução
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#DFFF5E]" /> Evolução Recente
                </h3>
                {bioRecords.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'}} />
                        <Area type="monotone" dataKey="weight" stroke="#DFFF5E" fill="#DFFF5E" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-20 text-slate-400 italic">Nenhum dado de biopedância registrado.</p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0F172A] border border-white/5 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <Activity className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Status Atual</h4>
                {bioRecords.length > 0 ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">Peso Total</span>
                      <span className="text-3xl font-black">{bioRecords[bioRecords.length-1]?.weight || 0}kg</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">% Gordura</span>
                      <span className="text-3xl font-black text-rose-400">{bioRecords[bioRecords.length-1]?.body_fat_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">Massa Magra</span>
                      <span className="text-3xl font-black text-emerald-400">{bioRecords[bioRecords.length-1]?.muscle_mass_kg || 0}kg</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Gord. Visceral</span>
                        <span className="text-xl font-bold text-amber-400">{bioRecords[bioRecords.length-1]?.visceral_fat || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Idade Corp.</span>
                        <span className="text-xl font-bold text-sky-400">{bioRecords[bioRecords.length-1]?.body_age || '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center relative z-10">
                    <Scale className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm italic">Aguardando biopedância.</p>
                  </div>
                )}
              </div>

              <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Metas do Professor</h4>
                <div className="space-y-4">
                  <textarea 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Defina metas para o aluno..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#DFFF5E]/50 transition-all min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={handleSaveGoals}
                    disabled={isSavingGoals}
                    className="w-full bg-[#DFFF5E]/10 text-[#DFFF5E] font-bold py-3 rounded-xl text-xs hover:bg-[#DFFF5E] hover:text-black transition-all disabled:opacity-50"
                  >
                    {isSavingGoals ? 'Salvando...' : 'Atualizar Metas'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSubTab === 'workouts' && (
          <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#DFFF5E]" /> Treinos do Aluno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((w, idx) => (
                <div key={w.id} className="relative group">
                  <button 
                    onClick={() => handleViewWorkoutDetail(w)}
                    className="w-full p-6 bg-white/5 rounded-[32px] border border-white/5 flex flex-col justify-between hover:border-[#DFFF5E]/30 transition-all shadow-sm text-left active:scale-95 relative overflow-hidden"
                  >
                    <div className="mb-6 pr-24"> {/* Adicionado pr-24 para dar espaço aos botões */}
                      <p className="font-bold text-white text-xl mb-1 group-hover:text-[#DFFF5E] transition-colors line-clamp-2">{w.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Criado em {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#DFFF5E] bg-[#DFFF5E]/10 px-3 py-1.5 rounded-full">Ver Exercícios</span>
                      <Dumbbell className="w-5 h-5 text-slate-600 group-hover:text-[#DFFF5E] transition-colors" />
                    </div>
                  </button>

                  {/* Controles de Ordenação - Reposicionados e ajustados */}
                  <div className="absolute top-6 right-6 flex gap-1 z-20">
                    <button 
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'up'); }}
                      className="p-2.5 bg-black/60 rounded-xl text-[#DFFF5E] hover:bg-[#DFFF5E] hover:text-black disabled:opacity-20 border border-white/10 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-4 h-4 rotate-90" />
                    </button>
                    <button 
                      disabled={idx === workouts.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'down'); }}
                      className="p-2.5 bg-black/60 rounded-xl text-[#DFFF5E] hover:bg-[#DFFF5E] hover:text-black disabled:opacity-20 border border-white/10 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
              {workouts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-[#111111] rounded-3xl border-2 border-dashed border-white/5">
                  <p className="text-slate-400 italic">Nenhum treino criado ainda.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentSubTab === 'evolution' && (
          <div className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-[#DFFF5E]" /> Histórico de Evolução
            </h3>
            <div className="space-y-4">
              {bioRecords.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/5 group hover:bg-white/10 hover:border-white/10 hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-black/50 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-white/5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(r.record_date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      <p className="text-lg font-black text-white">{new Date(r.record_date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#DFFF5E] text-lg">{r.weight}kg</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Gordura: <b className="text-white">{r.body_fat_pct}%</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Músculo: <b className="text-white">{r.muscle_mass_kg}kg</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Água: <b className="text-white">{r.body_water_pct || 0}%</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Óssea: <b className="text-white">{r.bone_mass_kg || 0}kg</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Visceral: <b className="text-white">{r.visceral_fat || '-'}</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Idade: <b className="text-white">{r.body_age || '-'}</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">IMC: <b className="text-white">{r.bmi || '-'}</b></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/50 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/5">
                    TMB: {r.tmb || 0} kcal
                  </div>
                </div>
              ))}
              {bioRecords.length === 0 && (
                <p className="text-center py-20 text-slate-400 italic">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalhes do Treino */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedWorkoutDetail?.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lista de Exercícios</p>
              </div>
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingItems ? (
                <div className="py-20 text-center">
                  <Activity className="w-10 h-10 text-[#DFFF5E] animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Itens...</p>
                </div>
              ) : workoutItems.length > 0 ? (
                workoutItems.map((item, idx) => {
                  const ex = Array.isArray(item.gym_exercises) ? item.gym_exercises[0] : item.gym_exercises
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-[#DFFF5E]/30 transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-black/50 flex items-center justify-center overflow-hidden border border-white/5 shadow-sm">
                        {ex?.gif_url ? (
                          <img src={ex.gif_url} className="w-full h-full object-cover" />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{ex?.name || 'Exercício'}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-[#DFFF5E] bg-[#DFFF5E]/10 px-2 py-0.5 rounded-md uppercase">{item.target_sets} Sets</span>
                          <span className="text-[10px] font-bold text-[#C6C4FF] bg-[#C6C4FF]/10 px-2 py-0.5 rounded-md uppercase">{item.target_reps} Reps</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300">
                          <Timer className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.rest_time}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-10 text-center">
                  <p className="text-slate-400 italic">Nenhum exercício vinculado a este treino.</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-black/50 flex gap-4 border-t border-white/5">
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="w-full bg-[#DFFF5E] text-black font-bold py-4 rounded-2xl hover:bg-[#B8E600] transition-all shadow-[0_0_20px_rgba(223,255,94,0.15)]"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FinanceiroTab({ teacherInfo }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, paid: 0, total: 0 })

  const fetchBills = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_billing_records')
      .select('*')
      .eq('teacher_id', teacherInfo.id)
      .order('reference_month', { ascending: false })
    
    if (data) {
      setBills(data)
      const pending = data.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + Number(b.total_amount), 0)
      const paid = data.filter(b => b.status === 'paid').reduce((acc, b) => acc + Number(b.total_amount), 0)
      setStats({ pending, paid, total: pending + paid })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBills()
  }, [teacherInfo?.id])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Pendente</p>
          <h3 className="text-3xl font-black text-rose-400 font-display">R$ {stats.pending.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Pago</p>
          <h3 className="text-3xl font-black text-emerald-400 font-display">R$ {stats.paid.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Preço por Aluno</p>
          <h3 className="text-3xl font-black text-white font-display">R$ 30,00</h3>
        </div>
      </div>

      <section className="bg-[#111111] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white">Histórico de Faturas</h3>
          <p className="text-xs text-slate-400">Cobranças mensais baseadas na quantidade de alunos ativos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Mês Referência</th>
                <th className="px-6 py-4">Qtd Alunos</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2].map(i => <tr key={i} className="animate-pulse h-16 bg-white/5" />)
              ) : bills.map(bill => (
                <tr key={bill.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-bold text-white">{bill.reference_month}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">{bill.student_count} alunos</td>
                  <td className="px-6 py-5 font-black text-white font-display">R$ {Number(bill.total_amount).toFixed(2)}</td>
                  <td className="px-6 py-5 text-xs text-slate-400">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      bill.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      bill.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {bill.status === 'paid' ? 'Pago' : bill.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-500 mb-1">Informação sobre Pagamentos</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            As faturas são geradas automaticamente todo dia 01 com base no número de alunos ativos. 
            Para realizar o pagamento ou contestar valores, entre em contato com o administrador master através do email <b>cf95.souza@gmail.com</b>.
          </p>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, change, trend }) {
  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-white/5 shadow-sm">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        <span className={`text-xs font-bold ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
        }`}>
          {change}
        </span>
      </div>
    </div>
  )
}

function ActivityItem({ title, time }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <p className="text-sm text-slate-700">{title}</p>
      <span className="text-[10px] text-slate-400 font-medium uppercase">{time}</span>
    </div>
  )
}

function SettingsTab({ teacherInfo, setTeacherInfo, showToast }) {
  const [loading, setLoading] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [formData, setFormData] = useState({
    name: teacherInfo?.name || '',
    password: teacherInfo?.password || '',
    confirmPassword: teacherInfo?.password || ''
  })

  // Sincronizar formData se o teacherInfo mudar externamente
  useEffect(() => {
    if (teacherInfo) {
      setFormData({
        name: teacherInfo.name,
        password: teacherInfo.password,
        confirmPassword: teacherInfo.password
      })
    }
  }, [teacherInfo])

  useEffect(() => {
    const fetchUsage = async () => {
      if (!teacherInfo?.id) return
      const { count } = await supabase
        .from('gym_students')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherInfo.id)
      
      setStudentCount(count || 0)
    }
    fetchUsage()
  }, [teacherInfo?.id])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      showToast('As senhas não coincidem', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('gym_teachers')
      .update({
        name: formData.name,
        password: formData.password
      })
      .eq('id', teacherInfo.id)

    if (error) {
      showToast('Erro ao atualizar perfil', 'error')
      setLoading(false)
    } else {
      const updatedTeacher = { ...teacherInfo, name: formData.name, password: formData.password }
      localStorage.setItem('vollonfit_teacher', JSON.stringify(updatedTeacher))
      
      // Atualiza o estado global do Dashboard IMEDIATAMENTE
      setTeacherInfo(updatedTeacher)
      
      showToast('Perfil atualizado com sucesso!')
      setLoading(false)
    }
  }

  const usagePercent = Math.min((studentCount / (teacherInfo?.quota_limit || 1)) * 100, 100)

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Seção de Perfil */}
      <section className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#DFFF5E]/10 rounded-2xl flex items-center justify-center text-[#DFFF5E]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Dados do Perfil</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atualize suas informações de acesso</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2 opacity-50 cursor-not-allowed">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail (Não editável)</label>
              <input 
                type="email" 
                disabled
                value={teacherInfo?.email}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-slate-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#DFFF5E] text-black font-black rounded-2xl hover:bg-[#B8E600] transition-all shadow-[0_0_20px_rgba(223,255,94,0.2)] disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </section>

      {/* Seção de Plano e Uso */}
      <section className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 bg-[#C6C4FF]/10 rounded-2xl flex items-center justify-center text-[#C6C4FF]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Plano & Limites</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gerencie seu crescimento na plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Uso</p>
                <p className="text-3xl font-black text-white font-display">
                  {studentCount} <span className="text-slate-500 text-lg font-bold">/ {teacherInfo?.quota_limit} alunos</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#DFFF5E] uppercase tracking-widest mb-1">Ocupação</p>
                <p className="text-lg font-black text-[#DFFF5E] font-display">{usagePercent.toFixed(0)}%</p>
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-[#DFFF5E]'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Seu plano atual permite cadastrar até <b>{teacherInfo?.quota_limit} alunos</b>. 
              {usagePercent > 80 && " Você está próximo do limite! Considere fazer um upgrade para continuar crescendo."}
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <p className="text-xs font-bold text-[#C6C4FF] uppercase tracking-widest mb-4">Precisa de mais espaço?</p>
            <p className="text-sm text-slate-300 mb-6">Entre em contato com o administrador para expandir seu limite de alunos ou mudar de plano.</p>
            <a 
              href="mailto:cf95.souza@gmail.com" 
              className="w-full py-3 bg-[#C6C4FF] text-slate-900 font-black rounded-xl hover:bg-[#B1AFFF] transition-all text-center text-xs uppercase tracking-widest"
            >
              Falar com Suporte
            </a>
          </div>
        </div>

        {/* Efeito Visual */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C6C4FF]/5 rounded-full blur-3xl pointer-events-none" />
      </section>
    </div>
  )
}


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
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MOCK_EXERCISES, MOCK_STUDENTS } from '../services/mockData'
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('casalgym_admin_tab') || 'overview')
  const [exercises, setExercises] = useState(MOCK_EXERCISES)
  const [viewingStudent, setViewingStudent] = useState(() => {
    const saved = localStorage.getItem('casalgym_admin_viewing_student')
    return saved ? JSON.parse(saved) : null
  })
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) navigate('/', { replace: true })
    }
    checkAuth()
  }, [navigate])

  useEffect(() => {
    localStorage.setItem('casalgym_admin_tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (viewingStudent) {
      localStorage.setItem('casalgym_admin_viewing_student', JSON.stringify(viewingStudent))
    } else {
      localStorage.removeItem('casalgym_admin_viewing_student')
    }
  }, [viewingStudent])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('casalgym_admin_tab')
    localStorage.removeItem('casalgym_admin_viewing_student')
    navigate('/')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white shadow-lg shadow-primary/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-white font-bold tracking-tight">ADMIN <span className="text-primary font-normal">CasalGym</span></span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarLink 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setViewingStudent(null); }} 
          />
          <SidebarLink 
            icon={<Dumbbell className="w-5 h-5" />} 
            label="Exercícios" 
            active={activeTab === 'exercises'} 
            onClick={() => { setActiveTab('exercises'); setViewingStudent(null); }} 
          />
          <SidebarLink 
            icon={<ClipboardList className="w-5 h-5" />} 
            label="Treinos" 
            active={activeTab === 'workouts'} 
            onClick={() => { setActiveTab('workouts'); setViewingStudent(null); }} 
          />
          <SidebarLink 
            icon={<Users className="w-5 h-5" />} 
            label="Alunos" 
            active={activeTab === 'students'} 
            onClick={() => { setActiveTab('students'); setViewingStudent(null); }} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-secondary">
            {activeTab === 'overview' && 'Painel de Controle'}
            {activeTab === 'exercises' && 'Biblioteca de Exercícios'}
            {activeTab === 'workouts' && 'Gestão de Treinos'}
            {activeTab === 'students' && 'Gerenciar Alunos'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
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
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Painel de Gestão</p>
                  <h1 className="text-4xl font-black text-secondary font-display">
                    {activeTab === 'overview' && 'Visão Geral'}
                    {activeTab === 'exercises' && 'Biblioteca de Exercícios'}
                    {activeTab === 'workouts' && 'Gestão de Treinos'}
                    {activeTab === 'students' && 'Meus Alunos'}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome..." 
                      className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all w-72 shadow-sm"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-2xl fitness-gradient flex items-center justify-center text-white font-black text-sm shadow-lg neon-shadow">
                    AD
                  </div>
                </div>
              </header>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'overview' && <OverviewTab onViewProfile={setViewingStudent} />}
                {activeTab === 'exercises' && <ExercisesTab exercises={exercises} />}
                {activeTab === 'workouts' && <WorkoutsTab />}
                {activeTab === 'students' && <StudentsTab onViewProfile={setViewingStudent} />}
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
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-300 text-sm font-bold ${
        active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-500'}`}>
        {icon}
      </div>
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />}
    </button>
  )
}

function OverviewTab({ onViewProfile }) {
  const [stats, setStats] = useState({ exercises: 0, workouts: 0, students: 0, sessionsToday: 0 })
  const [recentStudents, setRecentStudents] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [atRiskStudents, setAtRiskStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    const [exCount, woCount, stCount, logCount] = await Promise.all([
      supabase.from('gym_exercises').select('*', { count: 'exact', head: true }),
      supabase.from('gym_workouts').select('*', { count: 'exact', head: true }),
      supabase.from('gym_students').select('*', { count: 'exact', head: true }),
      supabase.from('gym_training_logs')
        .select('*', { count: 'exact', head: true })
        .eq('workout_date', today)
    ])

    setStats({
      exercises: exCount.count || 0,
      workouts: woCount.count || 0,
      students: stCount.count || 0,
      sessionsToday: logCount.count || 0
    })

    const { data: students } = await supabase
      .from('gym_students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (students) setRecentStudents(students)

    if (logs) setRecentActivities(logs)

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Exercícios" value={stats.exercises} icon={Dumbbell} trend="+3" />
        <KPICard title="Treinos Ativos" value={stats.workouts} icon={ClipboardList} />
        <KPICard title="Alunos" value={stats.students} icon={Users} />
        <KPICard title="Sessões Hoje" value={stats.sessionsToday} icon={Activity} trend="+100%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800">Alunos Recentes</h3>
          </div>
          <div className="space-y-4">
            {recentStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-200 group-hover:border-primary/30">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">{student.name}</h4>
                    <p className="text-xs text-slate-400">@{student.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onViewProfile(student)}
                  className="text-[10px] font-bold text-primary hover:underline"
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

        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800">Atividades Recentes</h3>
          </div>
          <div className="space-y-6">
            {recentActivities.map(log => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 ring-4 ring-emerald-50 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-secondary">{log.gym_students?.name}</span> treinou 
                    <span className="font-bold text-secondary"> {log.gym_exercises?.name}</span>
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
      <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-secondary font-display">Radar de Evasão</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Alunos em risco de desistência (+3 dias off)</p>
            </div>
          </div>
          <span className="bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
            {atRiskStudents.length} Alunos
          </span>
        </div>

        {atRiskStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atRiskStudents.map(student => (
              <div key={student.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-rose-200 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl border border-slate-100 shadow-sm group-hover:border-rose-200 transition-colors">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-secondary text-sm group-hover:text-rose-600 transition-colors">{student.name}</h4>
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
                    className="bg-white text-rose-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-100"
                  >
                    Motivar ›
                  </button>
                </div>
                
                {/* Efeito visual de fundo */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Todos os alunos estão ativos! 🚀</p>
          </div>
        )}
      </section>
    </div>
  )
}

function ExercisesTab() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGif, setSelectedGif] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Peito', description: '', gif_url: '' })

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
        alert('Erro ao atualizar: ' + error.message)
      } else {
        alert('Exercício atualizado!')
      }
    } else {
      const { error } = await supabase
        .from('gym_exercises')
        .insert([newExercise])

      if (error) {
        alert('Erro ao cadastrar: ' + error.message)
      }
    }

    setIsModalOpen(false)
    setEditingId(null)
    setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
    fetchExercises()
    setIsSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Biblioteca de Exercícios</h3>
          <p className="text-xs text-slate-500">Gerencie sua biblioteca de movimentos com demonstrações</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4" /> Novo Exercício
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Preview</th>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="px-6 py-4 h-16 bg-slate-50/50"></td>
                </tr>
              ))
            ) : (
              exercises.map(ex => (
                <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => setSelectedGif(ex)}
                      className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    >
                      {ex.gif_url ? (
                        <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                      ) : (
                        <Dumbbell className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{ex.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {ex.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{ex.description}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => setSelectedGif(ex)}
                      className="text-primary hover:text-primary-dark transition-colors text-xs font-bold"
                    >
                      Ver GIF
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(ex)}
                      className="text-slate-400 hover:text-primary transition-colors text-xs font-bold"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!loading && exercises.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">
                  Nenhum exercício cadastrado. Clique em "Novo Exercício" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro Exercício */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-secondary">
                {editingId ? 'Editar Exercício' : 'Cadastrar Exercício'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ex: Supino Reto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select 
                    value={newExercise.category}
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="https://exemplo.com/exercicio.gif"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Observações</label>
                <textarea 
                  rows="3"
                  value={newExercise.description}
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Instruções de execução..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gif Viewer Modal */}
      {selectedGif && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-secondary">{selectedGif.name}</h3>
              <button 
                onClick={() => setSelectedGif(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="aspect-square bg-slate-900 flex items-center justify-center">
              {selectedGif.gif_url ? (
                <img src={selectedGif.gif_url} alt={selectedGif.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <Dumbbell className="w-20 h-20 text-slate-700" />
              )}
            </div>
            <div className="p-6 bg-slate-50">
              <p className="text-sm text-slate-600 leading-relaxed">{selectedGif.description || 'Sem descrição cadastrada.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutsTab() {
  const [students, setStudents] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estado do novo/existente treino
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentWorkouts, setStudentWorkouts] = useState([])
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutItems, setWorkoutItems] = useState([]) // { exercise_id, target_sets, target_reps, rest_time }

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('gym_students').select('id, name').order('name')
    if (!error) setStudents(data)
    
    const { data: exData } = await supabase.from('gym_exercises').select('id, name, category').order('name')
    if (exData) setExercises(exData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      alert('Preencha todos os campos.')
      return
    }

    setIsSaving(true)
    
    let workoutId = editingWorkoutId

    if (editingWorkoutId) {
      // Atualizar nome do treino se mudou
      await supabase.from('gym_workouts').update({ name: workoutName }).eq('id', editingWorkoutId)
      // Para simplificar a edição de itens, vamos deletar os antigos e inserir os novos
      // (Em um app complexo faríamos update individual, mas aqui o delete/insert é mais limpo)
      await supabase.from('gym_workout_items').delete().eq('workout_id', editingWorkoutId)
    } else {
      // Criar novo cabeçalho
      const { data, error } = await supabase
        .from('gym_workouts')
        .insert([{ name: workoutName, student_id: selectedStudent }])
        .select().single()
      
      if (error) { alert(error.message); setIsSaving(false); return; }
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
      alert('Erro ao salvar exercícios: ' + itemsError.message)
    } else {
      alert(editingWorkoutId ? 'Treino atualizado!' : 'Treino criado!')
      resetForm()
      fetchStudentWorkouts()
    }
    setIsSaving(false)
  }

  const resetForm = () => {
    setEditingWorkoutId(null)
    setWorkoutName('')
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Lateral: Seleção de Aluno e Treinos Existentes */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Selecione o Aluno</label>
            <select 
              value={selectedStudent}
              onChange={e => { setSelectedStudent(e.target.value); resetForm(); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecione...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedStudent && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treinos do Aluno</label>
                <button onClick={resetForm} className="text-[10px] font-bold text-primary hover:underline">Novo Treino</button>
              </div>
              <div className="space-y-2">
                {studentWorkouts.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => loadWorkoutForEdit(w)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      editingWorkoutId === w.id ? 'bg-primary/5 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'
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
              <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-primary" /> {editingWorkoutId ? 'Editando Treino' : 'Novo Treino'}
                  </h3>
                  {editingWorkoutId && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest">Existente</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação do Treino</label>
                  <input 
                    type="text" 
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="Ex: Treino A - Superior (Foco Peito)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-lg font-bold text-secondary">Exercícios da Rotina</h3>
                  <button 
                    onClick={addExercise}
                    className="flex items-center gap-2 text-primary hover:text-primary-dark font-bold text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 p-0.5 bg-primary/10 rounded-full" /> Adicionar Exercício
                  </button>
                </div>

                <div className="space-y-4">
                  {workoutItems.map((item, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exercício {index + 1}</label>
                        <select 
                          value={item.exercise_id}
                          onChange={e => updateItem(index, 'exercise_id', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-center outline-none"
                        />
                      </div>

                      <div className="w-24 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reps</label>
                        <input 
                          type="text" 
                          value={item.target_reps}
                          onChange={e => updateItem(index, 'target_reps', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-center outline-none"
                        />
                      </div>

                      <button 
                        onClick={() => removeExercise(index)}
                        className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
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
                  className="bg-secondary hover:bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingWorkoutId ? 'Salvar Alterações' : 'Criar Treino'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px]">
              <Users className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Selecione um aluno ao lado <br/> para começar a montar ou editar treinos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentsTab({ onViewProfile }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '' })
  const [isSaving, setIsSaving] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_students')
      .select('*')
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
  }, [])

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    setIsSaving(true)
      const { data, error } = await supabase
      .from('gym_students')
      .insert([{
        ...newStudent,
        username: newStudent.username.toLowerCase().trim()
      }])
      .select()

    if (error) {
      alert('Erro ao cadastrar aluno: ' + error.message)
    } else {
      setIsModalOpen(false)
      setNewStudent({ name: '', username: '', password: '' })
      fetchStudents()
    }
    setIsSaving(false)
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-secondary">Gestão de Alunos</h3>
          <p className="text-xs text-slate-500">Cadastre e gerencie o acesso de Caio e Thais</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4" /> Novo Aluno
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {s.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                  <p className="text-sm text-slate-500">@{s.username}</p>
                </div>
              </div>
                  <button 
                    onClick={() => onViewProfile(s)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all group-hover:scale-110 flex items-center gap-2"
                  >
                    <span className="text-xs font-bold px-1">Ver Perfil</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
            </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum aluno cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-secondary flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Cadastrar Novo Aluno
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">Fechar</button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="Defina uma senha"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
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
      const { data: woData } = await supabase.from('gym_workouts').select('*').eq('student_id', student.id)
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
      alert('Erro: ID do aluno não encontrado.');
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

  const chartData = (bioRecords || []).map(r => ({
    date: r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
    weight: r.weight || 0,
    fat: r.body_fat_pct || 0,
    muscle: r.muscle_mass_kg || 0
  }))

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">
        <ChevronLeft className="w-4 h-4" /> Voltar para Alunos
      </button>

      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary">
            {student?.name?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-secondary">{student?.name || 'Aluno'}</h2>
            <p className="text-slate-500">@{student?.username || 'usuario'}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button 
            onClick={() => setCurrentSubTab('overview')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setCurrentSubTab('workouts')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'workouts' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Treinos
          </button>
          <button 
            onClick={() => setCurrentSubTab('evolution')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'evolution' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Evolução
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Evolução Recente
                </h3>
                {bioRecords.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="weight" stroke="#FB7185" fill="#FB7185" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-20 text-slate-400 italic">Nenhum dado de biopedância registrado.</p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <Activity className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Status Atual</h4>
                {bioRecords.length > 0 ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-white/60 text-xs font-medium">Peso Total</span>
                      <span className="text-3xl font-black">{bioRecords[bioRecords.length-1]?.weight || 0}kg</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-white/60 text-xs font-medium">% Gordura</span>
                      <span className="text-3xl font-black text-rose-400">{bioRecords[bioRecords.length-1]?.body_fat_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-white/60 text-xs font-medium">Massa Magra</span>
                      <span className="text-3xl font-black text-emerald-400">{bioRecords[bioRecords.length-1]?.muscle_mass_kg || 0}kg</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] uppercase font-bold">Gord. Visceral</span>
                        <span className="text-xl font-bold text-amber-400">{bioRecords[bioRecords.length-1]?.visceral_fat || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] uppercase font-bold">Idade Corp.</span>
                        <span className="text-xl font-bold text-sky-400">{bioRecords[bioRecords.length-1]?.body_age || '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center relative z-10">
                    <Scale className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm italic">Aguardando biopedância.</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Metas do Professor</h4>
                <div className="space-y-4">
                  <textarea 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Defina metas para o aluno..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={handleSaveGoals}
                    disabled={isSavingGoals}
                    className="w-full bg-primary/10 text-primary font-bold py-3 rounded-xl text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                  >
                    {isSavingGoals ? 'Salvando...' : 'Atualizar Metas'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSubTab === 'workouts' && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Treinos do Aluno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => handleViewWorkoutDetail(w)}
                  className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col justify-between hover:border-primary/30 transition-all group shadow-sm text-left active:scale-95"
                >
                  <div className="mb-6">
                    <p className="font-bold text-secondary text-xl mb-1 group-hover:text-primary transition-colors">{w.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Criado em {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full">Ver Exercícios</span>
                    <Dumbbell className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
              {workouts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 italic">Nenhum treino criado ainda.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentSubTab === 'evolution' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Histórico de Evolução
            </h3>
            <div className="space-y-4">
              {bioRecords.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(r.record_date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      <p className="text-lg font-black text-secondary">{new Date(r.record_date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-secondary text-lg">{r.weight}kg</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Gordura: <b className="text-slate-600">{r.body_fat_pct}%</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Músculo: <b className="text-slate-600">{r.muscle_mass_kg}kg</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Água: <b className="text-slate-600">{r.body_water_pct || 0}%</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Óssea: <b className="text-slate-600">{r.bone_mass_kg || 0}kg</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Visceral: <b className="text-slate-600">{r.visceral_fat || '-'}</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Idade: <b className="text-slate-600">{r.body_age || '-'}</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">IMC: <b className="text-slate-600">{r.bmi || '-'}</b></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-400 border border-slate-100">
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
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-secondary">{selectedWorkoutDetail?.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lista de Exercícios</p>
              </div>
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingItems ? (
                <div className="py-20 text-center">
                  <Activity className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Itens...</p>
                </div>
              ) : workoutItems.length > 0 ? (
                workoutItems.map((item, idx) => {
                  const ex = Array.isArray(item.gym_exercises) ? item.gym_exercises[0] : item.gym_exercises
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                        {ex?.gif_url ? (
                          <img src={ex.gif_url} className="w-full h-full object-cover" />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-secondary">{ex?.name || 'Exercício'}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase">{item.target_sets} Sets</span>
                          <span className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-md uppercase">{item.target_reps} Reps</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-300">
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
            
            <div className="p-8 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="w-full bg-secondary text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-secondary/10"
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

function KPICard({ title, value, change, trend }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-secondary">{value}</h3>
        <span className={`text-xs font-bold ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400'
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

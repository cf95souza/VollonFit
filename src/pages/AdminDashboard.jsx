import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { 
  LayoutDashboard, 
  Dumbbell, 
  ClipboardList, 
  Users, 
  LogOut, 
  Search, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Settings,
  Send,
  Loader2
} from 'lucide-react'

// Importações dos novos componentes modulares
import OverviewTab from '../components/admin/OverviewTab'
import ExercisesTab from '../components/admin/ExercisesTab'
import WorkoutsTab from '../components/admin/WorkoutsTab'
import StudentsTab from '../components/admin/StudentsTab'
import StudentDetailView from '../components/admin/StudentDetailView'
import FinanceiroTab from '../components/admin/FinanceiroTab'
import SettingsTab from '../components/admin/SettingsTab'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [teacherInfo, setTeacherInfo] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  
  // Modal de Motivação
  const [motivationModal, setMotivationModal] = useState({ open: false, student: null, message: '' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('vollonfit_teacher')
    if (!saved) {
      navigate('/login')
      return
    }
    const info = JSON.parse(saved)
    setTeacherInfo(info)
    setLoading(false)

    // Sincronizar dados do banco em tempo real
    const syncData = async () => {
      const { data } = await supabase.from('gym_teachers').select('*').eq('id', info.id).single()
      if (data) {
        setTeacherInfo(data)
        localStorage.setItem('vollonfit_teacher', JSON.stringify(data))
      }
    }
    syncData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_teacher')
    navigate('/login')
  }

  const handleSendMotivation = async () => {
    if (!motivationModal.message.trim()) return
    
    const { error } = await supabase.from('gym_social_notifications').insert([{
      student_id: motivationModal.student.id,
      teacher_id: teacherInfo.id,
      message: motivationModal.message,
      type: 'motivation'
    }])

    if (!error) {
      showToast('Mensagem enviada com sucesso!')
      setMotivationModal({ open: false, student: null, message: '' })
    } else {
      showToast('Erro ao enviar motivação', 'error')
    }
  }

  if (loading || !teacherInfo) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#DFFF5E] animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Autenticando Professor...</p>
      </div>
    )
  }

  const SidebarLink = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => {
        setActiveTab(id)
        setSelectedStudentProfile(null)
        setIsSidebarOpen(false)
      }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
        activeTab === id && !selectedStudentProfile
          ? 'bg-[#DFFF5E] text-black shadow-lg shadow-[#DFFF5E]/20 scale-[1.02]'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  )

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-black text-white font-display tracking-tighter uppercase italic">Vollon<span className="text-[#DFFF5E]">Fit</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarLink id="overview" icon={LayoutDashboard} label="Visão Geral" />
        <SidebarLink id="exercises" icon={Dumbbell} label="Exercícios" />
        <SidebarLink id="workouts" icon={ClipboardList} label="Treinos" />
        <SidebarLink id="students" icon={Users} label="Alunos" />
        <SidebarLink id="financeiro" icon={DollarSign} label="Financeiro" />
        <SidebarLink id="settings" icon={Settings} label="Configurações" />
      </nav>

      <div className="pt-6 border-t border-white/5">
        <div className="bg-white/5 rounded-3xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#DFFF5E] rounded-xl flex items-center justify-center font-black text-black">
            {teacherInfo.name[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black text-white truncate">{teacherInfo.name}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase truncate">Professor</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#DFFF5E]/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white font-display uppercase italic">Vollon<span className="text-[#DFFF5E]">Fit</span></h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#DFFF5E]">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-80 bg-[#0A0A0A] border-r border-white/5 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-[#0A0A0A] animate-in slide-in-from-left duration-300">
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`lg:ml-80 pt-24 lg:pt-0 min-h-screen transition-all duration-500 ${isSidebarOpen ? 'blur-sm scale-95' : ''}`}>
        <div className="px-6 lg:px-12 py-8 lg:py-12">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-white font-display uppercase tracking-tighter">
                {selectedStudentProfile ? `Perfil: ${selectedStudentProfile.name}` : 
                 activeTab === 'overview' ? 'Visão Geral' : 
                 activeTab === 'exercises' ? 'Exercícios' : 
                 activeTab === 'workouts' ? 'Gestão de Treinos' : 
                 activeTab === 'students' ? 'Meus Alunos' : 
                 activeTab === 'financeiro' ? 'Painel Financeiro' :
                 'Configurações'}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
                {selectedStudentProfile ? 'Análise detalhada do aluno' : 'Controle total da sua consultoria fitness'}
              </p>
            </div>

            <div className="relative group w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#DFFF5E] transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar em todo painel..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#111111] border border-white/5 rounded-2xl text-xs text-white focus:outline-none focus:border-[#DFFF5E]/50 focus:ring-1 focus:ring-[#DFFF5E]/20 transition-all font-bold placeholder:text-slate-700" 
              />
            </div>
          </div>

          {/* Renderização Condicional de Abas Modulares */}
          {!selectedStudentProfile ? (
            <>
              {activeTab === 'overview' && (
                <OverviewTab 
                  onViewProfile={setSelectedStudentProfile} 
                  onMotivate={setMotivationModal}
                  searchTerm={searchTerm} 
                  teacherInfo={teacherInfo} 
                />
              )}
              {activeTab === 'exercises' && (
                <ExercisesTab 
                  showToast={showToast} 
                  searchTerm={searchTerm} 
                  teacherInfo={teacherInfo} 
                />
              )}
              {activeTab === 'workouts' && (
                <WorkoutsTab 
                  showToast={showToast} 
                  searchTerm={searchTerm} 
                  teacherInfo={teacherInfo} 
                />
              )}
              {activeTab === 'students' && (
                <StudentsTab 
                  onViewProfile={setSelectedStudentProfile} 
                  showToast={showToast} 
                  searchTerm={searchTerm} 
                  teacherInfo={teacherInfo} 
                />
              )}
              {activeTab === 'financeiro' && (
                <FinanceiroTab 
                  teacherInfo={teacherInfo} 
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  teacherInfo={teacherInfo} 
                  setTeacherInfo={setTeacherInfo}
                  showToast={showToast} 
                />
              )}
            </>
          ) : (
            <StudentDetailView 
              student={selectedStudentProfile} 
              onBack={() => setSelectedStudentProfile(null)}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Modal de Motivação Premium */}
      {motivationModal.open && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">Motivar Aluno</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enviar incentivo para {motivationModal.student?.name}</p>
              </div>
              <button 
                onClick={() => setMotivationModal({ open: false, student: null, message: '' })}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensagem de Incentivo</label>
                <textarea 
                  value={motivationModal.message}
                  onChange={(e) => setMotivationModal({ ...motivationModal, message: e.target.value })}
                  placeholder="Ex: Não desista! Foco no objetivo..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold h-32 resize-none"
                />
              </div>
              <button 
                onClick={handleSendMotivation}
                className="w-full bg-[#DFFF5E] hover:bg-[#B8E600] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#DFFF5E]/10 flex items-center justify-center gap-3 active:scale-95"
              >
                <Send className="w-4 h-4" /> Enviar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-[#DFFF5E]/10 border-[#DFFF5E]/20 text-[#DFFF5E]'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  DollarSign, 
  Settings, 
  LogOut, 
  Search, 
  Menu, 
  X, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Flame,
  Crown,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { supabase } from '../supabaseClient'

// Importações dos componentes modulares
import OverviewTab from '../components/admin/OverviewTab'
import ExercisesTab from '../components/admin/ExercisesTab'
import WorkoutsTab from '../components/admin/WorkoutsTab'
import StudentsTab from '../components/admin/StudentsTab'
import StudentDetailView from '../components/admin/StudentDetailView'
import FinanceiroTab from '../components/admin/FinanceiroTab'
import SettingsTab from '../components/admin/SettingsTab'
import { loadTheme } from '../utils/themeLoader'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [teacherInfo, setTeacherInfo] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  
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
    const syncData = async () => {
      const { data } = await supabase.from('gym_teachers').select('*').eq('id', info.id).single()
      if (data) {
        const { data: sub } = await supabase.from('gym_subscriptions').select('*').eq('teacher_id', data.id).maybeSingle()
        data.subscription = sub
        
        setTeacherInfo(data)
        localStorage.setItem('vollonfit_teacher', JSON.stringify(data))
        loadTheme(data.id)

        if (sub && (sub.status === 'past_due' || sub.status === 'canceled')) {
          setActiveTab('financeiro')
        }
      }
    }
    syncData()

    if (info.subscription && (info.subscription.status === 'past_due' || info.subscription.status === 'canceled')) {
      setActiveTab('financeiro')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_teacher')
    navigate('/login')
  }

  const handleSendMotivation = async () => {
    if (!motivationModal.message.trim()) return
    
    const { error } = await supabase.from('gym_social_notifications').insert([{
      receiver_id: motivationModal.student.id,
      sender_id: teacherInfo.id,
      message: motivationModal.message,
      type: 'motivation'
    }])

    if (!error) {
      showToast('Mensagem enviada com sucesso! 🔥')
      setMotivationModal({ open: false, student: null, message: '' })
    } else {
      showToast('Erro ao enviar motivação', 'error')
    }
  }

  const copyInviteLink = () => {
    const inviteCode = teacherInfo?.username || teacherInfo?.id
    const link = `${window.location.origin}/login?invite=${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    showToast('Link de convite copiado!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading || !teacherInfo) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#E11D2E] border-t-transparent animate-spin" />
        <p className="text-[#A3A3A3] font-display text-xs font-bold uppercase tracking-widest">
          Iniciando Painel do Treinador...
        </p>
      </div>
    )
  }

  const isBlocked = teacherInfo?.subscription?.status === 'past_due' || teacherInfo?.subscription?.status === 'canceled'

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'workouts', label: 'Treinos', icon: Dumbbell },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'exercises', label: 'Exercícios', icon: Flame },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6 bg-[#0F0F0F] text-white">
      
      {/* Brand Top */}
      <div className="mb-6 flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] shadow-md">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-2xl font-black tracking-tight uppercase leading-none block">
              VOLLON<span className="text-[#E11D2E]">FIT</span>
            </span>
            <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-widest">
              PAINEL DO TREINADOR
            </span>
          </div>
        </div>
      </div>

      {/* Professor Perfil Card */}
      <div className="mb-6 p-3.5 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] font-display font-black text-sm shrink-0">
            {teacherInfo.name?.[0] || 'T'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white truncate">{teacherInfo.name}</h2>
            <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
              {teacherInfo.plan_type === 'premium' ? '★ Plano Premium' : 'Plano Basic'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const disabled = isBlocked && item.id !== 'financeiro' && item.id !== 'settings'
          const isActive = activeTab === item.id && !selectedStudentProfile

          return (
            <button
              key={item.id}
              onClick={() => {
                if (disabled) {
                  showToast('Regularize sua assinatura para acessar', 'error')
                  return
                }
                setActiveTab(item.id)
                setSelectedStudentProfile(null)
                setIsSidebarOpen(false)
              }}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 shadow-[0_0_15px_rgba(225,29,46,0.2)]'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-[#141414]'
              } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF3B4A]' : 'text-[#A3A3A3]'}`} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#FF3B4A]" />}
            </button>
          )
        })}
      </nav>

      {/* Box Upgrade / Status */}
      <div className="mt-auto pt-4 border-t border-[#2A2A2A] space-y-3">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#FF3B4A]" />
          <span>Sair da Conta</span>
        </button>
      </div>

    </div>
  )

  return (
    <div className="w-full h-full min-h-screen flex bg-[#0A0A0A] text-white font-body selection:bg-[#E11D2E]/30">
      
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <span className="font-display text-xl font-black uppercase">
            VOLLON<span className="text-[#E11D2E]">FIT</span>
          </span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full bg-[#0F0F0F] border-r border-[#2A2A2A] w-72 shrink-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0F0F0F] border-r border-[#2A2A2A] animate-in slide-in-from-left duration-300 shadow-2xl">
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="absolute top-5 right-4 w-8 h-8 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 lg:p-8 transition-all w-full">
        <div className="pt-16 md:pt-0 max-w-6xl mx-auto w-full">
          
          {/* Header Superior da Página */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
                {selectedStudentProfile ? `Perfil: ${selectedStudentProfile.name}` : 
                 activeTab === 'overview' ? 'Visão Geral' : 
                 activeTab === 'exercises' ? 'Exercícios' : 
                 activeTab === 'workouts' ? 'Prescrição de Treinos' : 
                 activeTab === 'students' ? 'Gestão de Alunos' : 
                 activeTab === 'financeiro' ? 'Assinatura & Faturas' :
                 'Configurações da Conta'}
              </h1>
              <p className="text-xs text-[#A3A3A3] font-medium mt-0.5">
                {selectedStudentProfile 
                  ? 'Acompanhamento detalhado de evolução e biometria do atleta' 
                  : 'Métricas de performance em tempo real, radar de retenção e gestão'}
              </p>
            </div>

            {/* Link de Convite Rápido */}
            {!selectedStudentProfile && (
              <div className="flex items-center gap-2">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-[10px] text-[#A3A3A3] font-mono truncate max-w-[160px] sm:max-w-[200px]">
                    {teacherInfo.username ? `@${teacherInfo.username}` : `ID: ${teacherInfo.id.substring(0,8)}`}
                  </span>
                  <button 
                    onClick={copyInviteLink} 
                    className="p-1 rounded-lg hover:bg-[#1A1A1A] text-[#FF3B4A] transition-colors cursor-pointer"
                    title="Copiar Link de Convite do Aluno"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Barra de Busca Global */}
          <div className="relative w-full max-w-md mb-6">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input 
              type="text" 
              placeholder="Buscar em todo o painel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#E11D2E] transition-colors" 
            />
          </div>

          {/* Abas Dinâmicas */}
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

      {/* Modal de Motivação do Aluno */}
      {motivationModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-lg rounded-3xl border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Motivar Aluno
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Enviar alerta para {motivationModal.student?.name}
                </p>
              </div>
              <button 
                onClick={() => setMotivationModal({ open: false, student: null, message: '' })}
                className="w-9 h-9 bg-[#141414] rounded-xl border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
                  Mensagem de Incentivo
                </label>
                <textarea 
                  value={motivationModal.message}
                  onChange={(e) => setMotivationModal({ ...motivationModal, message: e.target.value })}
                  placeholder="Ex: Vi que você faltou nos últimos dias! Hoje tem treino de pernas, vamos pra cima..."
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors h-28 resize-none"
                />
              </div>

              <button 
                onClick={handleSendMotivation}
                className="vollon-btn-primary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Notificação Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificação */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'error' 
              ? 'bg-[#141414] border-[#E11D2E] text-[#FF3B4A]' 
              : 'bg-[#141414] border-[#2A2A2A] text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#FF3B4A]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#FF3B4A]" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  )
}

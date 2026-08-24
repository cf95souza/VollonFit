import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// Importações dos novos componentes modulares
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
        // Fetch subscription too
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

    // Inicial check from localstorage
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
      showToast('Mensagem enviada com sucesso!')
      setMotivationModal({ open: false, student: null, message: '' })
    } else {
      showToast('Erro ao enviar motivação', 'error')
    }
  }

  if (loading || !teacherInfo) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary-container animate-spin mb-4">autorenew</span>
        <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-[0.3em]">Autenticando Professor...</p>
      </div>
    )
  }

  const isBlocked = teacherInfo?.subscription?.status === 'past_due' || teacherInfo?.subscription?.status === 'canceled'

  const SidebarLink = ({ id, icon, label }) => {
    const disabled = isBlocked && id !== 'financeiro' && id !== 'settings'
    const isActive = activeTab === id && !selectedStudentProfile
    
    return (
      <button
        onClick={() => {
          if (disabled) {
            showToast('Regularize sua assinatura para acessar', 'error')
            return
          }
          setActiveTab(id)
          setSelectedStudentProfile(null)
          setIsSidebarOpen(false)
        }}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-6 py-4 rounded-lg transition-colors duration-300 ${
          isActive
            ? 'bg-surface-container-high text-primary border-r-4 border-primary shadow-[0_0_15px_rgba(195,244,0,0.1)] scale-[1.02]'
            : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
        } ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
        <span className="font-body-md text-sm font-semibold tracking-wide">{label}</span>
      </button>
    )
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-headline-md font-headline-md font-black text-primary flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          VollonFit
        </h1>
        <p className="text-on-surface-variant text-label-caps mt-1 tracking-widest">Painel B2B</p>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container bg-primary-container flex items-center justify-center text-on-primary-container font-headline-lg shrink-0">
          {teacherInfo.name[0]}
        </div>
        <div>
          <h2 className="text-body-md font-headline-md font-bold text-on-surface line-clamp-1">{teacherInfo.name}</h2>
          <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-widest">Painel do Professor</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarLink id="overview" icon="dashboard" label="Visão Geral" />
        <SidebarLink id="students" icon="group" label="Alunos" />
        <SidebarLink id="workouts" icon="event_note" label="Treinos" />
        <SidebarLink id="financeiro" icon="attach_money" label="Financeiro" />
        <SidebarLink id="exercises" icon="fitness_center" label="Exercícios" />
        <SidebarLink id="settings" icon="settings" label="Configurações" />
      </nav>

      <div className="mt-auto mb-6 p-4 rounded-xl bg-surface-container-highest border border-primary-container/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-container via-surface-container-highest to-surface-container-highest"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-primary-container">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-label-caps text-[10px] text-primary-container uppercase tracking-widest">UPGRADE PARA ELITE</span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant text-xs mb-4">Desbloqueie treinos ilimitados e análises com IA.</p>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 px-4 rounded-lg font-headline-md text-[10px] hover:brightness-110 transition-all uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">logout</span> Sair da Conta
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex bg-surface text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card { background: rgba(43, 46, 51, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .text-glow { text-shadow: 0 0 10px rgba(195, 244, 0, 0.5); }
      `}} />
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-on-surface font-display uppercase italic">Vollon<span className="text-primary font-light">Fit</span></h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-primary-container">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* Desktop Sidebar (Flex natural, ocupa altura total pois root é flex e h-full) */}
      <nav className="hidden md:flex flex-col h-full bg-surface-container-low border-r border-outline-variant w-64 shrink-0 z-40">
        <SidebarContent />
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-surface-container-low animate-in slide-in-from-left duration-300">
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 h-full overflow-y-auto overflow-x-hidden p-6 lg:p-10 transition-all duration-500 w-full ${isSidebarOpen ? 'blur-sm scale-95' : ''}`}>
        <div className="pt-16 md:pt-0 max-w-6xl mx-auto w-full">
          
          {/* Dashboard Header */}
          <header className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-display-xl font-display-xl text-primary leading-tight">
                {selectedStudentProfile ? `Perfil: ${selectedStudentProfile.name}` : 
                 activeTab === 'overview' ? 'Visão Geral' : 
                 activeTab === 'exercises' ? 'Exercícios' : 
                 activeTab === 'workouts' ? 'Treinos' : 
                 activeTab === 'students' ? 'Alunos' : 
                 activeTab === 'financeiro' ? 'Financeiro' :
                 'Configurações'}
              </h2>
              <p className="text-body-lg font-body-lg text-on-surface-variant">
                {selectedStudentProfile ? 'Análise detalhada do aluno' : 'Métricas de performance em tempo real e gestão de alunos.'}
              </p>
            </div>
            {!selectedStudentProfile && (
              <div className="flex gap-3">
                {/* Invite Link Tool */}
                <div className="flex items-center bg-surface-container rounded-lg p-1 border border-outline-variant hidden sm:flex">
                  <div className="px-3 py-2 text-on-surface-variant font-data-display text-[10px] truncate max-w-[150px] sm:max-w-[200px]">vollon.fit/join/{teacherInfo.username || teacherInfo.id.substring(0,8)}</div>
                  <button onClick={() => showToast('Link copiado!')} className="bg-surface-container-high hover:bg-surface-bright text-primary p-2 rounded-md transition-colors" title="Copiar Link de Convite">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
            )}
          </header>

          <div className="relative group w-full md:w-80 mb-8">
            <span className="material-symbols-outlined text-lg absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Buscar em todo painel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#15171a] border border-outline-variant/30 rounded-xl font-display-md text-sm text-on-surface focus:outline-none focus:border-primary-container transition-all placeholder:text-[#64748b]" 
            />
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
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-outline-variant/30 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest">
              <div>
                <h3 className="text-2xl font-display-xl text-on-surface uppercase tracking-tight">Motivar Aluno</h3>
                <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-widest mt-1">Enviar incentivo para {motivationModal.student?.name}</p>
              </div>
              <button 
                onClick={() => setMotivationModal({ open: false, student: null, message: '' })}
                className="p-3 bg-surface-container rounded-2xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6 bg-surface-container/50">
              <div className="space-y-2">
                <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest ml-1">Mensagem de Incentivo</label>
                <textarea 
                  value={motivationModal.message}
                  onChange={(e) => setMotivationModal({ ...motivationModal, message: e.target.value })}
                  placeholder="Ex: Não desista! Foco no objetivo..."
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md text-sm h-32 resize-none"
                />
              </div>
              <button 
                onClick={handleSendMotivation}
                className="w-full bg-primary-container hover:bg-surface-tint text-on-primary-container py-4 rounded-xl font-label-caps text-sm uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(195,244,0,0.2)] flex items-center justify-center gap-3 active:scale-95 neon-glow"
              >
                <span className="material-symbols-outlined">send</span> Enviar Agora
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
              ? 'bg-error/10 border-error/20 text-error' 
              : 'bg-primary-container/10 border-primary-container/20 text-primary-container'
          }`}>
            {toast.type === 'error' ? <span className="material-symbols-outlined text-xl">error</span> : <span className="material-symbols-outlined text-xl">check_circle</span>}
            <span className="text-[10px] font-label-caps uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

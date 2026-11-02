import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Receipt, 
  Dumbbell, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X, 
  ShieldAlert,
  Crown
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function MasterShell({ children, activeTab, setActiveTab }) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'academies', label: 'Academias (B2B)', icon: Building2 },
    { id: 'teachers', label: 'Professores', icon: Users },
    { id: 'billing', label: 'Faturamento', icon: Receipt },
    { id: 'exercises', label: 'Exercícios', icon: Dumbbell },
    { id: 'products', label: 'Marketplace ADM', icon: ShoppingBag },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0F0F0F] text-white">
      {/* Top Brand Logo */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-2xl font-black tracking-tight uppercase leading-none block">
              VOLLON<span className="text-[#E11D2E]">FIT</span>
            </span>
            <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-widest">
              MASTER CONTROL
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 shadow-[0_0_15px_rgba(225,29,46,0.2)]'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-[#141414]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF3B4A]' : 'text-[#A3A3A3]'}`} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#FF3B4A]" />}
            </button>
          )
        })}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] rounded-2xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#FF3B4A]" />
          <span>Sair da Sessão</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] font-body text-white selection:bg-[#E11D2E]/30">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 border-r border-[#2A2A2A] flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 h-full flex flex-col animate-in slide-in-from-left duration-200 border-r border-[#2A2A2A] shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-5 right-4 w-8 h-8 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] relative">
        
        {/* Top Header */}
        <header className="h-20 bg-[#0A0A0A]/90 backdrop-blur-md px-5 lg:px-8 flex items-center justify-between shrink-0 border-b border-[#2A2A2A] relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDrawerOpen(true)} 
              className="lg:hidden w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight truncate hidden lg:block">
                {navItems.find(n => n.id === activeTab)?.label || 'VollonFit'}
              </h2>
            </div>
          </div>

          {/* Master Admin Profile Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">Master Admin</p>
              <p className="text-[10px] text-[#A3A3A3] font-medium">cf95.souza@gmail.com</p>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#141414] border border-[#2A2A2A] text-[#FF3B4A] font-display font-black text-sm shadow-md">
              CS
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 relative z-0">
          <div className="max-w-7xl mx-auto pb-16">
            {children}
          </div>
        </div>

      </main>
    </div>
  )
}

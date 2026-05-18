import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import {
  LayoutDashboard, Users2, Receipt, Dumbbell, Settings,
  LogOut, Gem, Menu, X, ChevronRight, Building2, ShoppingBag
} from 'lucide-react'

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
    { id: 'teachers', label: 'Professores', icon: Users2 },
    { id: 'billing', label: 'Faturamento', icon: Receipt },
    { id: 'exercises', label: 'Exercícios', icon: Dumbbell },
    { id: 'products', label: 'Marketplace ADM', icon: ShoppingBag },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ]

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg text-black">
          <Gem className="w-5 h-5" />
        </div>
        <span className="text-white font-bold tracking-tight text-lg">
          VOLLON<span className="text-primary text-xs font-normal ml-0.5">FIT</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-primary text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
            {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-lg transition-all text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black font-sans text-slate-200">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-60 bg-[#0F172A] border-r border-white/5 flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 h-full bg-[#0F172A] flex flex-col animate-in slide-in-from-left duration-200 border-r border-white/10">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A]">
        <header className="h-14 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-white truncate">
              {navItems.find(n => n.id === activeTab)?.label || 'VollonFit'}
            </h2>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs shadow-[0_0_10px_rgba(223,255,94,0.3)]">
            CS
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

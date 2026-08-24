import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function MasterShell({ children, activeTab, setActiveTab }) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'academies', label: 'Academias (B2B)', icon: 'domain' },
    { id: 'teachers', label: 'Professores', icon: 'groups' },
    { id: 'billing', label: 'Faturamento', icon: 'receipt_long' },
    { id: 'exercises', label: 'Exercícios', icon: 'fitness_center' },
    { id: 'products', label: 'Marketplace ADM', icon: 'shopping_bag' },
    { id: 'settings', label: 'Configurações', icon: 'settings' },
  ]

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary flex items-center justify-center p-2 rounded-xl text-[#101417] shadow-[0_0_15px_rgba(195,244,0,0.5)]">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
        </div>
        <span className="text-on-surface font-display-xl font-black text-2xl tracking-tighter">
          VOLLON<span className="text-primary text-2xl font-light">FIT</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-label-caps text-xs uppercase tracking-widest transition-all mb-1 ${
              activeTab === item.id
                ? 'bg-primary text-[#101417] font-bold shadow-[0_0_15px_rgba(195,244,0,0.3)]'
                : 'text-[#64748b] hover:text-on-surface hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            {item.label}
            {activeTab === item.id && <span className="material-symbols-outlined text-sm ml-auto">chevron_right</span>}
          </button>
        ))}
      </nav>
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#64748b] hover:text-error hover:bg-error/10 rounded-2xl transition-all font-label-caps text-xs uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-on-surface">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-surface-container border-r border-white/5 flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 h-full bg-surface-container flex flex-col animate-in slide-in-from-left duration-200 border-r border-white/5">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
        <header className="h-20 bg-background/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-[#64748b] hover:text-on-surface">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-display-md text-on-surface tracking-tight text-xl truncate hidden lg:block">
              {navItems.find(n => n.id === activeTab)?.label || 'VollonFit'}
            </h2>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-[#101417] font-bold text-sm shadow-[0_0_15px_rgba(195,244,0,0.3)]">
            CS
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar relative z-0">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

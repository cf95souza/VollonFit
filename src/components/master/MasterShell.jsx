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
      <div className="p-5 border-b border-outline-variant/30 flex items-center gap-3">
        <div className="bg-primary-container p-2 rounded-lg text-on-primary-container shadow-lg shadow-primary-container/20 neon-glow">
          <span className="material-symbols-outlined text-xl">diamond</span>
        </div>
        <span className="text-on-surface font-display-md tracking-tight text-lg">
          VOLLON<span className="text-primary-container text-xs font-normal ml-0.5">FIT</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-label-caps text-[10px] uppercase tracking-widest transition-all ${
              activeTab === item.id
                ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 neon-glow'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
            {activeTab === item.id && <span className="material-symbols-outlined text-sm ml-auto">chevron_right</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-outline-variant/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all font-label-caps text-[10px] uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface font-sans text-on-surface">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-60 bg-surface-container border-r border-outline-variant/30 flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 h-full bg-surface-container flex flex-col animate-in slide-in-from-left duration-200 border-r border-outline-variant/30">
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
      <main className="flex-1 flex flex-col overflow-hidden bg-surface">
        <header className="h-14 bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/30 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-headline-md text-on-surface truncate">
              {navItems.find(n => n.id === activeTab)?.label || 'VollonFit'}
            </h2>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-label-caps text-[10px] shadow-[0_0_10px_rgba(195,244,0,0.3)] neon-glow">
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

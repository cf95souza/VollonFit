import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

import MasterShell from '../components/master/MasterShell'
import MasterOverview from '../components/master/MasterOverview'
import MasterTeachers from '../components/master/MasterTeachers'
import MasterBilling from '../components/master/MasterBilling'
import MasterSettings from '../components/master/MasterSettings'
import MasterAcademies from '../components/master/MasterAcademies'
import MasterProducts from '../components/master/MasterProducts'

export default function MasterDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [checking, setChecking] = useState(true)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'cf95.souza@gmail.com') {
        navigate('/', { replace: true })
      }
      setChecking(false)
    }
    checkAuth()
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-primary-container animate-spin text-5xl mb-4 block">sync</span>
        <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-[0.3em]">Autenticando Master...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-container/30">
      <MasterShell activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <MasterOverview onNavigate={setActiveTab} />}
          {activeTab === 'academies' && <MasterAcademies showToast={showToast} />}
          {activeTab === 'teachers' && <MasterTeachers showToast={showToast} />}
          {activeTab === 'billing' && <MasterBilling showToast={showToast} />}
          {activeTab === 'exercises' && <ExercisesManagement showToast={showToast} />}
          {activeTab === 'products' && <MasterProducts showToast={showToast} />}
          {activeTab === 'settings' && <MasterSettings showToast={showToast} />}
        </div>
      </MasterShell>

      {/* Toast Premium */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-xl border glass-panel ${
            toast.type === 'error' 
              ? 'bg-error-container/80 border-error/20 text-on-error-container' 
              : 'bg-primary-container/80 border-primary-container/20 text-on-primary-container'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {toast.type === 'error' ? 'error_outline' : 'check_circle'}
            </span>
            <span className="font-label-caps text-sm uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Exercícios - TEMA DARK NEON
// ============================================================
function ExercisesManagement({ showToast }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Peito', description: '', gif_url: '' })

  const categories = ['Todos', 'Peito', 'Costas', 'Pernas', 'Bíceps', 'Tríceps', 'Ombros', 'Abdômen']

  const fetchExercises = async () => {
    setLoading(true)
    const { data } = await supabase.from('gym_exercises').select('*').order('name')
    if (data) setExercises(data)
    setLoading(false)
  }

  useEffect(() => { fetchExercises() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await supabase.from('gym_exercises').update(newExercise).eq('id', editingId)
        showToast('Exercício atualizado!')
      } else {
        await supabase.from('gym_exercises').insert([newExercise])
        showToast('Exercício criado!')
      }
      setIsModalOpen(false)
      setEditingId(null)
      setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
      fetchExercises()
    } catch (err) {
      showToast('Erro ao salvar', 'error')
    } finally { setIsSaving(false) }
  }

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || ex.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="font-display-lg text-3xl text-on-surface uppercase tracking-tight">Gestão de Acervo</h2>
          <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-1">Controle a biblioteca global de exercícios</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-container transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Filtrar acervo..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all font-body-md" 
            />
          </div>
          <button 
            onClick={() => { setEditingId(null); setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' }); setIsModalOpen(true) }}
            className="bg-primary-container hover:brightness-110 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95 neon-glow"
          >
            <span className="material-symbols-outlined text-sm">add</span> Novo Exercício
          </button>
        </div>
      </div>

      {/* Pills de Filtro */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-label-caps text-[10px] uppercase tracking-widest transition-all border ${
              selectedCategory === cat
                ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_15px_rgba(195,244,0,0.3)] neon-glow'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/50 hover:text-on-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="glass-panel border border-outline-variant/30 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/30">
                <th className="px-8 py-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Exercício</th>
                <th className="px-8 py-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Categoria</th>
                <th className="px-8 py-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Descrição</th>
                <th className="px-8 py-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <span className="material-symbols-outlined animate-spin mx-auto text-primary-container/50 text-4xl block">sync</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-on-surface-variant font-label-caps uppercase tracking-widest text-xs">
                    Nenhum exercício encontrado no acervo.
                  </td>
                </tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex.id} className="hover:bg-surface-container transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center shrink-0 group-hover:border-primary-container transition-colors">
                          {ex.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">fitness_center</span>}
                        </div>
                        <span className="font-headline-md text-on-surface text-base tracking-tight uppercase">{ex.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-full font-label-caps text-[10px] uppercase tracking-widest border border-primary-container/20">
                        {ex.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-body-md text-sm text-on-surface-variant max-w-[300px] truncate">
                      {ex.description || '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => { setEditingId(ex.id); setNewExercise({ name: ex.name, category: ex.category, description: ex.description || '', gif_url: ex.gif_url || '' }); setIsModalOpen(true) }}
                        className="px-4 py-2 bg-surface-container rounded-xl text-secondary-container hover:bg-secondary-container hover:text-on-secondary-container transition-all border border-outline-variant/30 font-label-caps text-[10px] uppercase tracking-wider"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-[40px] border border-outline-variant/30 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest">
              <div>
                <h3 className="font-display-md text-2xl text-on-surface uppercase tracking-tight">
                  {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                </h3>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Configuração do item no acervo</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-surface-container rounded-2xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Nome do Exercício</label>
                  <input 
                    required 
                    placeholder="Ex: Leg Press 45" 
                    value={newExercise.name} 
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={newExercise.category} 
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md appearance-none cursor-pointer"
                  >
                    {['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Abdômen'].map(c => <option key={c} className="bg-surface">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">URL do GIF de Demonstração</label>
                <input 
                  placeholder="https://exemplo.com/gif-animado.gif" 
                  value={newExercise.gif_url} 
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md" 
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Instruções de Execução</label>
                <textarea 
                  placeholder="Descreva a técnica correta..." 
                  value={newExercise.description} 
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md h-32 resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-primary-container hover:brightness-110 text-on-primary-container py-5 rounded-2xl font-label-caps text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-container/10 active:scale-[0.98] disabled:opacity-50 neon-glow"
              >
                {isSaving ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Exercício'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

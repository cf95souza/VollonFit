import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

import MasterShell from '../components/master/MasterShell'
import MasterOverview from '../components/master/MasterOverview'
import MasterTeachers from '../components/master/MasterTeachers'
import MasterBilling from '../components/master/MasterBilling'
import MasterSettings from '../components/master/MasterSettings'

// Reutilizar o ExercisesManagement que já existe
import { Dumbbell, Plus, X, Search } from 'lucide-react'

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#DFFF5E] animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Autenticando Master...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#DFFF5E]/30">
      <MasterShell activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <MasterOverview onNavigate={setActiveTab} />}
          {activeTab === 'teachers' && <MasterTeachers showToast={showToast} />}
          {activeTab === 'billing' && <MasterBilling showToast={showToast} />}
          {activeTab === 'exercises' && <ExercisesManagement showToast={showToast} />}
          {activeTab === 'settings' && <MasterSettings showToast={showToast} />}
        </div>
      </MasterShell>

      {/* Toast Premium */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-[#DFFF5E]/10 border-[#DFFF5E]/20 text-[#DFFF5E]'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
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
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Gestão de Acervo</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Controle a biblioteca global de exercícios</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#DFFF5E] transition-colors" />
            <input 
              type="text" 
              placeholder="Filtrar acervo..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#111111] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-[#DFFF5E]/50 focus:ring-1 focus:ring-[#DFFF5E]/20 transition-all font-bold" 
            />
          </div>
          <button 
            onClick={() => { setEditingId(null); setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' }); setIsModalOpen(true) }}
            className="bg-[#DFFF5E] hover:bg-[#B8E600] text-black px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#DFFF5E]/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Exercício
          </button>
        </div>
      </div>

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

      <div className="bg-[#111111] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exercício</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoria</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#DFFF5E]/50" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Nenhum exercício encontrado no acervo.
                  </td>
                </tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex.id} className="hover:bg-white/10 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#DFFF5E]/50 transition-colors">
                          {ex.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <Dumbbell className="w-6 h-6 text-slate-700" />}
                        </div>
                        <span className="font-black text-white text-base tracking-tight uppercase">{ex.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-[#DFFF5E]/10 text-[#DFFF5E] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#DFFF5E]/20">
                        {ex.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400 font-medium max-w-[300px] truncate">
                      {ex.description || '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => { setEditingId(ex.id); setNewExercise({ name: ex.name, category: ex.category, description: ex.description || '', gif_url: ex.gif_url || '' }); setIsModalOpen(true) }}
                        className="p-3 bg-white/5 rounded-xl text-[#C6C4FF] hover:bg-[#C6C4FF] hover:text-black transition-all border border-white/5"
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#111111] w-full max-w-xl rounded-[40px] border border-white/10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                  {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuração do item no acervo</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Exercício</label>
                  <input 
                    required 
                    placeholder="Ex: Leg Press 45" 
                    value={newExercise.name} 
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={newExercise.category} 
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold appearance-none cursor-pointer"
                  >
                    {['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Abdômen'].map(c => <option key={c} className="bg-[#111111]">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL do GIF de Demonstração</label>
                <input 
                  placeholder="https://exemplo.com/gif-animado.gif" 
                  value={newExercise.gif_url} 
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instruções de Execução</label>
                <textarea 
                  placeholder="Descreva a técnica correta..." 
                  value={newExercise.description} 
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold h-32 resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-[#DFFF5E] hover:bg-[#B8E600] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#DFFF5E]/10 active:scale-[0.98] disabled:opacity-50"
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

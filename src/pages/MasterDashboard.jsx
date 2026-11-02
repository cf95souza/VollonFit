import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  Search, 
  Plus, 
  Edit2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react'
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
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#E11D2E] border-t-transparent animate-spin" />
        <p className="text-[#A3A3A3] font-display text-xs font-bold uppercase tracking-widest">
          Autenticando Master...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-body selection:bg-[#E11D2E]/30">
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

      {/* Toast Notificação */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'error' 
              ? 'bg-[#141414] border-[#E11D2E] text-[#FF3B4A]' 
              : 'bg-[#141414] border-[#2A2A2A] text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-[#FF3B4A]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#FF3B4A]" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Exercícios - GESTÃO GLOBAL DE ACERVO (REBRAND VOLLONFIT)
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
      showToast('Erro ao salvar: ' + err.message, 'error')
    } finally { setIsSaving(false) }
  }

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || ex.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white">
            Gestão de Acervo
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Controle a biblioteca global de exercícios disponíveis para todos os treinadores
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input 
              type="text" 
              placeholder="Buscar exercício..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#E11D2E] transition-colors" 
            />
          </div>
          <button 
            onClick={() => { 
              setEditingId(null)
              setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
              setIsModalOpen(true) 
            }}
            className="vollon-btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_6px_20px_rgba(255,59,74,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Exercício</span>
          </button>
        </div>
      </div>

      {/* Pills de Categoria */}
      <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/40 shadow-sm'
                : 'bg-[#141414] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tabela de Exercícios */}
      <div className="vollon-card rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Exercício</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-[#A3A3A3] text-xs font-bold uppercase tracking-widest">
                    Nenhum exercício encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex.id} className="hover:bg-[#1A1A1A]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] flex items-center justify-center shrink-0 group-hover:border-[#E11D2E]/60 transition-colors">
                          {ex.gif_url ? (
                            <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell className="w-5 h-5 text-[#A3A3A3]" />
                          )}
                        </div>
                        <span className="font-bold text-sm text-white uppercase">{ex.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] font-bold text-white uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#A3A3A3] max-w-[280px] truncate">
                      {ex.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { 
                          setEditingId(ex.id)
                          setNewExercise({ 
                            name: ex.name, 
                            category: ex.category, 
                            description: ex.description || '', 
                            gif_url: ex.gif_url || '' 
                          })
                          setIsModalOpen(true) 
                        }}
                        className="px-3.5 py-1.5 bg-[#1A1A1A] hover:border-[#E11D2E] text-white border border-[#2A2A2A] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#FF3B4A]" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar / Editar Exercício */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-lg rounded-3xl border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Biblioteca Oficial VollonFit
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 bg-[#141414] rounded-xl border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Nome do Exercício *
                  </label>
                  <input 
                    required 
                    placeholder="Ex: Leg Press 45" 
                    value={newExercise.name} 
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Categoria *
                  </label>
                  <select 
                    value={newExercise.category} 
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer"
                  >
                    {['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Abdômen'].map(c => (
                      <option key={c} value={c} className="bg-[#141414] text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  URL do GIF de Demonstração
                </label>
                <input 
                  placeholder="https://exemplo.com/gif-animado.gif" 
                  value={newExercise.gif_url} 
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Instruções de Execução
                </label>
                <textarea 
                  placeholder="Descreva a técnica correta..." 
                  value={newExercise.description} 
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors h-28 resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="vollon-btn-primary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar Alterações' : 'Cadastrar Exercício'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}

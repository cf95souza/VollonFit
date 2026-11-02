import React, { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Edit2, 
  Eye, 
  X, 
  Loader2, 
  Flame, 
  Sparkles 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function ExercisesTab({ showToast, searchTerm, teacherInfo }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGif, setSelectedGif] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Peito', description: '', gif_url: '' })
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const categories = ['Todos', 'Peito', 'Costas', 'Pernas', 'Bíceps', 'Tríceps', 'Ombros', 'Abdômen']

  const fetchExercises = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_exercises')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar exercícios:', error)
    } else {
      setExercises(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const handleCreateExercise = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    if (editingId) {
      const { error } = await supabase
        .from('gym_exercises')
        .update(newExercise)
        .eq('id', editingId)

      if (error) {
        showToast('Erro ao atualizar: ' + error.message, 'error')
      } else {
        showToast('Exercício atualizado com sucesso!')
      }
    } else {
      const { error } = await supabase
        .from('gym_exercises')
        .insert([{ ...newExercise, teacher_id: teacherInfo.id }])

      if (error) {
        showToast('Erro ao cadastrar: ' + error.message, 'error')
      } else {
        showToast('Exercício cadastrado com sucesso!')
      }
    }

    setIsModalOpen(false)
    setEditingId(null)
    setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
    fetchExercises()
    setIsSaving(false)
  }

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || ex.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Biblioteca de Exercícios
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Consulte a biblioteca padrão ou cadastre movimentos customizados com GIFs demonstrativos
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' })
            setIsModalOpen(true)
          }}
          className="vollon-btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.3)] whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Exercício</span>
        </button>
      </div>

      {/* Pills de Categoria */}
      <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/40'
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
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Exercício</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Grupo Muscular</th>
                <th className="px-6 py-4 text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">Instruções</th>
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
              ) : filteredExercises.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-[#A3A3A3] text-xs font-bold uppercase tracking-widest">
                    Nenhum exercício encontrado.
                  </td>
                </tr>
              ) : (
                filteredExercises.map(ex => (
                  <tr key={ex.id} className="hover:bg-[#1A1A1A]/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => ex.gif_url && setSelectedGif(ex)}
                          className="w-12 h-12 bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2A2A2A] flex items-center justify-center shrink-0 group-hover:border-[#E11D2E]/60 transition-colors cursor-pointer"
                        >
                          {ex.gif_url ? (
                            <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell className="w-5 h-5 text-[#A3A3A3]" />
                          )}
                        </button>
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

      {/* Modal Criar / Editar Exercício */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-lg rounded-3xl border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  {editingId ? 'Editar Exercício' : 'Novo Exercício'}
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Biblioteca do Treinador
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 bg-[#141414] rounded-xl border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateExercise} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Nome do Exercício *
                  </label>
                  <input 
                    required 
                    placeholder="Ex: Supino Inclinado com Halteres" 
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
                  placeholder="https://exemplo.com/gif-execucao.gif" 
                  value={newExercise.gif_url} 
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Instruções de Postura / Observações
                </label>
                <textarea 
                  placeholder="Dicas de amplitude, cadência e postura..." 
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

      {/* Modal Prévia de GIF */}
      {selectedGif && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="vollon-card rounded-3xl p-6 border border-[#2A2A2A] max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
              <h4 className="font-bold text-sm text-white">{selectedGif.name}</h4>
              <button onClick={() => setSelectedGif(null)} className="text-[#A3A3A3] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-square bg-[#0A0A0A] border border-[#2A2A2A]">
              <img src={selectedGif.gif_url} alt={selectedGif.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

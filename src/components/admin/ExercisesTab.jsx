import React, { useState, useEffect } from 'react'
import { Dumbbell, X, ClipboardList } from 'lucide-react'
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
      setExercises(data)
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
        showToast('Exercício atualizado!')
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

      <div className="bg-[#111111] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111111] sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-lg text-white">Acervo Global de Exercícios</h3>
            <p className="text-xs text-slate-400">Consulte a biblioteca padronizada para montar seus treinos</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="3" className="px-6 py-4 h-16 bg-white/5"></td>
                  </tr>
                ))
              ) : (
                filteredExercises.map(ex => (
                  <tr 
                    key={ex.id} 
                    onClick={() => setSelectedGif(ex)}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-[#DFFF5E] transition-colors">
                        {ex.gif_url ? (
                          <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">{ex.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredExercises.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-slate-500 italic">
                    Nenhum exercício encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                {editingId ? 'Editar Exercício' : 'Cadastrar Exercício'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
            <form onSubmit={handleCreateExercise} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    value={newExercise.name}
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                    placeholder="Ex: Supino Reto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select 
                    value={newExercise.category}
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                  >
                    <option>Peito</option>
                    <option>Costas</option>
                    <option>Pernas</option>
                    <option>Bíceps</option>
                    <option>Tríceps</option>
                    <option>Ombros</option>
                    <option>Abdômen</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">GIF URL (Demonstração)</label>
                <input 
                  type="url" 
                  value={newExercise.gif_url}
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none"
                  placeholder="https://exemplo.com/exercicio.gif"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Observações</label>
                <textarea 
                  rows="3"
                  value={newExercise.description}
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-[#DFFF5E]/50 outline-none resize-none"
                  placeholder="Instruções de execução..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-[#DFFF5E] text-black rounded-xl font-bold text-sm hover:bg-[#B8E600] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gif Viewer Modal */}
      {selectedGif && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-[32px] max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#111111]">
              <div>
                <span className="bg-[#DFFF5E]/10 text-[#DFFF5E] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#DFFF5E]/20 mb-2 inline-block">
                  {selectedGif.category}
                </span>
                <h3 className="font-black text-2xl text-white font-display uppercase tracking-tight">{selectedGif.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedGif(null)}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video bg-black flex items-center justify-center relative group">
              {selectedGif.gif_url ? (
                <img src={selectedGif.gif_url} alt={selectedGif.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-700">
                  <Dumbbell className="w-16 h-16" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sem demonstração visual</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            <div className="p-8 bg-[#111111]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#DFFF5E]" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruções de Execução</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {selectedGif.description || 'Nenhuma instrução específica cadastrada para este exercício.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button 
                onClick={() => setSelectedGif(null)}
                className="w-full py-4 bg-[#DFFF5E] text-black font-black rounded-2xl hover:bg-[#B8E600] transition-all shadow-[0_0_20px_rgba(223,255,94,0.15)] uppercase text-xs tracking-widest"
              >
                Entendido, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

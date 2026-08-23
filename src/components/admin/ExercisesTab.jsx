import React, { useState, useEffect } from 'react'
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
            className={`px-6 py-2.5 rounded-full font-label-caps text-[10px] uppercase tracking-widest transition-all border ${
              selectedCategory === cat
                ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_15px_rgba(195,244,0,0.3)]'
                : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/50 hover:text-on-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest sticky top-0 z-10">
          <div>
            <h3 className="font-headline-lg text-lg text-on-surface">Acervo Global de Exercícios</h3>
            <p className="font-body-md text-xs text-on-surface-variant">Consulte a biblioteca padronizada para montar seus treinos</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface text-on-surface-variant font-label-caps text-xs uppercase tracking-wider border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="3" className="px-6 py-4 h-16 bg-surface-container-high"></td>
                  </tr>
                ))
              ) : (
                filteredExercises.map(ex => (
                  <tr 
                    key={ex.id} 
                    onClick={() => setSelectedGif(ex)}
                    className="hover:bg-surface-container transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center overflow-hidden group-hover:border-primary-container transition-colors">
                        {ex.gif_url ? (
                          <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-xl text-on-surface-variant">fitness_center</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-headline-md text-on-surface">{ex.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded font-label-caps text-[10px] uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredExercises.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-on-surface-variant italic">
                    Nenhum exercício encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest rounded-t-3xl">
              <h3 className="font-headline-lg text-lg text-on-surface">
                {editingId ? 'Editar Exercício' : 'Cadastrar Exercício'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateExercise} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    value={newExercise.name}
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container outline-none transition-all"
                    placeholder="Ex: Supino Reto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Categoria</label>
                  <select 
                    value={newExercise.category}
                    onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container outline-none transition-all"
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
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">GIF URL (Demonstração)</label>
                <input 
                  type="url" 
                  value={newExercise.gif_url}
                  onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container outline-none transition-all"
                  placeholder="https://exemplo.com/exercicio.gif"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Descrição / Observações</label>
                <textarea 
                  rows="3"
                  value={newExercise.description}
                  onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container outline-none resize-none transition-all"
                  placeholder="Instruções de execução..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface-variant rounded-xl font-label-caps text-sm hover:bg-surface-container-high hover:text-on-surface transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-primary-container text-on-primary-container rounded-xl font-label-caps text-sm hover:brightness-110 transition-all disabled:opacity-50 uppercase tracking-widest neon-glow"
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
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest">
              <div>
                <span className="bg-primary-container/10 text-primary-container px-3 py-1 rounded-full font-label-caps text-[10px] uppercase tracking-widest border border-primary-container/20 mb-2 inline-block">
                  {selectedGif.category}
                </span>
                <h3 className="font-display-xl text-2xl text-on-surface uppercase tracking-tight">{selectedGif.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedGif(null)}
                className="p-3 bg-surface-container rounded-2xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="aspect-video bg-black flex items-center justify-center relative group">
              {selectedGif.gif_url ? (
                <img src={selectedGif.gif_url} alt={selectedGif.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl">fitness_center</span>
                  <p className="font-label-caps text-[10px] uppercase tracking-widest">Sem demonstração visual</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            <div className="p-8 bg-surface-container/50 border-t border-outline-variant/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary-container">assignment</span>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Instruções de Execução</p>
                </div>
                <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30">
                  <p className="font-body-md text-sm text-on-surface leading-relaxed">
                    {selectedGif.description || 'Nenhuma instrução específica cadastrada para este exercício.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 bg-surface-container/50">
              <button 
                onClick={() => setSelectedGif(null)}
                className="w-full py-4 bg-primary-container text-on-primary-container font-label-caps rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(195,244,0,0.15)] uppercase text-xs tracking-widest neon-glow"
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

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <MasterShell activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'overview' && <MasterOverview onNavigate={setActiveTab} />}
        {activeTab === 'teachers' && <MasterTeachers showToast={showToast} />}
        {activeTab === 'billing' && <MasterBilling showToast={showToast} />}
        {activeTab === 'exercises' && <ExercisesManagement showToast={showToast} />}
        {activeTab === 'settings' && <MasterSettings showToast={showToast} />}
      </MasterShell>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold ${
            toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// Exercícios (migrado do código anterior)
// ============================================================
function ExercisesManagement({ showToast }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Peito', description: '', gif_url: '' })

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

  const filtered = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar exercício..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
        </div>
        <button onClick={() => { setEditingId(null); setNewExercise({ name: '', category: 'Peito', description: '', gif_url: '' }); setIsModalOpen(true) }}
          className="bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Exercício
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Exercício</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="4" className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></td></tr> :
                filtered.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                        {ex.gif_url ? <img src={ex.gif_url} className="w-full h-full object-cover" /> : <Dumbbell className="w-4 h-4 text-slate-300" />}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{ex.name}</span>
                    </td>
                    <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">{ex.category}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{ex.description}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditingId(ex.id); setNewExercise({ name: ex.name, category: ex.category, description: ex.description || '', gif_url: ex.gif_url || '' }); setIsModalOpen(true) }}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800">Editar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg border border-slate-200 shadow-lg">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingId ? 'Editar Exercício' : 'Novo Exercício'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <input required placeholder="Nome" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              <select value={newExercise.category} onChange={e => setNewExercise({...newExercise, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none">
                {['Peito','Costas','Pernas','Ombros','Bíceps','Tríceps','Abdômen'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="URL do GIF" value={newExercise.gif_url} onChange={e => setNewExercise({...newExercise, gif_url: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none" />
              <textarea placeholder="Descrição" value={newExercise.description} onChange={e => setNewExercise({...newExercise, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none h-24 resize-none" />
              <button type="submit" disabled={isSaving}
                className="w-full bg-[#0F172A] text-white py-3 rounded-lg font-semibold text-sm disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

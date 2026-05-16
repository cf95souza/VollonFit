import React, { useState, useEffect } from 'react'
import { Plus, Users, ChevronRight } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function StudentsTab({ onViewProfile, showToast, searchTerm, teacherInfo }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '' })
  const [isSaving, setIsSaving] = useState(false)

  const fetchStudents = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_students')
      .select('*')
      .eq('teacher_id', teacherInfo.id)
      .order('name')
    if (error) {
      console.error('Erro ao buscar alunos:', error)
    } else {
      setStudents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [teacherInfo?.id])

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    
    if (students.length >= teacherInfo.quota_limit) {
      showToast(`Limite de alunos atingido (${teacherInfo.quota_limit}). Entre em contato com o administrador.`, 'error')
      return
    }

    setIsSaving(true)
    
    const { data: existingStudent } = await supabase
      .from('gym_students')
      .select('id')
      .eq('username', newStudent.username.toLowerCase().trim())
      .maybeSingle()

    if (existingStudent) {
      showToast('Este nome de usuário já está sendo usado por outro aluno no sistema. Tente algo diferente (ex: nome.sobrenome).', 'error')
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('gym_students')
      .insert([{
        ...newStudent,
        teacher_id: teacherInfo.id,
        username: newStudent.username.toLowerCase().trim()
      }])
      .select()

    if (error) {
      showToast('Erro ao cadastrar aluno: ' + error.message, 'error')
    } else {
      showToast('Aluno cadastrado com sucesso!')
      setIsModalOpen(false)
      setNewStudent({ name: '', username: '', password: '' })
      fetchStudents()
    }
    setIsSaving(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Gestão de Alunos</h3>
          <p className="text-xs text-slate-500">Cadastre e gerencie o acesso de seus alunos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-black px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(223,255,94,0.2)]"
        >
          <Plus className="w-4 h-4" /> Novo Aluno
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-800 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudents.map(s => (
            <div key={s.id} className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-white/5">
                  {s.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{s.name}</h3>
                  <p className="text-sm text-slate-400">@{s.username}</p>
                </div>
              </div>
              <button 
                onClick={() => onViewProfile(s)}
                className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-primary hover:text-black transition-all group-hover:scale-110 flex items-center gap-2"
              >
                <span className="text-xs font-bold px-1">Ver Perfil</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full py-20 text-center bg-[#111111] rounded-3xl border-2 border-dashed border-white/5">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum aluno cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Cadastrar Novo Aluno
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-300 transition-colors">Fechar</button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-primary/50 transition-all outline-none"
                  placeholder="Ex: Caio França"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário (Username)</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.username}
                  onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-primary/50 transition-all outline-none"
                  placeholder="Ex: caio.franca"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                <input 
                  required
                  type="password" 
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm focus:border-primary/50 transition-all outline-none"
                  placeholder="Defina uma senha"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

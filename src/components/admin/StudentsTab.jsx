import React, { useState, useEffect } from 'react'
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
          <h3 className="font-headline-lg text-lg text-on-surface">Gestão de Alunos</h3>
          <p className="font-body-md text-xs text-on-surface-variant">Cadastre e gerencie o acesso de seus alunos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-container hover:brightness-110 text-on-primary-container px-4 py-2 rounded-xl text-xs font-label-caps uppercase tracking-wider transition-all flex items-center gap-2 neon-glow shadow-[0_0_15px_rgba(195,244,0,0.2)]"
        >
          <span className="material-symbols-outlined text-sm">add</span> Novo Aluno
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2].map(i => <div key={i} className="h-32 bg-surface-container-highest animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudents.map(s => (
            <div key={s.id} className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary-container/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-2xl font-headline-lg text-on-surface-variant group-hover:bg-primary-container/10 group-hover:text-primary-container transition-colors border border-outline-variant/30">
                  {s.name[0]}
                </div>
                <div>
                  <h3 className="font-headline-md text-lg text-on-surface">{s.name}</h3>
                  <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-1">@{s.username}</p>
                </div>
              </div>
              <button 
                onClick={() => onViewProfile(s)}
                className="p-3 bg-surface-container text-on-surface-variant rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-all group-hover:scale-110 flex items-center gap-2 border border-outline-variant/30 hover:border-primary-container"
              >
                <span className="text-[10px] font-label-caps px-1 uppercase tracking-wider">Ver Perfil</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-2 border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mx-auto mb-4 block">groups</span>
              <p className="text-on-surface-variant font-body-md">Nenhum aluno cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest rounded-t-3xl">
              <h3 className="font-headline-lg text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">add</span> Cadastrar Novo Aluno
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container transition-all outline-none"
                  placeholder="Ex: Caio França"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Usuário (Username)</label>
                <input 
                  required
                  type="text" 
                  value={newStudent.username}
                  onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container transition-all outline-none"
                  placeholder="Ex: caio.franca"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Senha de Acesso</label>
                <input 
                  required
                  type="password" 
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md focus:border-primary-container transition-all outline-none"
                  placeholder="Defina uma senha"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-surface-container text-on-surface-variant rounded-xl font-label-caps text-sm hover:bg-surface-container-high hover:text-on-surface transition-all border border-outline-variant/30 uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-4 py-3 bg-primary-container text-on-primary-container rounded-xl font-label-caps text-sm hover:brightness-110 transition-all disabled:opacity-50 uppercase tracking-widest neon-glow"
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

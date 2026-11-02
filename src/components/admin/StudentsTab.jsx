import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  User, 
  ChevronRight, 
  X, 
  Loader2, 
  CheckCircle2, 
  Lock,
  Mail
} from 'lucide-react'
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
      setStudents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [teacherInfo?.id])

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    
    if (students.length >= teacherInfo.quota_limit) {
      showToast(`Limite de alunos atingido (${teacherInfo.quota_limit}). Entre em contato com o suporte para aumentar sua cota.`, 'error')
      return
    }

    setIsSaving(true)
    
    const { data: existingStudent } = await supabase
      .from('gym_students')
      .select('id')
      .eq('username', newStudent.username.toLowerCase().trim())
      .maybeSingle()

    if (existingStudent) {
      showToast('Este nome de usuário já está sendo usado. Tente outro formato (ex: nome.sobrenome).', 'error')
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
      
      {/* Top Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Gestão de Alunos
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Cadastre novos alunos, visualize métricas de bioimpedância e acompanhe a evolução ({students.length}/{teacherInfo.quota_limit} vagas)
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="vollon-btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.3)] whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2].map(i => <div key={i} className="h-32 vollon-card animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredStudents.map(s => (
            <div 
              key={s.id} 
              className="vollon-card p-5 sm:p-6 rounded-3xl border border-[#2A2A2A] flex items-center justify-between group hover:border-[#E11D2E]/50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0 pr-2">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-white text-base shrink-0 group-hover:border-[#E11D2E]/60 transition-colors">
                  {s.name[0]}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{s.name}</h4>
                  <p className="text-xs text-[#A3A3A3] truncate mt-0.5">@{s.username}</p>
                </div>
              </div>
              <button 
                onClick={() => onViewProfile(s)}
                className="vollon-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Ver Perfil</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#FF3B4A]" />
              </button>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="col-span-full py-16 text-center vollon-card rounded-3xl">
              <Users className="w-12 h-12 text-[#A3A3A3] mx-auto mb-3 opacity-40" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
                Nenhum aluno encontrado com esse critério.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateStudent}
            className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Cadastrar Aluno
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Criar credencial de acesso ao app VollonFit
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Nome Completo *
                </label>
                <input 
                  required
                  type="text"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="Nome do atleta"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Nome de Usuário (Login) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A3A3A3]">@</span>
                  <input 
                    required
                    type="text"
                    value={newStudent.username}
                    onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl pl-8 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                    placeholder="ex: caio.franca"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Senha Inicial *
                </label>
                <input 
                  required
                  type="password"
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2A2A2A]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="vollon-btn-secondary flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="vollon-btn-primary flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

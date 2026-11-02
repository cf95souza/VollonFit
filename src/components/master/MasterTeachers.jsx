import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Crown, 
  Lock, 
  Unlock, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Loader2, 
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function MasterTeachers({ showToast }) {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStudentsModal, setIsStudentsModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedTeacherStudents, setSelectedTeacherStudents] = useState([])
  const [selectedTeacherName, setSelectedTeacherName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [pricePerStudent, setPricePerStudent] = useState(30)
  const [pricePremium, setPricePremium] = useState(45)

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    quota_limit: 10, contract_start_date: new Date().toISOString().split('T')[0],
    status: 'active', notes: '', plan_type: 'basic'
  })

  useEffect(() => { fetchTeachers(); fetchPrice() }, [])

  const fetchPrice = async () => {
    const { data: sData } = await supabase.from('gym_settings').select('value').eq('key', 'price_per_student').single()
    if (sData) setPricePerStudent(parseFloat(sData.value))

    const { data: pData } = await supabase.from('gym_settings').select('value').eq('key', 'price_premium').single()
    if (pData) setPricePremium(parseFloat(pData.value))
  }

  const fetchTeachers = async () => {
    setLoading(true)
    const { data } = await supabase.from('gym_teachers').select('*').order('created_at', { ascending: false })
    const withStats = await Promise.all((data || []).map(async t => {
      const { count } = await supabase.from('gym_students').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id)
      return { ...t, studentCount: count || 0 }
    }))
    setTeachers(withStats)
    setLoading(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ 
      name: '', email: '', password: '', phone: '', 
      quota_limit: 10, contract_start_date: new Date().toISOString().split('T')[0], 
      status: 'active', notes: '', plan_type: 'basic' 
    })
    setIsModalOpen(true)
  }

  const openEdit = (t) => {
    setEditingId(t.id)
    setForm({
      name: t.name, email: t.email, password: '', phone: t.phone || '',
      quota_limit: t.quota_limit, contract_start_date: t.contract_start_date || '',
      status: t.status || 'active', notes: t.notes || '', plan_type: t.plan_type || 'basic'
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        const updateData = { 
          name: form.name, 
          phone: form.phone, 
          quota_limit: parseInt(form.quota_limit), 
          contract_start_date: form.contract_start_date, 
          status: form.status, 
          notes: form.notes,
          plan_type: form.plan_type
        }
        if (form.password) updateData.password = form.password
        await supabase.from('gym_teachers').update(updateData).eq('id', editingId)
        showToast('Professor atualizado com sucesso!')
      } else {
        await supabase.from('gym_teachers').insert([{
          name: form.name, email: form.email, password: form.password, phone: form.phone,
          quota_limit: parseInt(form.quota_limit), contract_start_date: form.contract_start_date, 
          status: form.status, notes: form.notes, plan_type: form.plan_type
        }])
        showToast('Professor cadastrado com sucesso!')
      }
      setIsModalOpen(false)
      fetchTeachers()
    } catch (err) {
      showToast('Erro: ' + err.message, 'error')
    } finally { setIsSaving(false) }
  }

  const toggleBlock = async (t) => {
    const newStatus = t.status === 'blocked' ? 'active' : 'blocked'
    await supabase.from('gym_teachers').update({ status: newStatus }).eq('id', t.id)
    showToast(newStatus === 'blocked' ? 'Professor bloqueado' : 'Professor desbloqueado')
    fetchTeachers()
  }

  const togglePlan = async (t) => {
    const newPlan = t.plan_type === 'premium' ? 'basic' : 'premium'
    await supabase.from('gym_teachers').update({ plan_type: newPlan }).eq('id', t.id)
    showToast(`Plano alterado para ${newPlan === 'premium' ? 'Premium 🔥' : 'Basic'}`)
    fetchTeachers()
  }

  const viewStudents = async (t) => {
    setSelectedTeacherName(t.name)
    const { data } = await supabase.from('gym_students').select('*').eq('teacher_id', t.id).order('name')
    setSelectedTeacherStudents(data || [])
    setIsStudentsModal(true)
  }

  const deleteTeacher = async (id) => {
    await supabase.from('gym_teachers').delete().eq('id', id)
    showToast('Professor excluído')
    setConfirmDelete(null)
    fetchTeachers()
  }

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Professores Cadastrados
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Gestão de licenças, planos e cotas de alunos por personal trainer
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input 
              type="text" 
              placeholder="Buscar professor..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#E11D2E] transition-colors" 
            />
          </div>
          <button 
            onClick={openCreate}
            className="vollon-btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_6px_20px_rgba(255,59,74,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Professor</span>
          </button>
        </div>
      </div>

      {/* Grid de Professores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center vollon-card rounded-3xl">
            <Users className="w-12 h-12 text-[#A3A3A3] mx-auto mb-3 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
              Nenhum professor encontrado.
            </p>
          </div>
        ) : (
          filtered.map(t => {
            const quotaPct = t.quota_limit > 0 ? Math.min((t.studentCount / t.quota_limit) * 100, 100) : 0
            const isNearLimit = quotaPct >= 80

            return (
              <div 
                key={t.id}
                className="vollon-card p-6 rounded-3xl flex flex-col justify-between group hover:border-[#E11D2E]/60 transition-colors space-y-5"
              >
                <div>
                  
                  {/* Top Info */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-white text-base">
                        {t.name?.[0] || 'P'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate">{t.name}</h3>
                        <p className="text-xs text-[#A3A3A3] truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" /> {t.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePlan(t)}
                      title="Clique para alternar o plano"
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-colors shrink-0 ${
                        t.plan_type === 'premium'
                          ? 'bg-[#E11D2E]/15 border-[#E11D2E]/40 text-[#FF3B4A]'
                          : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A3A3A3] hover:text-white'
                      }`}
                    >
                      {t.plan_type === 'premium' ? '★ Premium' : 'Basic'}
                    </button>
                  </div>

                  {t.phone && (
                    <p className="text-xs text-[#A3A3A3] flex items-center gap-1.5 mb-3">
                      <Phone className="w-3 h-3 text-[#FF3B4A]" /> {t.phone}
                    </p>
                  )}

                  {/* Barra de Cotas de Alunos */}
                  <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-[#A3A3A3]">Alunos Ativos</span>
                      <span className={isNearLimit ? 'text-[#FF3B4A]' : 'text-white'}>
                        {t.studentCount} / {t.quota_limit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isNearLimit ? 'bg-[#FF3B4A]' : 'bg-[#E11D2E]'
                        }`}
                        style={{ width: `${quotaPct}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Ações Rápidas no Rodapé do Card */}
                <div className="pt-2 border-t border-[#2A2A2A] grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => openEdit(t)}
                    title="Editar Informações"
                    className="p-2.5 bg-[#1A1A1A] hover:border-[#E11D2E] text-white border border-[#2A2A2A] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  </button>

                  <button 
                    onClick={() => viewStudents(t)}
                    title="Ver Alunos Vinculados"
                    className="p-2.5 bg-[#1A1A1A] hover:border-[#E11D2E] text-white border border-[#2A2A2A] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FF3B4A]" />
                  </button>

                  <button 
                    onClick={() => toggleBlock(t)}
                    title={t.status === 'blocked' ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                    className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                      t.status === 'blocked'
                        ? 'bg-[#E11D2E]/20 text-[#FF3B4A] border-[#E11D2E]/40'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    {t.status === 'blocked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </button>

                  <button 
                    onClick={() => setConfirmDelete(t.id)}
                    title="Excluir Professor"
                    className="p-2.5 bg-[#1A1A1A] hover:bg-[#E11D2E]/20 text-[#A3A3A3] hover:text-[#FF3B4A] border border-[#2A2A2A] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )
          })
        )}
      </div>

      {/* Modal Criar / Editar Professor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSave}
            className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  {editingId ? 'Editar Professor' : 'Novo Professor'}
                </h2>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Credenciamento de Personal Trainer
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
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="Nome do treinador"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  E-mail de Acesso *
                </label>
                <input 
                  required
                  disabled={!!editingId}
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white disabled:opacity-50 focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="treinador@email.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    {editingId ? 'Nova Senha (Opcional)' : 'Senha Inicial *'}
                  </label>
                  <input 
                    required={!editingId}
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Telefone WhatsApp
                  </label>
                  <input 
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Cota Limite de Alunos
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={form.quota_limit}
                    onChange={e => setForm({...form, quota_limit: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Plano de Acesso
                  </label>
                  <select
                    value={form.plan_type}
                    onChange={e => setForm({...form, plan_type: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer"
                  >
                    <option value="basic" className="bg-[#141414]">Basic (R$ {pricePerStudent}/aluno)</option>
                    <option value="premium" className="bg-[#141414]">Premium White Label (R$ {pricePremium}/aluno)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Anotações Internas
                </label>
                <textarea 
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors h-20 resize-none"
                  placeholder="Informações contratuais ou observações..."
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
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Lista de Alunos do Professor */}
      {isStudentsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[80vh] flex flex-col border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-[#2A2A2A] pb-3">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Alunos Vinculados
                </h3>
                <p className="text-xs text-[#FF3B4A] font-bold">
                  Treinador: {selectedTeacherName}
                </p>
              </div>
              <button 
                onClick={() => setIsStudentsModal(false)}
                className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedTeacherStudents.length === 0 ? (
                <p className="text-center py-10 text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
                  Nenhum aluno cadastrado por este treinador.
                </p>
              ) : (
                selectedTeacherStudents.map(st => (
                  <div key={st.id} className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-white">{st.name}</p>
                      <p className="text-[10px] text-[#A3A3A3]">@{st.username}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E11D2E]/15 text-[#FF3B4A]">
                      Ativo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-sm rounded-3xl p-6 text-center border border-[#2A2A2A] space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-white">Excluir Treinador?</h3>
              <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">
                Esta ação remove o professor e desvincula os alunos associados. Deseja continuar?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="vollon-btn-secondary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={() => deleteTeacher(confirmDelete)}
                className="vollon-btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

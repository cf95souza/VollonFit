import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
  Plus, Search, X, Users2, ShieldCheck, Mail, Phone,
  Edit3, Lock, Unlock, Trash2, Eye, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'

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
    setForm({ name: '', email: '', password: '', phone: '', quota_limit: 10, contract_start_date: new Date().toISOString().split('T')[0], status: 'active', notes: '', plan_type: 'basic' })
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
        showToast('Professor atualizado!')
      } else {
        await supabase.from('gym_teachers').insert([{
          name: form.name, email: form.email, password: form.password, phone: form.phone,
          quota_limit: parseInt(form.quota_limit), contract_start_date: form.contract_start_date, 
          status: form.status, notes: form.notes, plan_type: form.plan_type
        }])
        showToast('Professor cadastrado!')
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

  const handleDelete = async (id) => {
    await supabase.from('gym_teachers').delete().eq('id', id)
    showToast('Professor excluído')
    setConfirmDelete(null)
    fetchTeachers()
  }

  const viewStudents = async (t) => {
    setSelectedTeacherName(t.name)
    const { data } = await supabase.from('gym_students').select('id, name, username').eq('teacher_id', t.id).order('name')
    setSelectedTeacherStudents(data || [])
    setIsStudentsModal(true)
  }

  const getNextDue = (t) => {
    if (!t.contract_start_date) return null
    const cd = new Date(t.contract_start_date + 'T00:00:00')
    const today = new Date()
    const days = Math.floor((today - cd) / (1000*60*60*24))
    const cycle = Math.floor(days / 30)
    const next = new Date(cd)
    next.setDate(next.getDate() + ((cycle + 1) * 30))
    return next
  }

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Buscar professor..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
          />
        </div>
        <button onClick={openCreate} className="bg-primary hover:bg-primary-dark text-black px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Novo Professor
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? [1,2,3].map(i => <div key={i} className="h-52 bg-[#111111] rounded-lg animate-pulse border border-white/5" />) :
          filtered.map(t => {
            const nextDue = getNextDue(t)
            const quotaPct = Math.min((t.studentCount / (t.quota_limit || 1)) * 100, 100)
            return (
              <div key={t.id} className="bg-[#111111] rounded-lg border border-white/5 p-5 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                      {t.name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      t.status === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {t.status === 'active' ? 'Ativo' : t.status === 'blocked' ? 'Bloqueado' : 'Trial'}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      t.plan_type === 'premium' ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(223,255,94,0.1)]' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {t.plan_type === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                  </div>
                </div>

                {t.phone && <p className="text-xs text-slate-400 flex items-center gap-1 mb-3"><Phone className="w-3 h-3" />{t.phone}</p>}

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Alunos</p>
                    <p className="text-sm font-bold text-white">{t.studentCount} <span className="text-slate-500 font-normal">/ {t.quota_limit}</span></p>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1">
                      <div className={`h-full rounded-full transition-all ${quotaPct >= 90 ? 'bg-rose-500' : quotaPct >= 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${quotaPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Mensalidade</p>
                    <p className="text-sm font-bold text-primary">R$ {(t.studentCount * (t.plan_type === 'premium' ? pricePremium : pricePerStudent)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {nextDue && (
                  <p className="text-[10px] text-slate-400 mb-3">
                    Próx. vencimento: <span className="font-semibold text-slate-300">{nextDue.toLocaleDateString('pt-BR')}</span>
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button onClick={() => openEdit(t)} title="Editar" className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => viewStudents(t)} title="Ver Alunos" className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-[#C6C4FF] bg-[#C6C4FF]/10 hover:bg-[#C6C4FF]/20 rounded-md transition-colors">
                    <Eye className="w-3 h-3" /> Alunos
                  </button>
                  <button onClick={() => toggleBlock(t)} title={t.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} className={`py-2 px-3 rounded-md transition-colors ${t.status === 'blocked' ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'}`}>
                    {t.status === 'blocked' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </button>
                  <button onClick={() => setConfirmDelete(t.id)} title="Excluir" className="py-2 px-3 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">Nenhum professor encontrado.</div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] w-full max-w-md rounded-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0F172A] rounded-t-lg z-10">
              <h3 className="font-bold text-white">{editingId ? 'Editar Professor' : 'Novo Professor'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <Field label="Nome Completo" required>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="Nome do Professor" />
              </Field>
              {!editingId && (
                <Field label="Email de Acesso" required>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder="email@professor.com" />
                </Field>
              )}
              <Field label={editingId ? "Nova Senha (deixe vazio para manter)" : "Senha de Acesso"} required={!editingId}>
                <input type="text" required={!editingId} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" placeholder="••••••••" />
              </Field>
              <Field label="Telefone">
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" placeholder="(11) 99999-9999" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Limite de Alunos">
                  <input type="number" value={form.quota_limit} onChange={e => setForm({...form, quota_limit: e.target.value})} className="input-field" />
                </Field>
                <Field label="Início Contrato">
                  <input type="date" value={form.contract_start_date} onChange={e => setForm({...form, contract_start_date: e.target.value})} className="input-field" />
                </Field>
              </div>
              <Field label="Plano do Professor">
                <select value={form.plan_type} onChange={e => setForm({...form, plan_type: e.target.value})} className="input-field">
                  <option value="basic">Professor Basic (R$ {pricePerStudent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/aluno)</option>
                  <option value="premium">Professor Premium (R$ {pricePremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/aluno)</option>
                </select>
              </Field>
              {editingId && (
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field">
                    <option value="active">Ativo</option>
                    <option value="trial">Trial</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </Field>
              )}
              <Field label="Observações">
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field h-20 resize-none" placeholder="Anotações internas..." />
              </Field>
              <button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-primary-dark text-black py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Professor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Alunos */}
      {isStudentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] w-full max-w-sm rounded-lg border border-white/10 shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Alunos de {selectedTeacherName}</h3>
              <button onClick={() => setIsStudentsModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-5 divide-y divide-white/5 max-h-80 overflow-y-auto">
              {selectedTeacherStudents.map(s => (
                <div key={s.id} className="py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">{s.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">@{s.username}</p>
                  </div>
                </div>
              ))}
              {selectedTeacherStudents.length === 0 && <p className="text-center py-8 text-slate-500 text-sm">Nenhum aluno.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] w-full max-w-xs rounded-lg border border-white/10 shadow-2xl p-6 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">Excluir Professor?</h3>
            <p className="text-xs text-slate-400 mb-4">Todos os alunos e treinos serão removidos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-semibold text-sm transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg font-semibold text-sm transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.input-field { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.15s; color: white; } .input-field:focus { border-color: rgba(223,255,94,0.5); box-shadow: 0 0 0 3px rgba(223,255,94,0.1); } .input-field::placeholder { color: #64748b; }` }} />
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  )
}

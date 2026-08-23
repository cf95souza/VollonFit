import { useState, useEffect } from 'react'
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

  const togglePlan = async (t) => {
    const newPlan = t.plan_type === 'premium' ? 'basic' : 'premium'
    try {
      const { error } = await supabase.from('gym_teachers').update({ plan_type: newPlan }).eq('id', t.id)
      if (error) throw error
      showToast(`Plano de ${t.name} alterado para ${newPlan === 'premium' ? 'Premium' : 'Basic'}!`)
      fetchTeachers()
    } catch (err) {
      showToast('Erro ao alterar plano: ' + err.message, 'error')
    }
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-panel p-6 rounded-[32px] border border-outline-variant/30">
        <div className="relative flex-1 w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text" placeholder="Buscar professor..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
          />
        </div>
        <button onClick={openCreate} className="w-full sm:w-auto bg-primary-container hover:brightness-110 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95 neon-glow">
          <span className="material-symbols-outlined text-sm">add</span> Novo Professor
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? [1,2,3].map(i => <div key={i} className="h-52 glass-panel rounded-3xl border border-outline-variant/30 animate-pulse" />) :
          filtered.map(t => {
            const nextDue = getNextDue(t)
            const quotaPct = Math.min((t.studentCount / (t.quota_limit || 1)) * 100, 100)
            return (
              <div key={t.id} className="glass-panel rounded-3xl border border-outline-variant/30 p-6 hover:border-primary-container/30 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center font-headline-sm text-on-surface-variant text-sm">
                      {t.name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-on-surface text-sm mb-0.5">{t.name}</h4>
                      <p className="font-body-md text-[10px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">mail</span> {t.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`font-label-caps text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border ${
                      t.status === 'active' ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' :
                      t.status === 'blocked' ? 'bg-error/10 text-error border-error/20' : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {t.status === 'active' ? 'Ativo' : t.status === 'blocked' ? 'Bloqueado' : 'Trial'}
                    </span>
                    <span 
                      onClick={() => togglePlan(t)}
                      title="Clique para alternar o plano do professor rapidamente"
                      className={`font-label-caps text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 ${
                        t.plan_type === 'premium' ? 'bg-primary-container/10 border-primary-container/40 text-primary-container shadow-[0_0_10px_rgba(195,244,0,0.15)] hover:bg-primary-container/20' : 'bg-surface-container-highest border-outline-variant/30 text-on-surface-variant hover:bg-surface hover:text-on-surface'
                      }`}
                    >
                      {t.plan_type === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                  </div>
                </div>

                {t.phone && <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1 mb-4"><span className="material-symbols-outlined text-[14px]">phone</span> {t.phone}</p>}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Alunos</p>
                    <p className="font-headline-sm text-sm text-on-surface">{t.studentCount} <span className="text-on-surface-variant font-body-md text-xs">/ {t.quota_limit}</span></p>
                    <div className="w-full h-1.5 bg-surface-container rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${quotaPct >= 90 ? 'bg-error' : quotaPct >= 70 ? 'bg-warning' : 'bg-primary-container neon-glow'}`} style={{ width: `${quotaPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Mensalidade</p>
                    <p className="font-display-sm text-sm text-on-surface">R$ {(t.studentCount * (t.plan_type === 'premium' ? pricePremium : pricePerStudent)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {nextDue && (
                  <p className="font-body-md text-[10px] text-on-surface-variant mb-4">
                    Próx. vencimento: <span className="font-headline-sm text-on-surface">{nextDue.toLocaleDateString('pt-BR')}</span>
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t border-outline-variant/30">
                  <button onClick={() => openEdit(t)} title="Editar" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-label-caps text-[10px] tracking-widest text-on-surface-variant bg-surface-container hover:bg-surface-container-highest rounded-xl transition-colors uppercase border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Editar
                  </button>
                  <button onClick={() => viewStudents(t)} title="Ver Alunos" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-label-caps text-[10px] tracking-widest text-secondary-container bg-secondary-container/10 hover:bg-secondary-container/20 rounded-xl transition-colors uppercase border border-secondary-container/20">
                    <span className="material-symbols-outlined text-[14px]">visibility</span> Alunos
                  </button>
                  <button onClick={() => toggleBlock(t)} title={t.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} className={`py-2.5 px-3.5 rounded-xl transition-colors border ${t.status === 'blocked' ? 'text-[#4ade80] bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border-[#4ade80]/20' : 'text-warning bg-warning/10 hover:bg-warning/20 border-warning/20'}`}>
                    <span className="material-symbols-outlined text-[14px]">{t.status === 'blocked' ? 'lock_open' : 'lock'}</span>
                  </button>
                  <button onClick={() => setConfirmDelete(t.id)} title="Excluir" className="py-2.5 px-3.5 text-error bg-error/10 hover:bg-error/20 rounded-xl transition-colors border border-error/20">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            )
          })
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 font-body-md text-on-surface-variant text-sm">Nenhum professor encontrado.</div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-[40px] border border-outline-variant/30 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center sticky top-0 bg-surface-container-highest rounded-t-[40px] z-10">
              <h3 className="font-display-md text-xl text-on-surface uppercase tracking-tight">{editingId ? 'Editar Professor' : 'Novo Professor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
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
                <select value={form.plan_type} onChange={e => setForm({...form, plan_type: e.target.value})} className="input-field appearance-none">
                  <option value="basic" className="bg-surface">Professor Basic (R$ {pricePerStudent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/aluno)</option>
                  <option value="premium" className="bg-surface">Professor Premium (R$ {pricePremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/aluno)</option>
                </select>
              </Field>
              {editingId && (
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field appearance-none">
                    <option value="active" className="bg-surface">Ativo</option>
                    <option value="trial" className="bg-surface">Trial</option>
                    <option value="blocked" className="bg-surface">Bloqueado</option>
                  </select>
                </Field>
              )}
              <Field label="Observações">
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field h-24 resize-none" placeholder="Anotações internas..." />
              </Field>
              <div className="pt-2">
                <button type="submit" disabled={isSaving} className="w-full bg-primary-container hover:brightness-110 text-on-primary-container py-4 rounded-2xl font-label-caps text-sm uppercase tracking-widest transition-all disabled:opacity-50 neon-glow shadow-lg shadow-primary-container/10 active:scale-[0.98]">
                  {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Alunos */}
      {isStudentsModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-[40px] border border-outline-variant/30 shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest rounded-t-[40px]">
              <h3 className="font-display-sm text-lg text-on-surface uppercase tracking-tight">Alunos de {selectedTeacherName}</h3>
              <button onClick={() => setIsStudentsModal(false)} className="p-2 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 divide-y divide-outline-variant/10 max-h-80 overflow-y-auto custom-scrollbar">
              {selectedTeacherStudents.map(s => (
                <div key={s.id} className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center font-headline-sm text-on-surface-variant text-sm">{s.name[0]}</div>
                  <div>
                    <p className="font-headline-sm text-on-surface text-sm">{s.name}</p>
                    <p className="font-body-md text-xs text-on-surface-variant">@{s.username}</p>
                  </div>
                </div>
              ))}
              {selectedTeacherStudents.length === 0 && <p className="text-center py-8 font-body-md text-on-surface-variant text-sm">Nenhum aluno.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xs rounded-3xl border border-outline-variant/30 shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <span className="material-symbols-outlined text-5xl text-error mx-auto mb-4 block">delete</span>
            <h3 className="font-headline-md text-on-surface mb-2">Excluir Professor?</h3>
            <p className="font-body-md text-xs text-on-surface-variant mb-6">Todos os alunos e treinos serão removidos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-xl font-label-caps text-[10px] uppercase tracking-widest border border-outline-variant/30 transition-all">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-error hover:brightness-110 text-on-error rounded-xl font-label-caps text-[10px] uppercase tracking-widest shadow-lg shadow-error/20 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.input-field { width: 100%; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1rem 1.25rem; font-size: 0.875rem; outline: none; transition: all 0.15s; color: white; } .input-field:focus { border-color: var(--primary-container); } .input-field::placeholder { color: #64748b; }` }} />
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div className="space-y-2">
      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block ml-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  )
}

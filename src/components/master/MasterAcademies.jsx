import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  X, 
  Loader2, 
  Mail, 
  Lock, 
  CheckCircle2, 
  Key,
  Shield
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function MasterAcademies({ showToast }) {
  const [academies, setAcademies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    academyName: '',
    academyCnpj: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  })

  const fetchAcademies = async () => {
    setLoading(true)
    const { data } = await supabase.from('gym_academies').select(`
      *,
      admins:gym_academy_admins(*)
    `).order('name')
    if (data) setAcademies(data)
    setLoading(false)
  }

  useEffect(() => { fetchAcademies() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.academyName || !formData.adminEmail || !formData.adminPassword) {
      showToast('Preencha os campos obrigatórios', 'error')
      return
    }

    setIsSaving(true)
    try {
      // 1. Criar Academia
      const { data: newAcademy, error: accErr } = await supabase
        .from('gym_academies')
        .insert([{ name: formData.academyName, cnpj: formData.academyCnpj }])
        .select()
        .single()
      
      if (accErr) throw accErr

      // 2. Criar Gestor
      const { error: adminErr } = await supabase
        .from('gym_academy_admins')
        .insert([{
          academy_id: newAcademy.id,
          name: formData.adminName || 'Gestor Principal',
          email: formData.adminEmail,
          password: formData.adminPassword
        }])

      if (adminErr) throw adminErr

      showToast('Academia e Gestor criados com sucesso!')
      setIsModalOpen(false)
      setFormData({ academyName: '', academyCnpj: '', adminName: '', adminEmail: '', adminPassword: '' })
      fetchAcademies()
    } catch (err) {
      showToast('Erro ao criar academia: ' + err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#FF3B4A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Academias (B2B)
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Gestão de redes e clientes corporativos no plano Enterprise
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="vollon-btn-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.3)]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Academia</span>
        </button>
      </div>

      {/* Grid de Academias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academies.length === 0 ? (
          <div className="col-span-full text-center py-16 vollon-card rounded-3xl">
            <Building2 className="w-12 h-12 text-[#A3A3A3] mx-auto mb-3 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
              Nenhuma academia cadastrada.
            </p>
          </div>
        ) : (
          academies.map(acc => (
            <div 
              key={acc.id} 
              className="vollon-card p-6 rounded-3xl flex flex-col justify-between group hover:border-[#E11D2E]/60 transition-colors space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight truncate">
                      {acc.name}
                    </h3>
                    <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-0.5">
                      CNPJ: {acc.cnpj || 'Não informado'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 text-[9px] font-bold text-[#FF3B4A] uppercase shrink-0">
                    B2B
                  </span>
                </div>
                
                {/* Gestor Info */}
                <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] mt-4 space-y-1.5">
                  <p className="text-[9px] font-bold text-[#FF3B4A] uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3 h-3" /> Acesso do Gestor
                  </p>
                  <p className="font-bold text-xs text-white truncate">
                    {acc.admins?.[0]?.email || 'Sem gestor vinculado'}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] font-mono">
                    Senha: {acc.admins?.[0]?.password || '••••••'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Academia */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSave} 
            className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Cadastrar Academia
                </h2>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Credenciamento B2B Enterprise
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
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-[#FF3B4A] uppercase tracking-wider mb-3">
                  1. Dados da Unidade
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                      Nome da Academia *
                    </label>
                    <input 
                      required
                      type="text"
                      value={formData.academyName}
                      onChange={e => setFormData(p => ({...p, academyName: e.target.value}))}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                      placeholder="Ex: Box Centro Performance"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                      CNPJ (Opcional)
                    </label>
                    <input 
                      type="text"
                      value={formData.academyCnpj}
                      onChange={e => setFormData(p => ({...p, academyCnpj: e.target.value}))}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-[#FF3B4A] uppercase tracking-wider mb-3">
                  2. Acesso do Gestor
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                      Nome do Gestor
                    </label>
                    <input 
                      type="text"
                      value={formData.adminName}
                      onChange={e => setFormData(p => ({...p, adminName: e.target.value}))}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                      placeholder="Ex: Carlos Eduardo"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                        E-mail de Login *
                      </label>
                      <input 
                        required
                        type="email"
                        value={formData.adminEmail}
                        onChange={e => setFormData(p => ({...p, adminEmail: e.target.value}))}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                        placeholder="gestor@academia.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                        Senha Provisória *
                      </label>
                      <input 
                        required
                        type="text"
                        value={formData.adminPassword}
                        onChange={e => setFormData(p => ({...p, adminPassword: e.target.value}))}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-[#2A2A2A]">
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
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Academia'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Heart, 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  ClipboardList 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function ProfileTab({ student, onOpenConfig, onOpenGoals, showToast, onLogout }) {
  const [allStudents, setAllStudents] = useState([])
  const [isLinking, setIsLinking] = useState(false)
  const [search, setSearch] = useState('')
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!student?.id) return
      try {
        const { data } = await supabase.from('gym_students').select('id, name, username').neq('id', student.id)
        if (data) setAllStudents(data)
      } catch (e) {
        console.warn("Erro ao buscar alunos:", e)
      }
    }
    fetchStudents()
  }, [student?.id])

  const handleLink = async (partnerId) => {
    if (isLinking) return
    setIsLinking(true)
    try {
      const { error } = await supabase
        .from('gym_students')
        .update({ partner_id: partnerId })
        .eq('id', student.id)
      
      if (error) throw error

      // Vínculo recíproco
      const { error: error2 } = await supabase.from('gym_students').update({ partner_id: student.id }).eq('id', partnerId)
      if (error2) throw error2

      showToast('Parceiro(a) vinculado com sucesso!', 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      console.error('Erro ao vincular:', err)
      showToast('Erro ao vincular. Verifique se as tabelas foram atualizadas.', 'error')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    if (isLinking) return
    setIsLinking(true)
    try {
      const partnerId = student.partner_id
      
      const { error } = await supabase
        .from('gym_students')
        .update({ partner_id: null })
        .eq('id', student.id)
      
      if (error) throw error

      if (partnerId) {
        const { error: error2 } = await supabase
          .from('gym_students')
          .update({ partner_id: null })
          .eq('id', partnerId)
        if (error2) console.warn('Erro ao desvincular parceiro (pode ser RLS):', error2)
      }

      showToast('Vínculo desfeito com sucesso.', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      console.error('Erro fatal no desvínculo:', err)
      showToast('Erro ao desvincular: ' + (err.message || 'Erro de permissão'), 'error')
    } finally {
      setIsLinking(false)
    }
  }

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in fade-in duration-500 text-center py-10 space-y-12">
      <div>
        <div className="w-32 h-32 fitness-gradient rounded-[40px] flex items-center justify-center mx-auto mb-6 border-4 border-[#1A1A1A] shadow-2xl text-black text-5xl font-black font-display neon-shadow">
          {student?.name?.[0]}
        </div>
        <h2 className="text-3xl font-black text-white font-display">{student?.name}</h2>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs mt-2">@{student?.username}</p>
      </div>
      
      {/* Sistema de Parceria */}
      {!student?.partner_id ? (
        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
          <div className="text-left">
            <h3 className="font-black text-white font-display text-lg tracking-tight">Vincular Parceiro(a)</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Treinem juntos e motivem-se!</p>
          </div>
          <input 
            type="text"
            placeholder="Buscar por nome ou @username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-slate-700"
          />
          {search && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleLink(s.id)}
                  className="w-full p-4 bg-black hover:bg-primary/5 border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">@{s.username}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-600 group-hover:text-primary transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl space-y-4">
          <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center font-black shadow-lg shadow-primary/20">
                <Heart className="w-6 h-6 fill-black" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Seu Parceiro</p>
                <p className="text-lg font-black text-white font-display tracking-tight leading-none">Vínculo Ativo</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUnlinkConfirm(true)}
              className="p-3 bg-black text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500/10 transition-all shadow-sm active:scale-90"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {showUnlinkConfirm && (
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-rose-500 mb-3">Confirmar desvínculo?</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleUnlink}
                  disabled={isLinking}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                >
                  {isLinking ? '...' : 'Sim, Desvincular'}
                </button>
                <button 
                  onClick={() => setShowUnlinkConfirm(false)}
                  className="flex-1 bg-black text-slate-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={onOpenConfig}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Configurações da Conta</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        <button 
          onClick={onOpenGoals}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Metas e Objetivos</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={onLogout}
          className="w-full mt-4 p-6 text-center bg-rose-500/10 rounded-[32px] border border-rose-500/20 flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all text-rose-500 active:scale-95 shadow-xl shadow-rose-500/5"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest font-display text-sm">Sair da Conta</span>
        </button>
      </div>
    </div>
  )
}

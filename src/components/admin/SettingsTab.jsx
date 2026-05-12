import React, { useState, useEffect } from 'react'
import { User, TrendingUp } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function SettingsTab({ teacherInfo, setTeacherInfo, showToast }) {
  const [loading, setLoading] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [formData, setFormData] = useState({
    name: teacherInfo?.name || '',
    password: teacherInfo?.password || '',
    confirmPassword: teacherInfo?.password || ''
  })

  useEffect(() => {
    if (teacherInfo) {
      setFormData({
        name: teacherInfo.name,
        password: teacherInfo.password,
        confirmPassword: teacherInfo.password
      })
    }
  }, [teacherInfo])

  useEffect(() => {
    const fetchUsage = async () => {
      if (!teacherInfo?.id) return
      const { count } = await supabase
        .from('gym_students')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherInfo.id)
      
      setStudentCount(count || 0)
    }
    fetchUsage()
  }, [teacherInfo?.id])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      showToast('As senhas não coincidem', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('gym_teachers')
      .update({
        name: formData.name,
        password: formData.password
      })
      .eq('id', teacherInfo.id)

    if (error) {
      showToast('Erro ao atualizar perfil', 'error')
      setLoading(false)
    } else {
      const updatedTeacher = { ...teacherInfo, name: formData.name, password: formData.password }
      localStorage.setItem('vollonfit_teacher', JSON.stringify(updatedTeacher))
      setTeacherInfo(updatedTeacher)
      showToast('Perfil atualizado com sucesso!')
      setLoading(false)
    }
  }

  const usagePercent = Math.min((studentCount / (teacherInfo?.quota_limit || 1)) * 100, 100)

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#DFFF5E]/10 rounded-2xl flex items-center justify-center text-[#DFFF5E]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Dados do Perfil</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atualize suas informações de acesso</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2 opacity-50 cursor-not-allowed">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail (Não editável)</label>
              <input 
                type="email" 
                disabled
                value={teacherInfo?.email}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-slate-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#DFFF5E]/50 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#DFFF5E] text-black font-black rounded-2xl hover:bg-[#B8E600] transition-all shadow-[0_0_20px_rgba(223,255,94,0.2)] disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 bg-[#C6C4FF]/10 rounded-2xl flex items-center justify-center text-[#C6C4FF]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Plano & Limites</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gerencie seu crescimento na plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Uso</p>
                <p className="text-3xl font-black text-white font-display">
                  {studentCount} <span className="text-slate-500 text-lg font-bold">/ {teacherInfo?.quota_limit} alunos</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#DFFF5E] uppercase tracking-widest mb-1">Ocupação</p>
                <p className="text-lg font-black text-[#DFFF5E] font-display">{usagePercent.toFixed(0)}%</p>
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-[#DFFF5E]'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Seu plano atual permite cadastrar até <b>{teacherInfo?.quota_limit} alunos</b>. 
              {usagePercent > 80 && " Você está próximo do limite! Considere fazer um upgrade para continuar crescendo."}
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <p className="text-xs font-bold text-[#C6C4FF] uppercase tracking-widest mb-4">Precisa de mais espaço?</p>
            <p className="text-sm text-slate-300 mb-6">Entre em contato com o administrador para expandir seu limite de alunos ou mudar de plano.</p>
            <a 
              href="mailto:cf95.souza@gmail.com" 
              className="w-full py-3 bg-[#C6C4FF] text-slate-900 font-black rounded-xl hover:bg-[#B1AFFF] transition-all text-center text-xs uppercase tracking-widest"
            >
              Falar com Suporte
            </a>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C6C4FF]/5 rounded-full blur-3xl pointer-events-none" />
      </section>
    </div>
  )
}

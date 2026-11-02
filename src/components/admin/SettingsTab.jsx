import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Lock, 
  Palette, 
  Image, 
  Crown, 
  Save, 
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { hexToRgbString } from '../../utils/colorUtils'

export default function SettingsTab({ teacherInfo, setTeacherInfo, showToast }) {
  const [loading, setLoading] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [formData, setFormData] = useState({
    name: teacherInfo?.name || '',
    password: teacherInfo?.password || '',
    confirmPassword: teacherInfo?.password || '',
    themeColor: '#E11D2E',
    logoUrl: ''
  })

  useEffect(() => {
    const fetchBrandSettings = async () => {
      if (!teacherInfo?.id) return
      
      const { data: themeData } = await supabase
        .from('gym_settings')
        .select('value')
        .eq('key', `theme_${teacherInfo.id}`)
        .maybeSingle()
        
      if (themeData) {
        setFormData(prev => ({ ...prev, themeColor: themeData.value }))
        document.documentElement.style.setProperty('--color-primary', hexToRgbString(themeData.value))
      }

      const { data: logoData } = await supabase
        .from('gym_settings')
        .select('value')
        .eq('key', `logo_${teacherInfo.id}`)
        .maybeSingle()
        
      if (logoData) {
        setFormData(prev => ({ ...prev, logoUrl: logoData.value }))
      }
    }
    fetchBrandSettings()
  }, [teacherInfo?.id])

  useEffect(() => {
    if (teacherInfo) {
      setFormData(prev => ({
        ...prev,
        name: teacherInfo.name,
        password: teacherInfo.password,
        confirmPassword: teacherInfo.password
      }))
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
      return
    }

    // Salvar cor e logo no gym_settings
    await supabase.from('gym_settings').upsert({ 
      key: `theme_${teacherInfo.id}`, 
      value: formData.themeColor 
    }, { onConflict: 'key' })

    await supabase.from('gym_settings').upsert({ 
      key: `logo_${teacherInfo.id}`, 
      value: formData.logoUrl 
    }, { onConflict: 'key' })

    document.documentElement.style.setProperty('--color-primary', hexToRgbString(formData.themeColor))
    localStorage.setItem('vollonfit_theme_color', formData.themeColor)

    const updated = { ...teacherInfo, name: formData.name, password: formData.password }
    setTeacherInfo(updated)
    localStorage.setItem('vollonfit_teacher', JSON.stringify(updated))

    showToast('Configurações salvas com sucesso! 🔥')
    setLoading(false)
  }

  const isPremium = teacherInfo?.plan_type === 'premium'

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500 pb-20">
      
      {/* Container de Perfil */}
      <div className="vollon-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#2A2A2A]">
          <div className="w-11 h-11 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
              Dados do Treinador
            </h3>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
              Suas credenciais e informações de identificação
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
              Nome de Exibição
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                Nova Senha
              </label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                Confirmar Senha
              </label>
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* White Label Customization */}
          <div className="pt-4 border-t border-[#2A2A2A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className={`w-4 h-4 ${isPremium ? 'text-[#FF3B4A]' : 'text-[#A3A3A3]'}`} />
                <h4 className="font-display text-lg font-black uppercase text-white">
                  White Label (Personalização da Sua Marca)
                </h4>
              </div>
              {!isPremium && (
                <span className="text-[9px] bg-[#2A2A2A] text-[#A3A3A3] px-2.5 py-0.5 rounded-full uppercase font-bold">
                  Exclusivo Premium
                </span>
              )}
            </div>

            <div className={`space-y-4 ${!isPremium ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Cor Primária de Destaque
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.themeColor}
                    onChange={e => setFormData({...formData, themeColor: e.target.value})}
                    className="w-10 h-10 rounded-xl bg-transparent border border-[#2A2A2A] cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white uppercase font-bold">
                    {formData.themeColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  URL do seu Logotipo (PNG Transparente)
                </label>
                <input 
                  type="url" 
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  placeholder="https://suamarca.com/logo.png"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="vollon-btn-primary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Configurações</span>
          </button>
        </form>
      </div>

      {/* Cota de Alunos */}
      <div className="vollon-card p-6 rounded-3xl space-y-2">
        <h4 className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">
          Capacidade da sua Carteira
        </h4>
        <div className="flex justify-between items-baseline">
          <span className="font-display text-2xl font-black text-white">
            {studentCount} <span className="text-xs text-[#A3A3A3]">/ {teacherInfo?.quota_limit} alunos ativos</span>
          </span>
          <span className="text-[10px] text-[#FF3B4A] font-bold uppercase">
            {((studentCount / (teacherInfo?.quota_limit || 1)) * 100).toFixed(0)}% Utilizado
          </span>
        </div>
      </div>

    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { hexToRgbString } from '../../utils/colorUtils'

export default function SettingsTab({ teacherInfo, setTeacherInfo, showToast }) {
  const [loading, setLoading] = useState(false)
  const [studentCount, setStudentCount] = useState(0)
  const [formData, setFormData] = useState({
    name: teacherInfo?.name || '',
    password: teacherInfo?.password || '',
    confirmPassword: teacherInfo?.password || '',
    themeColor: '#DFFF5E',
    logoUrl: ''
  })

  // Carregar cor e logo reais
  useEffect(() => {
    const fetchBrandSettings = async () => {
      if (!teacherInfo?.id) return
      
      // Carregar cor do tema
      const { data: themeData } = await supabase
        .from('gym_settings')
        .select('value')
        .eq('key', `theme_${teacherInfo.id}`)
        .maybeSingle()
        
      if (themeData) {
        setFormData(prev => ({ ...prev, themeColor: themeData.value }))
        document.documentElement.style.setProperty('--color-primary', hexToRgbString(themeData.value))
      }

      // Carregar URL do Logotipo
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

    // Salvar cor no gym_settings
    await supabase.from('gym_settings').upsert({ 
      key: `theme_${teacherInfo.id}`, 
      value: formData.themeColor 
    }, { onConflict: 'key' })

    // Salvar URL do Logotipo no gym_settings
    await supabase.from('gym_settings').upsert({ 
      key: `logo_${teacherInfo.id}`, 
      value: formData.logoUrl || '' 
    }, { onConflict: 'key' })
    
    document.documentElement.style.setProperty('--color-primary', hexToRgbString(formData.themeColor))

    const updatedTeacher = { ...teacherInfo, name: formData.name, password: formData.password }
    localStorage.setItem('vollonfit_teacher', JSON.stringify(updatedTeacher))
    setTeacherInfo(updatedTeacher)
    showToast('Perfil e marca atualizados com sucesso!')
    setLoading(false)
  }

  const usagePercent = Math.min((studentCount / (teacherInfo?.quota_limit || 1)) * 100, 100)

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="glass-panel p-8 rounded-[40px] border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-2xl">person</span>
          </div>
          <div>
            <h3 className="font-headline-md text-xl text-on-surface">Dados do Perfil</h3>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-1">Atualize suas informações de acesso</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2 opacity-50 cursor-not-allowed">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">E-mail (Não editável)</label>
              <input 
                type="email" 
                disabled
                value={teacherInfo?.email}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface-variant font-body-md"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Nova Senha</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Confirmar Senha</label>
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2 mt-4 pt-6 border-t border-outline-variant/30 relative">
              <h4 className="font-label-caps text-on-surface uppercase tracking-tight flex items-center gap-2 mb-4">
                Módulo White Label 
                {teacherInfo?.plan_type === 'premium' ? (
                  <span className="bg-primary-container/20 text-primary-container px-2 py-0.5 rounded text-[9px]">PRO</span>
                ) : (
                  <span className="bg-warning/20 text-warning px-2 py-0.5 rounded text-[9px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">verified_user</span> PREMIUM
                  </span>
                )}
              </h4>
              
              {teacherInfo?.plan_type !== 'premium' && (
                <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-warning/20">
                   <span className="material-symbols-outlined text-warning mb-2 animate-pulse text-3xl">bolt</span>
                   <p className="font-headline-sm text-on-surface uppercase tracking-tight">Recurso Exclusivo Premium</p>
                   <p className="font-body-md text-on-surface-variant text-[10px] max-w-[200px] mt-1">Personalize as cores e a marca do seu aplicativo para encantar seus alunos.</p>
                   <button 
                    type="button"
                    onClick={() => {
                      const msg = "Olá, vim solicitar o upgrade da minha assinatura do VollonFit para o plano Professor Premium!";
                      window.open(`https://wa.me/5511922928343?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="mt-4 bg-warning text-on-warning px-4 py-2 rounded-xl font-label-caps text-[10px] uppercase tracking-widest hover:brightness-110 transition-all neon-glow shadow-warning/20"
                   >
                     Fazer Upgrade Agora
                   </button>
                </div>
              )}

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${teacherInfo?.plan_type !== 'premium' ? 'blur-[2px] pointer-events-none' : ''}`}>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">Cor Principal (Tema)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <input 
                      type="color" 
                      value={formData.themeColor}
                      onChange={e => setFormData({...formData, themeColor: e.target.value})}
                      className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant/30 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={formData.themeColor}
                      onChange={e => setFormData({...formData, themeColor: e.target.value})}
                      className="flex-1 bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md uppercase"
                      placeholder="#DFFF5E"
                    />
                  </div>
                  <p className="font-body-md text-[10px] text-on-surface-variant mt-2">Seus alunos verão o aplicativo com esta cor de destaque.</p>
                </div>

                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">URL do Logotipo Customizado</label>
                  <input 
                    type="url" 
                    value={formData.logoUrl || ''}
                    onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md mt-2"
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <p className="font-body-md text-[10px] text-on-surface-variant mt-2">Aparecerá com destaque na tela de convite para os seus novos alunos.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-primary-container text-on-primary-container font-label-caps rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(195,244,0,0.2)] disabled:opacity-50 active:scale-95 uppercase tracking-widest neon-glow"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </section>

      {/* SEÇÃO: Link de Auto-Cadastro (Disponível para Premium - Plano 2) */}
      <section className="glass-panel p-8 rounded-[40px] border border-outline-variant/30 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <div>
            <h3 className="font-headline-md text-xl text-on-surface flex items-center gap-2">
              Link de Auto-Cadastro
              {teacherInfo?.plan_type === 'premium' ? (
                <span className="bg-primary-container/25 text-primary-container border border-primary-container/25 px-2 py-0.5 rounded text-[8px] font-label-caps uppercase tracking-widest">Premium</span>
              ) : (
                <span className="bg-warning/25 text-warning border border-warning/25 px-2 py-0.5 rounded text-[8px] font-label-caps uppercase tracking-widest">Bloqueado</span>
              )}
            </h3>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-0.5">Permita que seus alunos se cadastrem sozinhos</p>
          </div>
        </div>

        {teacherInfo?.plan_type !== 'premium' && (
          <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-md rounded-[40px] flex flex-col items-center justify-center text-center p-6 border border-warning/25">
             <span className="material-symbols-outlined text-warning mb-2 animate-pulse text-3xl">bolt</span>
             <p className="font-headline-sm text-on-surface uppercase tracking-tight">Recurso Exclusivo Premium (Plano 2)</p>
             <p className="font-body-md text-[10px] text-on-surface-variant max-w-[280px] mt-1 mb-4">Crie um link exclusivo para enviar aos seus alunos pelo WhatsApp e permita o cadastro automático!</p>
             <button 
              type="button"
              onClick={() => {
                const msg = "Olá, vim solicitar o upgrade da minha assinatura do VollonFit para o plano Professor Premium!";
                window.open(`https://wa.me/5511922928343?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
              }}
              className="bg-warning hover:brightness-110 text-on-warning px-6 py-3 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-all neon-glow shadow-warning/20 active:scale-95"
             >
               Fazer Upgrade Agora
             </button>
          </div>
        )}

        <div className={`space-y-6 relative z-10 ${teacherInfo?.plan_type !== 'premium' ? 'blur-[2px] pointer-events-none' : ''}`}>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            Envie este link exclusivo para seus novos alunos. Ao abrir o link, eles poderão se cadastrar na plataforma por conta própria e serão **automaticamente associados ao seu perfil de professor**!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              readOnly
              value={`${window.location.origin}/login?invite=${teacherInfo?.id || ''}`}
              className="flex-1 bg-surface border border-outline-variant/30 rounded-2xl px-5 py-4 text-xs font-body-md text-primary-container select-all focus:outline-none"
            />
            <button 
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/login?invite=${teacherInfo?.id || ''}`)
                showToast('Link de convite copiado para a área de transferência!')
              }}
              className="px-6 py-4 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-highest text-on-surface rounded-2xl font-label-caps text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Copiar Link
            </button>
          </div>
        </div>
      </section>

      <section className="glass-panel p-8 rounded-[40px] border border-outline-variant/30 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 bg-secondary-container/10 rounded-2xl flex items-center justify-center text-secondary-container">
            <span className="material-symbols-outlined text-2xl">trending_up</span>
          </div>
          <div>
            <h3 className="font-headline-md text-xl text-on-surface">Plano & Limites</h3>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-0.5">Gerencie seu crescimento na plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Status do Uso</p>
                <p className="font-display-lg text-3xl text-on-surface">
                  {studentCount} <span className="text-on-surface-variant text-lg">/ {teacherInfo?.quota_limit} alunos</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-label-caps text-[10px] text-primary-container uppercase tracking-widest mb-1">Ocupação</p>
                <p className="font-display-lg text-lg text-primary-container">{usagePercent.toFixed(0)}%</p>
              </div>
            </div>

            <div className="h-4 bg-surface-container rounded-full overflow-hidden border border-outline-variant/30 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  usagePercent > 90 ? 'bg-error' : usagePercent > 70 ? 'bg-warning' : 'bg-primary-container'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Seu plano atual permite cadastrar até <b>{teacherInfo?.quota_limit} alunos</b>. 
              {usagePercent > 80 && " Você está próximo do limite! Considere fazer um upgrade para continuar crescendo."}
            </p>
          </div>

          <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 flex flex-col items-center text-center">
            <p className="font-label-caps text-xs text-secondary-container uppercase tracking-widest mb-4">Precisa de mais espaço?</p>
            <p className="font-body-md text-sm text-on-surface-variant mb-6">Entre em contato com o administrador para expandir seu limite de alunos ou mudar de plano.</p>
            <a 
              href="mailto:cf95.souza@gmail.com" 
              className="w-full py-3 bg-secondary-container text-on-secondary-container font-label-caps rounded-xl hover:brightness-110 transition-all text-center text-xs uppercase tracking-widest"
            >
              Falar com Suporte
            </a>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-container/5 rounded-full blur-3xl pointer-events-none" />
      </section>
    </div>
  )
}

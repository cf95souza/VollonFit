import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function MasterSettings({ showToast }) {
  const [priceBasic, setPriceBasic] = useState('30')
  const [originalBasic, setOriginalBasic] = useState('30')

  const [pricePremium, setPricePremium] = useState('45')
  const [originalPremium, setOriginalPremium] = useState('45')

  const [priceEnterprise, setPriceEnterprise] = useState('899')
  const [originalEnterprise, setOriginalEnterprise] = useState('899')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('gym_settings').select('*')
      if (data) {
        const basic = data.find(item => item.key === 'price_per_student')
        if (basic) {
          setPriceBasic(basic.value)
          setOriginalBasic(basic.value)
        }

        const premium = data.find(item => item.key === 'price_premium')
        if (premium) {
          setPricePremium(premium.value)
          setOriginalPremium(premium.value)
        }

        const enterprise = data.find(item => item.key === 'price_enterprise')
        if (enterprise) {
          setPriceEnterprise(enterprise.value)
          setOriginalEnterprise(enterprise.value)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const keysToUpdate = [
        { key: 'price_per_student', value: priceBasic },
        { key: 'price_premium', value: pricePremium },
        { key: 'price_enterprise', value: priceEnterprise }
      ]

      for (const item of keysToUpdate) {
        const { error } = await supabase
          .from('gym_settings')
          .upsert({ 
            key: item.key, 
            value: item.value, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'key' })
        
        if (error) throw error
      }

      setOriginalBasic(priceBasic)
      setOriginalPremium(pricePremium)
      setOriginalEnterprise(priceEnterprise)
      showToast('Planos atualizados com sucesso!')
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const hasChanged = 
    priceBasic !== originalBasic || 
    pricePremium !== originalPremium || 
    priceEnterprise !== originalEnterprise

  if (loading) {
    return <div className="glass-panel border border-outline-variant/30 rounded-3xl p-8 animate-pulse h-96" />
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
      <div className="glass-panel border border-outline-variant/30 rounded-[32px] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container">settings</span>
          </div>
          <div>
            <h3 className="text-xl font-display-md text-on-surface uppercase tracking-tight">Gestão Global de Planos</h3>
            <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-widest mt-0.5">Defina os valores das licenças e cobranças recorrentes</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Plano Basic */}
          <div className="p-6 bg-surface-container/40 border border-outline-variant/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-outline-variant/50 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/30">
                <span className="material-symbols-outlined w-5 h-5 text-on-surface-variant flex items-center justify-center text-[20px]">shield</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-on-surface text-sm uppercase tracking-wider">Professor Basic</h4>
                <p className="font-body-md text-xs text-on-surface-variant mt-1 max-w-sm">Valor cobrado mensalmente por aluno ativo do Personal Trainer.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1">Valor por Aluno</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceBasic}
                  onChange={e => setPriceBasic(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano Premium */}
          <div className="p-6 bg-surface-container/40 border border-outline-variant/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-outline-variant/50 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined w-5 h-5 text-primary-container flex items-center justify-center text-[20px]">workspace_premium</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-primary-container text-sm uppercase tracking-wider">Professor Premium</h4>
                <p className="font-body-md text-xs text-on-surface-variant mt-1 max-w-sm">Valor por aluno que inclui customização White Label e IA Coach.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1">Valor por Aluno</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePremium}
                  onChange={e => setPricePremium(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano Enterprise */}
          <div className="p-6 bg-surface-container/40 border border-outline-variant/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-outline-variant/50 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 border border-secondary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined w-5 h-5 text-secondary-container flex items-center justify-center text-[20px]">domain</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-secondary-container text-sm uppercase tracking-wider">Academia Enterprise</h4>
                <p className="font-body-md text-xs text-on-surface-variant mt-1 max-w-sm">Valor mensal fixo para academias e redes de grande porte.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1">Mensalidade Fixa</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEnterprise}
                  onChange={e => setPriceEnterprise(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
            </div>
          </div>

          {hasChanged && (
            <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-warning mt-0.5 shrink-0 text-[20px]">warning</span>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                Você fez alterações nas tabelas de preços dos planos. 
                Os novos valores serão aplicados em <strong className="text-warning">todas as próximas cobranças mensais</strong> geradas. 
                Mensalidades e faturas históricas não serão recalculadas.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="w-full bg-primary-container hover:brightness-110 text-on-primary-container py-4 rounded-2xl font-label-caps text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 active:scale-95 neon-glow"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Salvando...' : 'Salvar Alterações de Preço'}
          </button>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6">
        <h4 className="font-label-caps text-[10px] text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary-container">lightbulb</span> 
          Gestão Macro e White Label
        </h4>
        <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
          O plano do professor define diretamente as permissões e funcionalidades disponíveis em seu painel:
          professores no plano <span className="text-primary-container font-headline-sm">Premium</span> ganham acesso imediato à customização de cores, logotipos próprios e à integração do IA Coach para seus alunos, enquanto o plano <span className="text-on-surface font-headline-sm">Basic</span> mantém a marca neutra da VollonFit.
        </p>
      </div>
    </div>
  )
}

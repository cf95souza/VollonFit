import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Settings, DollarSign, Save, AlertTriangle, ShieldCheck, Award, Building2 } from 'lucide-react'

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
    return <div className="bg-[#111111] border border-white/5 rounded-lg p-8 animate-pulse h-96" />
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
      <div className="bg-[#111111] border border-white/5 rounded-[32px] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight font-display">Gestão Global de Planos</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Defina os valores das licenças e cobranças recorrentes</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Plano Basic */}
          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm uppercase tracking-wider">Professor Basic</h4>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">Valor cobrado mensalmente por aluno ativo do Personal Trainer.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor por Aluno</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceBasic}
                  onChange={e => setPriceBasic(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-black border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano Premium */}
          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-primary text-sm uppercase tracking-wider">Professor Premium</h4>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">Valor por aluno que inclui customização White Label e IA Coach.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor por Aluno</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePremium}
                  onChange={e => setPricePremium(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-black border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano Enterprise */}
          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#C6C4FF]/10 border border-[#C6C4FF]/20 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#C6C4FF]" />
              </div>
              <div>
                <h4 className="font-black text-[#C6C4FF] text-sm uppercase tracking-wider">Academia Enterprise</h4>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">Valor mensal fixo para academias e redes de grande porte.</p>
              </div>
            </div>
            <div className="w-full md:w-44 space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mensalidade Fixa</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEnterprise}
                  onChange={e => setPriceEnterprise(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-black border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {hasChanged && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Você fez alterações nas tabelas de preços dos planos. 
                Os novos valores serão aplicados em <strong className="text-amber-300">todas as próximas cobranças mensais</strong> geradas. 
                Mensalidades e faturas históricas não serão recalculadas.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="w-full bg-primary hover:bg-primary-dark text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-98"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações de Preço'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">💡 Gestão Macro e White Label</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          O plano do professor define diretamente as permissões e funcionalidades disponíveis em seu painel:
          professores no plano <span className="text-primary font-bold">Premium</span> ganham acesso imediato à customização de cores, logotipos próprios e à integração do IA Coach para seus alunos, enquanto o plano <span className="text-slate-300 font-bold">Basic</span> mantém a marca neutra da VollonFit.
        </p>
      </div>
    </div>
  )
}

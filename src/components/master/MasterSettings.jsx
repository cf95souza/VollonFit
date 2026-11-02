import { useState, useEffect } from 'react'
import { 
  Settings, 
  ShieldCheck, 
  Crown, 
  Building2, 
  AlertTriangle, 
  Save, 
  Sparkles,
  Loader2
} from 'lucide-react'
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
      showToast('Planos e preços atualizados com sucesso!')
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
    return <div className="vollon-card rounded-3xl p-8 animate-pulse h-96" />
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
      
      {/* Container Principal */}
      <div className="vollon-card rounded-3xl p-6 sm:p-8 space-y-6">
        
        <div className="flex items-center gap-3.5 pb-6 border-b border-[#2A2A2A]">
          <div className="w-11 h-11 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
              Gestão Global de Planos
            </h3>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
              Defina os valores das licenças e mensalidades recorrentes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Plano 1: Basic */}
          <div className="p-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#A3A3A3]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white uppercase">Professor Basic</h4>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Cobrado mensalmente por aluno ativo.</p>
              </div>
            </div>
            <div className="w-full md:w-40 space-y-1">
              <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
                Valor por Aluno
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] text-xs font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceBasic}
                  onChange={e => setPriceBasic(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano 2: Premium */}
          <div className="p-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E11D2E]/15 border border-[#E11D2E]/30 flex items-center justify-center text-[#FF3B4A] shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#FF3B4A] uppercase">Professor Premium</h4>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Inclui IA Coach, Squads e White Label.</p>
              </div>
            </div>
            <div className="w-full md:w-40 space-y-1">
              <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
                Valor por Aluno
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] text-xs font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePremium}
                  onChange={e => setPricePremium(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Plano 3: Enterprise */}
          <div className="p-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white shrink-0">
                <Building2 className="w-5 h-5 text-[#FF3B4A]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white uppercase">Academia Enterprise</h4>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Mensalidade base para redes corporativas.</p>
              </div>
            </div>
            <div className="w-full md:w-40 space-y-1">
              <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
                Mensalidade Base
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] text-xs font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEnterprise}
                  onChange={e => setPriceEnterprise(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                />
              </div>
            </div>
          </div>

          {hasChanged && (
            <div className="bg-[#141414] border border-[#E11D2E]/40 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-[#FF3B4A] mt-0.5 shrink-0" />
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Você alterou valores dos planos. Os novos preços serão aplicados em todas as <strong className="text-white">próximas cobranças geradas</strong>. Faturas já emitidas não sofrem alteração retroativa.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="vollon-btn-primary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Gravando...' : 'Salvar Alterações de Preço'}</span>
          </button>

        </div>
      </div>

      {/* Nota Explicativa */}
      <div className="vollon-card rounded-2xl p-5 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF3B4A]" /> Regras de Planos e Permissões
        </h4>
        <p className="text-xs text-[#A3A3A3] leading-relaxed">
          Professores vinculados ao plano <span className="text-[#FF3B4A] font-bold">Premium</span> têm acesso liberado à personalização White Label, upload de logotipo próprio, tema customizado e ativação de metas automáticas da IA para seus alunos.
        </p>
      </div>

    </div>
  )
}

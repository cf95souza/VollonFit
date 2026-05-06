import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Settings, DollarSign, Save, AlertTriangle } from 'lucide-react'

export default function MasterSettings({ showToast }) {
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('gym_settings').select('*').eq('key', 'price_per_student').single()
    if (data) {
      setPrice(data.value)
      setOriginalPrice(data.value)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('gym_settings')
      .update({ value: price, updated_at: new Date().toISOString() })
      .eq('key', 'price_per_student')
    
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error')
    } else {
      setOriginalPrice(price)
      showToast('Preço atualizado com sucesso!')
    }
    setSaving(false)
  }

  const hasChanged = price !== originalPrice

  if (loading) {
    return <div className="bg-[#111111] border border-white/5 rounded-lg p-8 animate-pulse h-40" />
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-[#111111] border border-white/5 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h3 className="font-bold text-white">Preço por Aluno</h3>
            <p className="text-xs text-slate-400">Valor cobrado mensalmente por aluno ativo</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-lg font-bold text-white focus:outline-none focus:border-[#DFFF5E]/50"
              />
            </div>
          </div>

          {hasChanged && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400">
                O reajuste será aplicado em <strong className="text-amber-300">todas as próximas cobranças</strong> geradas. 
                Cobranças já existentes não serão alteradas.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="w-full bg-[#DFFF5E] hover:bg-[#B8E600] text-black py-3 rounded-lg font-bold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alteração'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-lg p-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-white">Como funciona o reajuste?</strong><br />
          Ao alterar o preço, todas as cobranças futuras usarão o novo valor. 
          Cobranças já geradas mantêm o preço original, garantindo transparência no histórico.
        </p>
      </div>
    </div>
  )
}

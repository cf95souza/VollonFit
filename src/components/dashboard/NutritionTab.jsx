import { useState, useEffect } from 'react'
import { Droplet, Flame, ArrowUpCircle, CheckCircle2, Plus, Minus } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

export default function NutritionTab({ studentId, showToast }) {
  const [loading, setLoading] = useState(true)
  const [nutrition, setNutrition] = useState({
    water_ml: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0
  })
  
  const [saving, setSaving] = useState(false)

  const today = getTodayLocally()

  useEffect(() => {
    const fetchNutrition = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('gym_nutrition_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('log_date', today)
        .maybeSingle()

      if (data) {
        setNutrition(data)
      }
      setLoading(false)
    }

    if (studentId) fetchNutrition()
  }, [studentId, today])

  const handleSave = async (newNutrition) => {
    setSaving(true)
    const payload = {
      student_id: studentId,
      log_date: today,
      ...newNutrition
    }

    const { error } = await supabase
      .from('gym_nutrition_logs')
      .upsert(payload, { onConflict: 'student_id,log_date' })

    if (!error) {
      setNutrition(newNutrition)
    } else {
      showToast('Erro ao salvar nutrição', 'error')
    }
    setSaving(false)
  }

  const addWater = (amount) => {
    const updated = { ...nutrition, water_ml: nutrition.water_ml + amount }
    handleSave(updated)
  }

  const removeWater = (amount) => {
    const newWater = Math.max(0, nutrition.water_ml - amount)
    const updated = { ...nutrition, water_ml: newWater }
    handleSave(updated)
  }

  const updateMacro = (macro, value) => {
    const num = parseInt(value) || 0
    setNutrition(prev => ({ ...prev, [macro]: num }))
  }

  const saveMacros = () => {
    handleSave(nutrition)
    showToast('Macros atualizados!')
  }

  const waterCups = Math.floor(nutrition.water_ml / 250)
  const waterGoal = 3000 // 3 Litros como meta fixa por enquanto

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-24">
      {/* HEADER */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Nutrição</h2>
        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Rastreie seu combustível</p>
      </div>

      {/* WATER TRACKER */}
      <section className="px-6">
        <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${Math.min((nutrition.water_ml / waterGoal) * 100, 100)}%` }}
            />
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hidratação</p>
                <p className="text-2xl font-black text-white">{nutrition.water_ml} <span className="text-sm text-slate-500 font-bold">ml</span></p>
              </div>
            </div>
            {nutrition.water_ml >= waterGoal && (
              <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full flex items-center gap-1 border border-blue-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Meta Atingida</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => removeWater(250)}
              disabled={nutrition.water_ml === 0 || saving}
              className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30 active:scale-95"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button 
              onClick={() => addWater(250)}
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Copo 250ml
            </button>
          </div>
        </div>
      </section>

      {/* MACRO TRACKER */}
      <section className="px-6 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" /> Macros do Dia
        </h3>
        
        <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 space-y-6">
          
          <div className="grid grid-cols-3 gap-4">
            {/* Proteina */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center block">Proteína (g)</label>
              <input 
                type="number"
                value={nutrition.protein_g || ''}
                onChange={(e) => updateMacro('protein_g', e.target.value)}
                className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-lg font-black text-white text-center focus:outline-none focus:border-rose-500/50 transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Carbo */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center block">Carbo (g)</label>
              <input 
                type="number"
                value={nutrition.carbs_g || ''}
                onChange={(e) => updateMacro('carbs_g', e.target.value)}
                className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-lg font-black text-white text-center focus:outline-none focus:border-amber-500/50 transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Gordura */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center block">Gordura (g)</label>
              <input 
                type="number"
                value={nutrition.fats_g || ''}
                onChange={(e) => updateMacro('fats_g', e.target.value)}
                className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-lg font-black text-white text-center focus:outline-none focus:border-emerald-500/50 transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <button 
            onClick={saveMacros}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-dark text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary/20"
          >
            {saving ? 'Salvando...' : 'Atualizar Macros'} <ArrowUpCircle className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}

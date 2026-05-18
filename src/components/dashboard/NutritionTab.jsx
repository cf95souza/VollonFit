import { useState, useEffect } from 'react'
import { Droplet, Flame, ArrowUpCircle, CheckCircle2, Plus, Minus, Sparkles, Scale, Apple } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

export default function NutritionTab({ studentId, student, showToast }) {
  const [loading, setLoading] = useState(true)
  const [nutrition, setNutrition] = useState({
    water_ml: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0
  })
  
  const [saving, setSaving] = useState(false)

  const today = getTodayLocally()

  // --- IA COACH NUTRICIONAL 2.0 (Cálculos Biométricos Mifflin-St Jeor) ---
  const age = student?.age
  const height = student?.height
  const weight = student?.initial_weight
  const rawGoal = student?.goals || ''

  const hasBiometrics = age && height && weight

  let targetCalories = 2000
  let targetProtein = 140
  let targetCarbs = 210
  let targetFat = 65
  let waterGoal = 3000
  let goalLabel = 'Manutenção Saudável'

  if (hasBiometrics) {
    const ageNum = parseInt(age, 10)
    const heightCm = parseFloat(height) * 100
    const weightKg = parseFloat(weight)

    // Taxa Metabólica Basal (BMR) e Gasto Energético Total Diário (TDEE) com fator ativo médio (1.45)
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5
    const tdee = Math.round(bmr * 1.45)

    // Adaptação Calórica baseada no objetivo
    const goalLower = rawGoal.toLowerCase()
    if (goalLower.includes('hipertrofia') || goalLower.includes('ganho') || goalLower.includes('massa') || goalLower.includes('crescer')) {
      targetCalories = tdee + 350
      goalLabel = 'Hipertrofia & Bulking Limpo'
    } else if (goalLower.includes('perda') || goalLower.includes('emagrece') || goalLower.includes('secar') || goalLower.includes('defini') || goalLower.includes('redu')) {
      targetCalories = tdee - 450
      goalLabel = 'Déficit Calórico & Definição'
    } else {
      targetCalories = tdee
      goalLabel = 'Manutenção & Recomposição'
    }

    // Divisão ótima de Macronutrientes (Proteína: 2.0g/kg, Gordura: 0.85g/kg, Carbos: Restante)
    targetProtein = Math.round(weightKg * 2.0)
    targetFat = Math.round(weightKg * 0.85)
    targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4)
    waterGoal = Math.round(weightKg * 35)
  }

  // Valores consumidos no dia
  const proteinConsumed = nutrition.protein_g || 0
  const carbsConsumed = nutrition.carbs_g || 0
  const fatsConsumed = nutrition.fats_g || 0
  const caloriesConsumed = (proteinConsumed * 4) + (carbsConsumed * 4) + (fatsConsumed * 9)

  // Percentuais de conclusão
  const caloriesPercent = Math.min((caloriesConsumed / targetCalories) * 100, 100)
  const proteinPercent = Math.min((proteinConsumed / targetProtein) * 100, 100)
  const carbsPercent = Math.min((carbsConsumed / targetCarbs) * 100, 100)
  const fatsPercent = Math.min((fatsConsumed / targetFat) * 100, 100)
  const waterPercent = Math.min((nutrition.water_ml / waterGoal) * 100, 100)

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
      <div className="px-6 pt-8 pb-2">
        <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Nutrição</h2>
        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Rastreie seu combustível</p>
      </div>

      {/* IA COACH NUTRICIONAL 2.0 PANEL */}
      <section className="px-6">
        {hasBiometrics ? (
          <div className="bg-[#1A1A1A] border-2 border-primary/20 p-6 rounded-[36px] relative overflow-hidden shadow-2xl space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="bg-primary text-black p-2.5 rounded-2xl shadow-[0_0_15px_rgba(223,255,94,0.3)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white font-display text-lg tracking-tight flex items-center gap-1.5">
                  IA Coach Nutricional 2.0
                </h3>
                <p className="text-[9px] text-primary font-black uppercase tracking-widest">{goalLabel}</p>
              </div>
            </div>

            {/* Calories Progress Ring-bar */}
            <div className="bg-black/50 p-5 rounded-3xl border border-white/5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Energia Diária</span>
                <span className="text-white font-black text-lg font-display">
                  {caloriesConsumed} <span className="text-xs text-slate-500 font-bold">/ {targetCalories} kcal</span>
                </span>
              </div>
              
              <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(223,255,94,0.5)]"
                  style={{ width: `${caloriesPercent}%` }}
                />
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                💡 Seu metabolismo basal estimado é de <strong className="text-slate-200">{Math.round(targetCalories - 350)} kcal</strong>. Consuma alimentos limpos para manter a alta performance em seus treinos.
              </p>
            </div>

            {/* Macros Progress Bars Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Proteina */}
              <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-rose-500">
                  <span>Proteína</span>
                  <span>{proteinPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${proteinPercent}%` }} />
                </div>
                <div className="text-right text-xs font-black text-white">{proteinConsumed}g <span className="text-[10px] text-slate-500 font-bold">/ {targetProtein}g</span></div>
              </div>

              {/* Carbos */}
              <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-500">
                  <span>Carboidratos</span>
                  <span>{carbsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${carbsPercent}%` }} />
                </div>
                <div className="text-right text-xs font-black text-white">{carbsConsumed}g <span className="text-[10px] text-slate-500 font-bold">/ {targetCarbs}g</span></div>
              </div>

              {/* Gorduras */}
              <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  <span>Gorduras</span>
                  <span>{fatsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${fatsPercent}%` }} />
                </div>
                <div className="text-right text-xs font-black text-white">{fatsConsumed}g <span className="text-[10px] text-slate-500 font-bold">/ {targetFat}g</span></div>
              </div>

              {/* Hidratação */}
              <div className="bg-black/35 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-500">
                  <span>Hidratação</span>
                  <span>{waterPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${waterPercent}%` }} />
                </div>
                <div className="text-right text-xs font-black text-white">{nutrition.water_ml}ml <span className="text-[10px] text-slate-500 font-bold">/ {waterGoal}ml</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                const filledNutrition = {
                  ...nutrition,
                  protein_g: targetProtein,
                  carbs_g: targetCarbs,
                  fats_g: targetFat,
                  water_ml: waterGoal
                }
                handleSave(filledNutrition)
                showToast("Sua nutrição do dia foi auto-preenchida com as metas da IA! 🧠🔥")
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-primary" /> Auto-Preencher com Metas da IA
            </button>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-6 rounded-[36px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white font-display mb-2">IA Coach Nutricional Bloqueado</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
              Complete seu perfil nas <strong>Configurações da Conta</strong> (inserindo idade, altura, peso e objetivos) para que a nossa IA calcule as suas metas ótimas diárias de calorias, macros e hidratação.
            </p>
          </div>
        )}
      </section>

      {/* WATER TRACKER */}
      <section className="px-6">
        <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hidratação</p>
                <p className="text-2xl font-black text-white">{nutrition.water_ml} <span className="text-sm text-slate-500 font-bold">ml <span className="text-slate-600">/ {waterGoal}ml</span></span></p>
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

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      </div>
    )
  }

  return (
    <div className="space-y-lg animate-in slide-in-from-bottom-8 duration-500 pb-24">
      {/* HEADER */}
      <div className="px-gutter pt-8 pb-2">
        <h2 className="font-display-xl text-3xl text-primary uppercase tracking-tight">Nutrição</h2>
        <p className="font-label-caps text-xs text-on-surface-variant mt-1 uppercase tracking-widest">Rastreie seu combustível</p>
      </div>

      {/* IA COACH NUTRICIONAL 2.0 PANEL */}
      <section className="px-gutter">
        {hasBiometrics ? (
          <div className="glass-panel border-2 border-primary-container/20 p-6 rounded-3xl relative overflow-hidden shadow-2xl space-y-6 bg-surface-container-high/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="bg-primary-container text-on-primary-container p-3 rounded-2xl shadow-[0_0_15px_rgba(195,244,0,0.3)]">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="font-display-lg text-lg text-on-surface tracking-tight flex items-center gap-1.5">
                  IA Coach Nutricional 2.0
                </h3>
                <p className="font-label-caps text-[9px] text-primary-container uppercase tracking-widest">{goalLabel}</p>
              </div>
            </div>

            {/* Calories Progress Ring-bar */}
            <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-label-caps text-on-surface-variant text-xs uppercase tracking-widest">Energia Diária</span>
                <span className="font-display-xl text-on-surface text-lg">
                  {caloriesConsumed} <span className="font-headline-md text-xs text-on-surface-variant">/ {targetCalories} kcal</span>
                </span>
              </div>
              
              <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary-container rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(195,244,0,0.5)]"
                  style={{ width: `${caloriesPercent}%` }}
                />
              </div>
              
              <p className="font-body-md text-[10px] text-on-surface-variant font-medium leading-relaxed">
                💡 Seu metabolismo basal estimado é de <strong className="text-on-surface">{Math.round(targetCalories - 350)} kcal</strong>. Consuma alimentos limpos para manter a alta performance em seus treinos.
              </p>
            </div>

            {/* Macros Progress Bars Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Proteina */}
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-[#F43F5E]">
                  <span>Proteína</span>
                  <span>{proteinPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-[#F43F5E] rounded-full transition-all duration-1000" style={{ width: `${proteinPercent}%` }} />
                </div>
                <div className="text-right font-display-lg text-xs text-on-surface">{proteinConsumed}g <span className="font-headline-md text-[10px] text-on-surface-variant">/ {targetProtein}g</span></div>
              </div>

              {/* Carbos */}
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-[#F59E0B]">
                  <span>Carboidratos</span>
                  <span>{carbsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-1000" style={{ width: `${carbsPercent}%` }} />
                </div>
                <div className="text-right font-display-lg text-xs text-on-surface">{carbsConsumed}g <span className="font-headline-md text-[10px] text-on-surface-variant">/ {targetCarbs}g</span></div>
              </div>

              {/* Gorduras */}
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-[#10B981]">
                  <span>Gorduras</span>
                  <span>{fatsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full transition-all duration-1000" style={{ width: `${fatsPercent}%` }} />
                </div>
                <div className="text-right font-display-lg text-xs text-on-surface">{fatsConsumed}g <span className="font-headline-md text-[10px] text-on-surface-variant">/ {targetFat}g</span></div>
              </div>

              {/* Hidratação */}
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-[#3B82F6]">
                  <span>Hidratação</span>
                  <span>{waterPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B82F6] rounded-full transition-all duration-1000" style={{ width: `${waterPercent}%` }} />
                </div>
                <div className="text-right font-display-lg text-xs text-on-surface">{nutrition.water_ml}ml <span className="font-headline-md text-[10px] text-on-surface-variant">/ {waterGoal}ml</span></div>
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
              className="w-full glass-panel hover:bg-surface-container-highest border border-outline-variant/50 text-on-surface py-4 rounded-xl font-label-caps text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm text-primary-container">check_circle</span> Auto-Preencher com Metas da IA
            </button>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            </div>
            <h3 className="font-display-lg text-lg text-on-surface mb-2">IA Coach Nutricional Bloqueado</h3>
            <p className="font-body-md text-xs text-on-surface-variant max-w-xs leading-relaxed mb-6">
              Complete seu perfil nas <strong>Configurações da Conta</strong> (inserindo idade, altura, peso e objetivos) para que a nossa IA calcule as suas metas ótimas diárias de calorias, macros e hidratação.
            </p>
          </div>
        )}
      </section>

      {/* WATER TRACKER */}
      <section className="px-gutter">
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#3B82F6]/20">
            <div 
              className="h-full bg-[#3B82F6] transition-all duration-1000"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6]">
                <span className="material-symbols-outlined">water_drop</span>
              </div>
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-0.5">Hidratação</p>
                <p className="font-display-xl text-2xl text-on-surface">{nutrition.water_ml} <span className="font-headline-md text-sm text-on-surface-variant">ml <span className="opacity-70">/ {waterGoal}ml</span></span></p>
              </div>
            </div>
            {nutrition.water_ml >= waterGoal && (
              <div className="bg-[#3B82F6]/20 text-[#3B82F6] px-3 py-1 rounded-full flex items-center gap-1 border border-[#3B82F6]/30">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span className="font-label-caps text-[9px] uppercase tracking-widest">Meta Atingida</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => removeWater(250)}
              disabled={nutrition.water_ml === 0 || saving}
              className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-30 active:scale-95 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button 
              onClick={() => addWater(250)}
              disabled={saving}
              className="flex-1 bg-[#3B82F6] hover:opacity-90 text-on-primary py-4 rounded-2xl font-label-caps text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 active:scale-95 neon-glow"
            >
              <span className="material-symbols-outlined">add</span> Copo 250ml
            </button>
          </div>
        </div>
      </section>

      {/* MACRO TRACKER */}
      <section className="px-gutter space-y-4">
        <h3 className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F59E0B] text-sm">local_fire_department</span> Macros do Dia
        </h3>
        
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 space-y-6">
          
          <div className="grid grid-cols-3 gap-3">
            {/* Proteina */}
            <div className="space-y-2">
              <label className="font-label-caps text-[9px] text-[#F43F5E] uppercase tracking-widest text-center block">Proteína (g)</label>
              <input 
                type="number"
                value={nutrition.protein_g || ''}
                onChange={(e) => updateMacro('protein_g', e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant/30 rounded-xl p-4 font-headline-lg text-lg text-on-surface text-center focus:outline-none focus:border-[#F43F5E]/50 transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Carbo */}
            <div className="space-y-2">
              <label className="font-label-caps text-[9px] text-[#F59E0B] uppercase tracking-widest text-center block">Carbo (g)</label>
              <input 
                type="number"
                value={nutrition.carbs_g || ''}
                onChange={(e) => updateMacro('carbs_g', e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant/30 rounded-xl p-4 font-headline-lg text-lg text-on-surface text-center focus:outline-none focus:border-[#F59E0B]/50 transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Gordura */}
            <div className="space-y-2">
              <label className="font-label-caps text-[9px] text-[#10B981] uppercase tracking-widest text-center block">Gordura (g)</label>
              <input 
                type="number"
                value={nutrition.fats_g || ''}
                onChange={(e) => updateMacro('fats_g', e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant/30 rounded-xl p-4 font-headline-lg text-lg text-on-surface text-center focus:outline-none focus:border-[#10B981]/50 transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <button 
            onClick={saveMacros}
            disabled={saving}
            className="w-full bg-primary-container hover:bg-surface-tint text-on-primary-container py-4 rounded-2xl font-label-caps text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(195,244,0,0.2)] neon-glow"
          >
            {saving ? 'Salvando...' : 'Atualizar Macros'} <span className="material-symbols-outlined">arrow_circle_up</span>
          </button>
        </div>
      </section>
    </div>
  )
}

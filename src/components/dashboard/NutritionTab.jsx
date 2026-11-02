import { useState, useEffect } from 'react'
import { Droplet, Flame, CheckCircle2, Plus, Minus, Brain, Sparkles } from 'lucide-react'
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
  let goalLabel = 'Manutenção & Recomposição'

  if (hasBiometrics) {
    const ageNum = parseInt(age, 10)
    const heightCm = parseFloat(height) * 100
    const weightKg = parseFloat(weight)

    // Taxa Metabólica Basal (BMR) e TDEE
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5
    const tdee = Math.round(bmr * 1.45)

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

    targetProtein = Math.round(weightKg * 2.0)
    targetFat = Math.round(weightKg * 0.85)
    targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4)
    waterGoal = Math.round(weightKg * 35)
  }

  // Valores consumidos
  const proteinConsumed = nutrition.protein_g || 0
  const carbsConsumed = nutrition.carbs_g || 0
  const fatsConsumed = nutrition.fats_g || 0
  const caloriesConsumed = (proteinConsumed * 4) + (carbsConsumed * 4) + (fatsConsumed * 9)

  // Percentuais
  const caloriesPercent = Math.min((caloriesConsumed / targetCalories) * 100, 100)
  const proteinPercent = Math.min((proteinConsumed / targetProtein) * 100, 100)
  const carbsPercent = Math.min((carbsConsumed / targetCarbs) * 100, 100)
  const fatsPercent = Math.min((fatsConsumed / targetFat) * 100, 100)
  const waterPercent = Math.min((nutrition.water_ml / waterGoal) * 100, 100)

  useEffect(() => {
    const fetchNutrition = async () => {
      setLoading(true)
      const { data } = await supabase
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
    showToast('Macros atualizados com sucesso!')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#E11D2E] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28">
      
      {/* HEADER */}
      <div className="pt-2">
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
          NUTRIÇÃO
        </h1>
        <p className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-widest mt-1.5">
          RASTREIE SEU COMBUSTÍVEL
        </p>
      </div>

      {/* IA COACH NUTRICIONAL 2.0 PANEL */}
      <section>
        {hasBiometrics ? (
          <div className="vollon-card p-6 rounded-3xl space-y-5 relative overflow-hidden">
            {/* Glow sutil */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#E11D2E]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Cabeçalho do Coach */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] shadow-md shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-base tracking-tight truncate">
                  IA Coach Nutricional 2.0
                </h3>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 mt-1">
                  <span className="text-[9px] font-bold text-[#FF3B4A] uppercase tracking-wider">
                    {goalLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Energia Diária */}
            <div className="vollon-card-elevated p-4.5 rounded-2xl space-y-3 relative z-10">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider">
                  ENERGIA DIÁRIA
                </span>
                <span className="font-display text-2xl font-black text-white">
                  {caloriesConsumed}{' '}
                  <span className="font-display text-sm font-bold text-[#A3A3A3]">
                    / {targetCalories} kcal
                  </span>
                </span>
              </div>
              
              {/* Barra de Progresso de Calorias */}
              <div className="h-2.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                <div 
                  className="h-full bg-gradient-to-r from-[#E11D2E] to-[#FF3B4A] rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(225,29,46,0.6)]"
                  style={{ width: `${caloriesPercent}%` }}
                />
              </div>
              
              <p className="text-[11px] text-[#A3A3A3] font-medium leading-relaxed">
                💡 Seu metabolismo basal estimado é de <strong className="text-white">{Math.round(targetCalories - 350)} kcal</strong>. Consuma alimentos limpos para manter a alta performance em seus treinos.
              </p>
            </div>

            {/* Grid dos 4 Macronutrientes (2x2) */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              
              {/* Proteína */}
              <div className="vollon-card-elevated p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#FF3B4A]">
                  <span>PROTEÍNA</span>
                  <span>{proteinPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                  <div 
                    className="h-full bg-[#E11D2E] rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(225,29,46,0.5)]" 
                    style={{ width: `${proteinPercent}%` }} 
                  />
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-black text-white">{proteinConsumed}g</span>
                  <span className="text-[10px] text-[#A3A3A3] font-semibold ml-1">/ {targetProtein}g</span>
                </div>
              </div>

              {/* Carboidratos */}
              <div className="vollon-card-elevated p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white">
                  <span>CARBOIDRATOS</span>
                  <span>{carbsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-700" 
                    style={{ width: `${carbsPercent}%` }} 
                  />
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-black text-white">{carbsConsumed}g</span>
                  <span className="text-[10px] text-[#A3A3A3] font-semibold ml-1">/ {targetCarbs}g</span>
                </div>
              </div>

              {/* Gorduras */}
              <div className="vollon-card-elevated p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
                  <span>GORDURAS</span>
                  <span>{fatsPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                  <div 
                    className="h-full bg-[#52525B] rounded-full transition-all duration-700" 
                    style={{ width: `${fatsPercent}%` }} 
                  />
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-black text-white">{fatsConsumed}g</span>
                  <span className="text-[10px] text-[#A3A3A3] font-semibold ml-1">/ {targetFat}g</span>
                </div>
              </div>

              {/* Hidratação */}
              <div className="vollon-card-elevated p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#FF3B4A]">
                  <span>HIDRATAÇÃO</span>
                  <span>{waterPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                  <div 
                    className="h-full bg-[#E11D2E] rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(225,29,46,0.5)]" 
                    style={{ width: `${waterPercent}%` }} 
                  />
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-black text-white">{nutrition.water_ml}ml</span>
                  <span className="text-[10px] text-[#A3A3A3] font-semibold ml-1">/ {waterGoal}ml</span>
                </div>
              </div>

            </div>

            {/* Botão Auto-Preencher */}
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
                showToast("Metas da IA preenchidas com sucesso! 🔥")
              }}
              className="vollon-btn-secondary w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 hover:border-[#E11D2E] transition-colors cursor-pointer relative z-10"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FF3B4A]" />
              <span>AUTO-PREENCHER COM METAS DA IA</span>
            </button>
          </div>
        ) : (
          <div className="vollon-card p-8 rounded-3xl text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mx-auto text-[#FF3B4A]">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-black uppercase text-white">IA Coach Nutricional Bloqueado</h3>
            <p className="text-xs text-[#A3A3A3] max-w-xs mx-auto leading-relaxed">
              Complete seu perfil nas <strong>Configurações da Conta</strong> (idade, altura, peso e metas) para calcular automaticamente suas necessidades diárias.
            </p>
          </div>
        )}
      </section>

      {/* WATER TRACKER (Hidratação) */}
      <section>
        <div className="vollon-card p-6 rounded-3xl relative overflow-hidden space-y-5">
          {/* Barra superior de progresso de água */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#2A2A2A]">
            <div 
              className="h-full bg-[#E11D2E] transition-all duration-700 shadow-[0_0_8px_rgba(225,29,46,0.6)]"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-[#FF3B4A] shadow-md">
                <Droplet className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">
                  HIDRATAÇÃO
                </p>
                <p className="font-display text-3xl font-black text-white leading-none">
                  {nutrition.water_ml}{' '}
                  <span className="font-display text-sm font-bold text-[#A3A3A3]">
                    ml / {waterGoal}ml
                  </span>
                </p>
              </div>
            </div>

            {nutrition.water_ml >= waterGoal && (
              <div className="bg-[#E11D2E]/15 text-[#FF3B4A] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#E11D2E]/30">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Meta Atingida</span>
              </div>
            )}
          </div>

          {/* Botões de Ação de Água */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => removeWater(250)}
              disabled={nutrition.water_ml === 0 || saving}
              className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white hover:border-[#E11D2E] transition-all disabled:opacity-30 active:scale-95 cursor-pointer shrink-0"
            >
              <Minus className="w-5 h-5" />
            </button>

            <button 
              onClick={() => addWater(250)}
              disabled={saving}
              className="vollon-btn-primary flex-1 h-14 rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-[0_8px_24px_rgba(255,59,74,0.35)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>COPO 250ML</span>
            </button>
          </div>
        </div>
      </section>

      {/* MACRO TRACKER MANUAL */}
      <section className="space-y-3">
        <h3 className="font-display text-xl font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF3B4A]" /> Macros do Dia
        </h3>
        
        <div className="vollon-card p-6 rounded-3xl space-y-5">
          <div className="grid grid-cols-3 gap-3">
            
            {/* Proteína */}
            <div>
              <label className="text-[10px] font-bold text-[#FF3B4A] uppercase tracking-wider text-center block mb-1.5">
                Proteína (g)
              </label>
              <input 
                type="number"
                value={nutrition.protein_g || ''}
                onChange={(e) => updateMacro('protein_g', e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 font-display text-2xl font-black text-white text-center focus:outline-none focus:border-[#E11D2E] transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Carbo */}
            <div>
              <label className="text-[10px] font-bold text-white uppercase tracking-wider text-center block mb-1.5">
                Carbo (g)
              </label>
              <input 
                type="number"
                value={nutrition.carbs_g || ''}
                onChange={(e) => updateMacro('carbs_g', e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 font-display text-2xl font-black text-white text-center focus:outline-none focus:border-[#E11D2E] transition-all"
                placeholder="0"
              />
            </div>
            
            {/* Gordura */}
            <div>
              <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider text-center block mb-1.5">
                Gordura (g)
              </label>
              <input 
                type="number"
                value={nutrition.fats_g || ''}
                onChange={(e) => updateMacro('fats_g', e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 font-display text-2xl font-black text-white text-center focus:outline-none focus:border-[#E11D2E] transition-all"
                placeholder="0"
              />
            </div>

          </div>

          <button 
            onClick={saveMacros}
            disabled={saving}
            className="vollon-btn-primary w-full h-[52px] rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-[0_8px_24px_rgba(255,59,74,0.35)]"
          >
            <span>{saving ? 'Salvando...' : 'Atualizar Macros'}</span>
          </button>
        </div>
      </section>

    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  X, 
  Minus, 
  Plus, 
  Check, 
  ChevronRight, 
  Dumbbell, 
  Clock 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

export default function ExecutionView({ 
  workout, 
  exercises = [], 
  exerciseIndex, 
  studentId, 
  onNext, 
  onBack, 
  onLogSet, 
  showToast 
}) {
  const item = (exercises || [])[exerciseIndex]
  const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises

  const targetSets = item?.target_sets || 4
  const targetReps = item?.target_reps || 12

  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState(String(targetReps))
  const [isSaving, setIsSaving] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [finishTime, setFinishTime] = useState(null)
  const [exerciseNotes, setExerciseNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Histórico de PR
  const lastPerf = item?.lastPerformance || []
  const lastBestSet = lastPerf.length > 0 
    ? [...lastPerf].sort((a, b) => b.weight_kg - a.weight_kg)[0] 
    : null

  // Carregar notas prévias do exercício
  useEffect(() => {
    const fetchNotes = async () => {
      if (!ex?.id || !studentId) return
      try {
        const { data } = await supabase
          .from('gym_student_exercise_notes')
          .select('notes')
          .eq('student_id', studentId)
          .eq('exercise_id', ex.id)
          .maybeSingle()
        
        if (data?.notes) setExerciseNotes(data.notes)
      } catch (err) {
        console.error("Erro ao carregar anotações:", err)
      }
    }
    fetchNotes()
  }, [ex?.id, studentId])

  // Timer de descanso persistente com vibração ao finalizar
  useEffect(() => {
    let interval = null
    if (isTimerActive && finishTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((finishTime - now) / 1000))
        setRestRemaining(remaining)
        
        if (remaining === 0) {
          setIsTimerActive(false)
          setFinishTime(null)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        }
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, finishTime])

  if (!ex) return null

  const handleSaveNotes = async () => {
    if (isSavingNotes || !exerciseNotes.trim()) return
    setIsSavingNotes(true)
    try {
      const { error } = await supabase
        .from('gym_student_exercise_notes')
        .upsert({
          student_id: studentId,
          exercise_id: ex.id,
          notes: exerciseNotes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,exercise_id' })
      
      if (error) throw error
      showToast('Anotação salva com sucesso!')
    } catch (err) {
      showToast('Erro ao salvar anotação.', 'error')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const startRestTimer = () => {
    const timeStr = item?.rest_time || '60s'
    const seconds = parseInt(timeStr.replace('s', '')) || 60
    const end = Date.now() + (seconds * 1000)
    setFinishTime(end)
    setRestRemaining(seconds)
    setIsTimerActive(true)
  }

  const handleNextSet = async () => {
    // Bloqueio contra toque duplo (Bug #2)
    if (isSaving) return

    const parsedWeight = parseFloat(weight)
    const parsedReps = parseInt(reps)

    if (isNaN(parsedWeight) || isNaN(parsedReps) || parsedReps <= 0) {
      showToast('Insira carga e repetições válidas!', 'error')
      return
    }

    setIsSaving(true)
    
    try {
      // Salvar log no banco com data local
      const { error } = await supabase
        .from('gym_training_logs')
        .insert([{
          student_id: studentId,
          workout_id: workout.id,
          exercise_id: ex.id,
          set_number: currentSet,
          reps_done: parsedReps,
          weight_kg: parsedWeight,
          workout_date: getTodayLocally()
        }])

      // Só avança se salvou com sucesso no banco (Bug #1)
      if (error) {
        showToast('Erro ao gravar a série. Tente novamente.', 'error')
        setIsSaving(false)
        return
      }

      if (onLogSet) onLogSet({ weight: parsedWeight, reps: parsedReps })
      showToast(`Série ${currentSet} concluída!`)

      if (currentSet < targetSets) {
        setCurrentSet(prev => prev + 1)
        startRestTimer()
      } else {
        // Todas as séries concluídas deste exercício
        onNext()
      }
    } catch (err) {
      showToast('Falha na conexão ao salvar série.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const adjustWeight = (delta) => {
    const curr = parseFloat(weight) || 0
    const nextVal = Math.max(0, curr + delta)
    setWeight(String(nextVal))
  }

  const adjustReps = (delta) => {
    const curr = parseInt(reps) || 0
    const nextVal = Math.max(0, curr + delta)
    setReps(String(nextVal))
  }

  // Divisão do nome do exercício para visual arrojado em 2 linhas
  const nameParts = (ex.name || '').split(' ')
  const titleLine1 = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
  const titleLine2 = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')

  const totalExercises = exercises.length || 1
  const exerciseProgress = (exerciseIndex + 1) / totalExercises

  return (
    <div className="bg-[#0A0A0A] text-white min-h-dvh w-full flex flex-col font-body selection:bg-[#E11D2E]/30 relative overflow-y-auto pb-28">
      
      {/* Top Header (06-exercicio.png) */}
      <header className="sticky top-0 w-full z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#2A2A2A] px-4 pt-4 pb-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Botão Fechar Redondo */}
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nome do treino e status */}
          <div className="text-center">
            <p className="text-xs text-[#A3A3A3] font-medium">
              Dia {workout?.sequence_order || 1} · {workout?.name || 'Treino'}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span className="text-[11px] font-bold text-white tracking-wide">Treino ativo</span>
            </div>
          </div>

          {/* Mini Anel de Progresso */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#2A2A2A"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#E11D2E"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - exerciseProgress)}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute font-display text-xs font-bold text-white">
              {exerciseIndex + 1}/{totalExercises}
            </span>
          </div>

        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 pt-6 space-y-6">
        
        {/* Título do Exercício + Thumbnail Imagem */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95] bg-gradient-to-b from-white via-[#FFAAB1] to-[#FF4D5D] bg-clip-text text-transparent">
              {titleLine1}<br />{titleLine2}
            </h1>
          </div>

          {/* Miniatura Cápsula / Retângulo arredondado */}
          <div className="w-16 h-24 rounded-2xl bg-[#141414] border border-[#2A2A2A] overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            {ex?.gif_url ? (
              <img src={ex.gif_url} alt={ex.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#52525B]">
                <Dumbbell className="w-6 h-6 mb-1 text-[#FF3B4A]" />
                <span className="font-display text-[9px] uppercase font-bold text-[#A3A3A3]">IMG</span>
              </div>
            )}
          </div>
        </div>

        {/* Barras de Progresso das Séries */}
        <div>
          <div className="flex gap-2">
            {Array.from({ length: targetSets }).map((_, idx) => {
              const isPastOrCurrent = idx < currentSet
              return (
                <div 
                  key={idx} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    isPastOrCurrent ? 'bg-[#E11D2E] shadow-[0_0_8px_rgba(225,29,46,0.6)]' : 'bg-[#2A2A2A]'
                  }`}
                />
              )
            })}
          </div>
          
          <div className="flex justify-between items-center text-xs mt-3">
            <span className="font-bold text-white">
              Série {currentSet} de {targetSets}
            </span>
            <span className="text-[#A3A3A3] text-[11px]">
              Meta {targetReps} reps · Recorde {lastBestSet ? `${lastBestSet.weight_kg} kg × ${lastBestSet.reps_done}` : '--'}
            </span>
          </div>
        </div>

        {/* Controles de Carga e Repetições com Botões - e + Grandes */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Card Carga */}
          <div className="vollon-card p-4 flex flex-col items-center justify-between">
            <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2">
              CARGA (KG)
            </span>
            
            <div className="flex items-center justify-between w-full px-1 my-1">
              <button 
                type="button"
                onClick={() => adjustWeight(-2)}
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white hover:border-[#E11D2E] active:scale-90 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center px-1">
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="font-display text-4xl sm:text-5xl font-black text-white bg-transparent text-center w-full focus:outline-none focus:text-[#FF3B4A]"
                />
              </div>

              <button 
                type="button"
                onClick={() => adjustWeight(2)}
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] hover:border-[#E11D2E] active:scale-90 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Repetições */}
          <div className="vollon-card p-4 flex flex-col items-center justify-between">
            <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2">
              REPETIÇÕES
            </span>
            
            <div className="flex items-center justify-between w-full px-1 my-1">
              <button 
                type="button"
                onClick={() => adjustReps(-1)}
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white hover:border-[#E11D2E] active:scale-90 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center px-1">
                <input 
                  type="number" 
                  inputMode="numeric"
                  value={reps} 
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="font-display text-4xl sm:text-5xl font-black text-white bg-transparent text-center w-full focus:outline-none focus:text-[#FF3B4A]"
                />
              </div>

              <button 
                type="button"
                onClick={() => adjustReps(1)}
                className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] hover:border-[#E11D2E] active:scale-90 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Campo Anotação Opcional */}
        <div>
          <input 
            type="text" 
            value={exerciseNotes}
            onChange={(e) => setExerciseNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Anotação (opcional)"
            className="w-full h-12 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#E11D2E] transition-colors"
          />
        </div>

        {/* Botão Concluir Série (Pílula 60px) */}
        <button 
          onClick={handleNextSet}
          disabled={isSaving}
          className="vollon-btn-primary w-full h-[60px] rounded-full text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>{isSaving ? 'Salvando série...' : 'Concluir série'}</span>
        </button>

        {/* Card de Descanso */}
        <div className="vollon-card p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Anel de descanso */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15" 
                  fill="none" 
                  stroke="#E11D2E" 
                  strokeWidth="3" 
                  strokeDasharray={`${2 * Math.PI * 15}`}
                  strokeDashoffset={isTimerActive && finishTime ? `${(1 - (restRemaining / 60)) * 2 * Math.PI * 15}` : 0}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="font-display text-sm font-bold text-white block">
                  {restRemaining > 0 ? restRemaining : '45'}
                </span>
                <span className="text-[8px] text-[#A3A3A3] uppercase block -mt-0.5">seg</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-sm text-white">Descanso</p>
              <p className="text-xs text-[#A3A3A3]">
                {isTimerActive ? 'Descansando...' : 'Próxima série em instantes'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsTimerActive(false)
              setFinishTime(null)
              setRestRemaining(0)
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors"
          >
            PULAR
          </button>
        </div>

      </main>

      {/* Rodapé Fixo (Voltar e Próximo) */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#2A2A2A] px-5 py-3 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <button 
            onClick={onBack}
            className="flex-1 h-12 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white font-bold text-sm hover:bg-[#1A1A1A] transition-colors"
          >
            Voltar
          </button>

          <button 
            onClick={onNext}
            className="flex-1 h-12 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#FF3B4A] font-bold text-sm flex items-center justify-center gap-1 hover:bg-[#1A1A1A] transition-colors"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

    </div>
  )
}

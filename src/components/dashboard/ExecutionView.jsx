import { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  Dumbbell, 
  TrendingUp, 
  Timer, 
  CheckCircle2 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { getTodayLocally } from '../../utils/dateUtils'

export default function ExecutionView({ workout, exercises = [], exerciseIndex, studentId, onNext, onBack, onLogSet, showToast }) {
  const item = (exercises || [])[exerciseIndex]
  const ex = Array.isArray(item?.gym_exercises) ? item.gym_exercises[0] : item?.gym_exercises

  const [currentSet, setCurrentSet] = useState(1)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [finishTime, setFinishTime] = useState(null)
  const [exerciseNotes, setExerciseNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Carregar notas do exercício
  useEffect(() => {
    const fetchNotes = async () => {
      if (!ex?.id || !studentId) return
      const { data } = await supabase
        .from('gym_student_exercise_notes')
        .select('notes')
        .eq('student_id', studentId)
        .eq('exercise_id', ex.id)
        .single()
      
      if (data) setExerciseNotes(data.notes)
    }
    fetchNotes()
  }, [ex?.id, studentId])

  // Lógica do Timer Persistente
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
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, finishTime])

  if (!ex) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    const { error } = await supabase
      .from('gym_student_exercise_notes')
      .upsert({
        student_id: studentId,
        exercise_id: ex.id,
        notes: exerciseNotes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,exercise_id' })
    
    setIsSavingNotes(false)
    showToast('Anotação salva!')
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
    if (!weight || !reps) {
      showToast('Insira carga e reps!', 'error')
      return
    }

    setIsSaving(true)
    
    // Salvar log da série no Supabase
    const { error } = await supabase
      .from('gym_training_logs')
      .insert([{
        student_id: studentId,
        workout_id: workout.id,
        exercise_id: ex.id,
        set_number: currentSet,
        reps_done: parseInt(reps),
        weight_kg: parseFloat(weight),
        workout_date: getTodayLocally()
      }])

    if (!error) {
      if (onLogSet) onLogSet({ weight: parseFloat(weight), reps: parseInt(reps) })
      showToast(`Série ${currentSet} salva!`)
    }

    if (currentSet < (item?.target_sets || 1)) {
      setCurrentSet(prev => prev + 1)
      setReps('')
      startRestTimer()
    } else {
      onNext()
    }
    setIsSaving(false)
  }

  const lastPerf = item?.lastPerformance || []
  const lastBestSet = lastPerf.length > 0 ? [...lastPerf].sort((a, b) => b.weight_kg - a.weight_kg)[0] : null

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-surface-container-highest z-20">
        <div 
          className="h-full bg-primary-container transition-all duration-700 shadow-[0_0_15px_rgba(195,244,0,0.5)]" 
          style={{ width: `${((exerciseIndex) / exercises.length) * 100}%` }}
        />
      </div>

      <header className="px-gutter py-md flex justify-between items-center relative z-10">
        <button onClick={onBack} className="w-12 h-12 rounded-full glass-panel border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-90">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">Exercício {exerciseIndex + 1} de {exercises.length}</p>
          <h2 className="text-primary font-headline-md text-headline-md uppercase tracking-tight">{ex?.name}</h2>
        </div>
        <div className="w-12 h-12" />
      </header>

      <div className="flex-1 px-gutter pb-xl flex flex-col animate-in slide-in-from-bottom-12 duration-700 overflow-y-auto space-y-md">
        <div className="w-full aspect-video rounded-3xl glass-panel overflow-hidden border border-outline-variant/30 shadow-inner flex items-center justify-center group relative">
          {ex?.gif_url ? (
            <img src={ex.gif_url} className="w-full h-full object-contain p-4" />
          ) : (
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">fitness_center</span>
          )}
          
          {lastBestSet && (
            <div className="absolute bottom-3 left-3 right-3 bg-surface/80 backdrop-blur-md p-3 rounded-2xl border border-outline-variant/50 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
                <div>
                  <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest leading-none mb-1">Melhor Marca (PR)</p>
                  <p className="font-headline-md text-sm text-on-surface">{lastBestSet.weight_kg}kg <span className="text-on-surface-variant font-body-md text-xs">× {lastBestSet.reps_done}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 flex flex-col gap-6 shadow-2xl relative">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Série Atual</p>
              <p className="font-display-xl text-5xl text-on-surface">{currentSet}<span className="text-on-surface-variant font-headline-md text-2xl ml-2">/ {item?.target_sets || 1}</span></p>
            </div>
            <div className={`px-5 py-2 rounded-xl flex flex-col items-center border transition-all duration-500 ${isTimerActive ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_10px_rgba(195,244,0,0.3)]' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30'}`}>
               <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${isTimerActive ? 'animate-pulse' : ''}`}>timer</span>
                  <p className={`font-headline-md text-[12px]`}>
                    {isTimerActive ? `${restRemaining}s` : 'DESCANSO'}
                  </p>
               </div>
            </div>
          </div>

          {item?.iaSuggestion && currentSet === 1 && (
            <div className="bg-primary-container/10 border border-primary-container/20 p-5 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-500 shadow-xl">
               <div className="bg-primary-container text-on-primary-container p-2 rounded-xl mt-1 shadow-[0_0_10px_rgba(195,244,0,0.3)]">
                 <span className="material-symbols-outlined text-sm">psychology</span>
               </div>
               <div>
                 <p className="font-label-caps text-[9px] text-primary-container uppercase tracking-widest mb-1">IA Coach 2.0 (Motor de Carga)</p>
                 <p className="font-body-md text-sm text-on-surface leading-tight mb-3">{item.iaSuggestion.message}</p>
                 <button 
                   onClick={() => setWeight(item.iaSuggestion.weight.toString())} 
                   className="font-label-caps text-[10px] text-on-primary-container bg-primary-container hover:bg-surface-tint px-4 py-2 rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary-container/20 neon-glow"
                 >
                   Aplicar {item.iaSuggestion.weight}kg
                 </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-3">Carga (KG)</label>
              <input 
                type="number" 
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-surface border-2 border-outline-variant/30 rounded-2xl p-5 font-headline-lg text-3xl text-primary-container text-center outline-none focus:border-primary-container transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-3">Repetições</label>
              <input 
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="0"
                className="w-full bg-surface border-2 border-outline-variant/30 rounded-2xl p-5 font-headline-lg text-3xl text-primary-container text-center outline-none focus:border-primary-container transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Anotações de Ajuste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Anotações de Ajuste</span>
              </div>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="font-label-caps text-[10px] text-primary-container uppercase tracking-widest px-4 py-2 bg-primary-container/10 rounded-lg hover:bg-primary-container/20 transition-all"
              >
                {isSavingNotes ? '...' : 'Salvar'}
              </button>
            </div>
            <textarea 
              value={exerciseNotes}
              onChange={e => setExerciseNotes(e.target.value)}
              placeholder="Ex: Banco no 4, pegada aberta..."
              className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/50 resize-none min-h-[60px]"
            />
          </div>
        </div>

        <button 
          onClick={handleNextSet}
          disabled={isSaving}
          className="w-full bg-primary-container hover:bg-surface-tint text-on-primary-container font-headline-md py-5 rounded-2xl shadow-[0_0_20px_rgba(195,244,0,0.2)] flex items-center justify-center gap-3 active:scale-95 transition-all text-lg mt-8 disabled:opacity-50 neon-glow"
        >
          {isSaving ? 'Gravando...' : (currentSet < (item?.target_sets || 1) ? 'Concluir Série' : 'Próximo Exercício')} 
          <span className="material-symbols-outlined text-xl">check_circle</span>
        </button>
      </div>
    </div>
  )
}

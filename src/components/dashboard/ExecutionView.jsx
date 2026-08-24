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
        .maybeSingle()
      
      if (data && data.notes) setExerciseNotes(data.notes)
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
    <div className="bg-surface text-on-surface h-[100dvh] w-full flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container relative overflow-y-auto pb-[env(safe-area-inset-bottom)]">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card { background: rgba(44, 48, 52, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glow-accent { box-shadow: 0 0 20px rgba(195, 244, 0, 0.15); }
        .glow-accent-active:active { box-shadow: 0 0 30px rgba(195, 244, 0, 0.3); }
        .glow-blue { box-shadow: 0 0 20px rgba(0, 219, 233, 0.2); }
        .kinetic-input:focus { border-bottom-color: #c3f400 !important; box-shadow: 0 1px 0 0 #c3f400 !important; outline: none; }
      `}} />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-surface-container-highest">
        <div className="h-full bg-primary-container transition-all duration-500 ease-out glow-accent" style={{ width: `${((exerciseIndex) / exercises.length) * 100}%` }}></div>
      </div>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top,2.5rem)] pb-2">
        <div className="flex justify-between items-center px-gutter h-14 w-full max-w-container-max mx-auto">
          <button onClick={onBack} className="text-on-surface-variant hover:text-primary-fixed transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
          </button>
          <div className="flex flex-col items-center mt-1">
            <h1 className="font-headline-md text-headline-md text-primary-fixed tracking-tight">{workout?.name || 'VollonFit Workout'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#00dbe9] animate-pulse glow-blue"></span>
              <span className="font-data-display text-data-display text-tertiary-fixed-dim">
                {isTimerActive ? `Descanso: ${restRemaining}s` : 'Ativo'}
              </span>
            </div>
          </div>
          <button className="text-on-surface-variant hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-[28px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[calc(100px+env(safe-area-inset-top,2.5rem))] pb-32 px-gutter max-w-md mx-auto w-full flex flex-col gap-md relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-container/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
        
        {/* Active Exercise Card */}
        <section className="glass-card rounded-xl p-md flex flex-col gap-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-surface-container-highest/30 rotate-45 transform origin-center"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block mb-1">Exercício {exerciseIndex + 1} de {exercises.length}</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-black italic tracking-tighter">{ex?.name}</h2>
            </div>
            <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-fixed border border-white/5 transition-colors">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
          </div>

          {/* Set Target & PR */}
          <div className="mt-base bg-surface-container-lowest/50 rounded-lg p-sm border border-white/5 z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-data-display text-data-display text-on-surface-variant">Meta</span>
              <span className="font-data-display text-data-display text-primary">{item?.target_sets} Séries</span>
            </div>
            {lastBestSet && (
              <div className="flex flex-col gap-xs mt-3 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center opacity-75">
                  <span className="font-data-display text-[12px] text-on-surface-variant">Melhor Marca (PR)</span>
                  <span className="font-data-display text-[12px] text-on-surface">{lastBestSet.weight_kg}kg × {lastBestSet.reps_done} <span className="material-symbols-outlined text-[14px] align-middle text-primary-fixed ml-1">check_circle</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Current Set Inputs */}
          <div className="mt-sm z-10">
            <div className="flex items-center gap-sm mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-[14px] glow-accent">
                  {currentSet}
              </div>
              <span className="font-headline-md text-[16px] text-primary">Série Atual</span>
            </div>
            
            <div className="flex gap-sm">
              <div className="flex-1 relative">
                <label className="absolute top-2 left-3 font-label-caps text-[10px] text-on-surface-variant z-10">CARGA (KG)</label>
                <input 
                  className="kinetic-input w-full h-16 bg-surface-container-lowest border-0 border-b-2 border-surface-container-highest rounded-t-lg text-primary font-data-display text-headline-md pt-6 px-3 text-center focus:ring-0 transition-colors" 
                  inputMode="decimal" 
                  type="number" 
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex-1 relative">
                <label className="absolute top-2 left-3 font-label-caps text-[10px] text-on-surface-variant z-10">REPETIÇÕES</label>
                <input 
                  className="kinetic-input w-full h-16 bg-surface-container-lowest border-0 border-b-2 border-surface-container-highest rounded-t-lg text-primary font-data-display text-headline-md pt-6 px-3 text-center focus:ring-0 transition-colors" 
                  inputMode="numeric" 
                  type="number" 
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Notes */}
            <div className="mt-sm w-full relative">
               <label className="absolute top-2 left-3 font-label-caps text-[10px] text-on-surface-variant z-10">ANOTAÇÕES (OPCIONAL)</label>
               <input 
                  className="kinetic-input w-full h-16 bg-surface-container-lowest border-0 border-b-2 border-surface-container-highest rounded-t-lg text-primary font-body-md pt-6 px-3 focus:ring-0 transition-colors" 
                  type="text" 
                  value={exerciseNotes}
                  onChange={e => setExerciseNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Adicionar nota..."
                />
            </div>
          </div>

          <button 
            onClick={handleNextSet}
            disabled={isSaving}
            className="w-full h-14 mt-sm bg-primary-container text-[#161e00] font-headline-md text-[16px] rounded-lg glow-accent hover:glow-accent-active active:scale-[0.98] transition-all flex items-center justify-center gap-2 z-10 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
            {isSaving ? 'GRAVANDO...' : 'CONCLUIR SÉRIE'}
          </button>
        </section>

        {/* Image Placeholder */}
        {ex?.gif_url && (
          <div className="h-64 rounded-xl overflow-hidden relative border border-white/5 bg-surface-container-lowest flex items-center justify-center p-2">
            <img src={ex.gif_url} className="w-full h-full object-contain rounded-lg mix-blend-screen" alt="Exercício" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 bg-surface/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">play_circle</span>
              <span className="font-label-caps text-[10px] text-primary tracking-wider">TUTORIAL</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container/90 backdrop-blur-lg border-t border-white/5 px-gutter py-sm pb-6 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center gap-sm">
          <button onClick={onBack} className="flex-1 h-12 rounded-lg border-2 border-surface-container-highest text-on-surface-variant font-label-caps flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors active:scale-95">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            VOLTAR
          </button>
          <button onClick={onNext} className="flex-[2] h-12 rounded-lg bg-surface-container-highest text-primary font-headline-md text-[14px] flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors active:scale-95 shadow-lg border border-white/10">
            PRÓXIMO EXERCÍCIO
            <span className="material-symbols-outlined text-[18px] text-primary-fixed">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}

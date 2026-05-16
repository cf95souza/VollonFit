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
    <div className="min-h-screen bg-black flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-20">
        <div 
          className="h-full bg-primary transition-all duration-700 shadow-[0_0_15px_#DFFF5E]" 
          style={{ width: `${((exerciseIndex) / exercises.length) * 100}%` }}
        />
      </div>

      <header className="px-6 py-8 flex justify-between items-center relative z-10">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Exercício {exerciseIndex + 1} de {exercises.length}</p>
          <h2 className="text-white font-black text-lg font-display leading-tight uppercase tracking-tight">{ex?.name}</h2>
        </div>
        <div className="w-12 h-12" />
      </header>

      <div className="flex-1 px-6 pb-10 flex flex-col animate-in slide-in-from-bottom-12 duration-700 overflow-y-auto space-y-8">
        <div className="w-full aspect-video rounded-[32px] bg-[#1A1A1A] overflow-hidden border border-white/5 shadow-inner flex items-center justify-center group relative">
          {ex?.gif_url ? (
            <img src={ex.gif_url} className="w-full h-full object-contain p-4" />
          ) : (
            <Dumbbell className="w-16 h-16 text-white/10" />
          )}
          
          {lastBestSet && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Melhor Marca (PR)</p>
                  <p className="text-sm font-black text-white">{lastBestSet.weight_kg}kg <span className="text-slate-500 font-bold">× {lastBestSet.reps_done}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 flex flex-col gap-8 shadow-2xl relative">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Série Atual</p>
              <p className="text-5xl font-black text-white font-display">{currentSet}<span className="text-slate-700 text-2xl font-normal ml-2">/ {item?.target_sets || 1}</span></p>
            </div>
            <div className={`px-6 py-3 rounded-full flex flex-col items-center border transition-all duration-500 ${isTimerActive ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10'}`}>
               <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${isTimerActive ? 'animate-pulse' : 'text-slate-500'}`} />
                  <p className={`text-sm font-black font-display`}>
                    {isTimerActive ? `${restRemaining}s` : 'DESCANSO'}
                  </p>
               </div>
            </div>
          </div>

          {item?.iaSuggestion && currentSet === 1 && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 shadow-lg">
               <div className="bg-primary text-black p-2.5 rounded-xl mt-1 shadow-[0_0_15px_rgba(223,255,94,0.3)]">
                 <TrendingUp className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">IA Coach Intelligence</p>
                 <p className="text-sm font-bold text-slate-200 leading-tight mb-3">Notamos que você atingiu a meta de repetições com facilidade na última vez. Que tal subir para <span className="text-primary font-black">{item.iaSuggestion.weight}kg</span>?</p>
                 <button 
                   onClick={() => setWeight(item.iaSuggestion.weight.toString())} 
                   className="text-[10px] font-black text-black bg-primary hover:bg-primary-dark px-4 py-2 rounded-full uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20"
                 >
                   Aplicar {item.iaSuggestion.weight}kg
                 </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Carga (KG)</label>
              <input 
                type="number" 
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 text-2xl font-black text-primary text-center outline-none focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Repetições</label>
              <input 
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="0"
                className="w-full bg-black border-2 border-white/5 rounded-3xl p-6 text-2xl font-black text-primary text-center outline-none focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Anotações de Ajuste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotações de Ajuste</span>
              </div>
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-[10px] font-black text-primary uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-full hover:bg-primary/10 transition-all"
              >
                {isSavingNotes ? '...' : 'Salvar'}
              </button>
            </div>
            <textarea 
              value={exerciseNotes}
              onChange={e => setExerciseNotes(e.target.value)}
              placeholder="Ex: Banco no 4, pegada aberta..."
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm font-medium text-slate-300 focus:outline-none focus:border-primary/30 placeholder:text-slate-600 resize-none min-h-[60px]"
            />
          </div>
        </div>

        <button 
          onClick={handleNextSet}
          disabled={isSaving}
          className="w-full fitness-gradient hover:opacity-90 text-white font-black py-7 rounded-[32px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all text-xl mt-12 disabled:opacity-50 neon-shadow"
        >
          {isSaving ? 'Gravando...' : (currentSet < (item?.target_sets || 1) ? 'Concluir Série' : 'Próximo Exercício')} 
          <CheckCircle2 className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

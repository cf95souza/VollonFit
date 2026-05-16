import React, { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  TrendingUp, 
  Activity, 
  Scale, 
  ClipboardList, 
  Dumbbell, 
  History, 
  X, 
  Timer 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

export default function StudentDetailView({ student, onBack, showToast }) {
  const [workouts, setWorkouts] = useState([])
  const [bioRecords, setBioRecords] = useState([])
  const [goals, setGoals] = useState(student?.goals || '')
  const [loading, setLoading] = useState(true)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [currentSubTab, setCurrentSubTab] = useState('overview') 
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState(null)
  const [workoutItems, setWorkoutItems] = useState([])
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!student?.id) return
      setLoading(true)
      const { data: woData } = await supabase.from('gym_workouts').select('*').eq('student_id', student.id).order('sequence_order', { ascending: true })
      if (woData) setWorkouts(woData)
      
      const { data: bioData } = await supabase.from('gym_biopedance_records').select('*').eq('student_id', student.id).order('record_date', { ascending: true })
      if (bioData) setBioRecords(bioData)

      try {
        const { data: stuData } = await supabase.from('gym_students').select('goals').eq('id', student.id).single()
        if (stuData) setGoals(stuData.goals || '')
      } catch (e) {
        console.warn('Erro na busca de goals:', e)
      }
      
      setLoading(false)
    }
    fetchData()
  }, [student.id])

  const handleSaveGoals = async () => {
    if (!student?.id) {
      showToast('Erro: ID do aluno não encontrado.', 'error');
      return;
    }

    setIsSavingGoals(true)
    try {
      const { error } = await supabase
        .from('gym_students')
        .update({ goals: goals })
        .eq('id', student.id)

      if (error) {
        showToast('Erro ao salvar metas: ' + error.message, 'error')
      } else {
        showToast('Metas atualizadas com sucesso!')
      }
    } catch (err) {
      showToast('Ocorreu um erro inesperado ao salvar.', 'error')
    } finally {
      setIsSavingGoals(false)
    }
  }

  const handleViewWorkoutDetail = async (workout) => {
    setSelectedWorkoutDetail(workout)
    setIsWorkoutModalOpen(true)
    setLoadingItems(true)
    
    const { data } = await supabase
      .from('gym_workout_items')
      .select('*, gym_exercises(*)')
      .eq('workout_id', workout.id)
      .order('sequence_order')
    
    if (data) setWorkoutItems(data)
    setLoadingItems(false)
  }

  const handleMoveWorkout = async (index, direction) => {
    const newWorkouts = [...workouts]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newWorkouts.length) return

    const temp = newWorkouts[index]
    newWorkouts[index] = newWorkouts[targetIndex]
    newWorkouts[targetIndex] = temp

    setWorkouts(newWorkouts)

    const updates = newWorkouts.map((w, idx) => ({
      id: w.id,
      sequence_order: idx
    }))

    for (const update of updates) {
      await supabase.from('gym_workouts').update({ sequence_order: update.sequence_order }).eq('id', update.id)
    }
    
    showToast('Ordem atualizada!')
  }

  const chartData = (bioRecords || []).map(r => ({
    date: r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
    weight: r.weight || 0,
    fat: r.body_fat_pct || 0,
    muscle: r.muscle_mass_kg || 0
  }))

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm">
        <ChevronLeft className="w-4 h-4" /> Voltar para Alunos
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#111111] p-6 sm:p-8 rounded-3xl border border-white/5 shadow-sm gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary">
            {student?.name?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-white truncate max-w-[200px] sm:max-w-none">{student?.name || 'Aluno'}</h2>
            <p className="text-sm text-slate-400">@{student?.username || 'usuario'}</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto bg-black/50 p-1 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
          {['overview', 'workouts', 'evolution'].map(tab => (
            <button 
              key={tab}
              onClick={() => setCurrentSubTab(tab)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${currentSubTab === tab ? 'bg-primary text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'overview' ? 'Visão Geral' : tab === 'workouts' ? 'Treinos' : 'Evolução'}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Evolução Recente
                </h3>
                {bioRecords.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111', color: '#fff'}} />
                        <Area type="monotone" dataKey="weight" stroke="#DFFF5E" fill="#DFFF5E" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-20 text-slate-400 italic">Nenhum dado de biopedância registrado.</p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0F172A] border border-white/5 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <Activity className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Status Atual</h4>
                {bioRecords.length > 0 ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">Peso Total</span>
                      <span className="text-3xl font-black">{bioRecords[bioRecords.length-1]?.weight || 0}kg</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">% Gordura</span>
                      <span className="text-3xl font-black text-rose-400">{bioRecords[bioRecords.length-1]?.body_fat_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400 text-xs font-medium">Massa Magra</span>
                      <span className="text-3xl font-black text-emerald-400">{bioRecords[bioRecords.length-1]?.muscle_mass_kg || 0}kg</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center relative z-10">
                    <Scale className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm italic">Aguardando biopedância.</p>
                  </div>
                )}
              </div>

              <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm">
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Metas do Professor</h4>
                <div className="space-y-4">
                  <textarea 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Defina metas para o aluno..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-primary/50 transition-all min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={handleSaveGoals}
                    disabled={isSavingGoals}
                    className="w-full bg-primary/10 text-primary font-bold py-3 rounded-xl text-xs hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                  >
                    {isSavingGoals ? 'Salvando...' : 'Atualizar Metas'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSubTab === 'workouts' && (
          <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Treinos do Aluno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((w, idx) => (
                <div key={w.id} className="relative group">
                  <button 
                    onClick={() => handleViewWorkoutDetail(w)}
                    className="w-full p-6 bg-white/5 rounded-[32px] border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm text-left active:scale-95 relative overflow-hidden"
                  >
                    <div className="mb-6 pr-24">
                      <p className="font-bold text-white text-xl mb-1 group-hover:text-primary transition-colors line-clamp-2">{w.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Criado em {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Ver Exercícios</span>
                      <Dumbbell className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                    </div>
                  </button>

                  <div className="absolute top-6 right-6 flex gap-1 z-20">
                    <button 
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'up'); }}
                      className="p-2.5 bg-black/60 rounded-xl text-primary hover:bg-primary hover:text-black disabled:opacity-20 border border-white/10 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-4 h-4 rotate-90" />
                    </button>
                    <button 
                      disabled={idx === workouts.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'down'); }}
                      className="p-2.5 bg-black/60 rounded-xl text-primary hover:bg-primary hover:text-black disabled:opacity-20 border border-white/10 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
              {workouts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-[#111111] rounded-3xl border-2 border-dashed border-white/5">
                  <p className="text-slate-400 italic">Nenhum treino criado ainda.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentSubTab === 'evolution' && (
          <div className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Histórico de Evolução
            </h3>
            <div className="space-y-4">
              {bioRecords.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/5 group hover:bg-white/10 hover:border-white/10 hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-black/50 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-white/5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(r.record_date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      <p className="text-lg font-black text-white">{new Date(r.record_date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary text-lg">{r.weight}kg</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Gordura: <b className="text-white">{r.body_fat_pct}%</b></span>
                        <span className="text-[10px] text-slate-400 font-medium">Músculo: <b className="text-white">{r.muscle_mass_kg}kg</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {bioRecords.length === 0 && (
                <p className="text-center py-20 text-slate-400 italic">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {isWorkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedWorkoutDetail?.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lista de Exercícios</p>
              </div>
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingItems ? (
                <div className="py-20 text-center">
                  <Activity className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Itens...</p>
                </div>
              ) : (
                workoutItems.map((item, idx) => {
                  const ex = Array.isArray(item.gym_exercises) ? item.gym_exercises[0] : item.gym_exercises
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 group">
                      <div className="w-14 h-14 rounded-2xl bg-black/50 flex items-center justify-center overflow-hidden border border-white/5">
                        {ex?.gif_url ? (
                          <img src={ex.gif_url} className="w-full h-full object-cover" />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{ex?.name || 'Exercício'}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase">{item.target_sets} Sets</span>
                          <span className="text-[10px] font-bold text-[#C6C4FF] bg-[#C6C4FF]/10 px-2 py-0.5 rounded-md uppercase">{item.target_reps} Reps</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            <div className="p-8 bg-black/50 border-t border-white/5">
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="w-full bg-primary text-black font-bold py-4 rounded-2xl hover:bg-primary-dark transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

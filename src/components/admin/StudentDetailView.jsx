import React, { useState, useEffect } from 'react'
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
  const themeColor = localStorage.getItem('vollonfit_theme_color') || '#DFFF5E';
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
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary-container transition-colors font-label-caps text-[10px] uppercase tracking-widest">
        <span className="material-symbols-outlined text-lg">chevron_left</span> Voltar para Alunos
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between glass-panel p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-container/10 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-display-lg text-primary-container">
            {student?.name?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-display-xl text-on-surface truncate max-w-[200px] sm:max-w-none">{student?.name || 'Aluno'}</h2>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mt-1">@{student?.username || 'usuario'}</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto bg-surface-container p-1 rounded-2xl border border-outline-variant/30 overflow-x-auto custom-scrollbar">
          {['overview', 'workouts', 'evolution'].map(tab => (
            <button 
              key={tab}
              onClick={() => setCurrentSubTab(tab)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-label-caps text-[10px] sm:text-xs transition-all whitespace-nowrap uppercase tracking-widest ${currentSubTab === tab ? 'bg-primary-container text-on-primary-container shadow-sm neon-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
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
              <section className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                <h3 className="font-headline-lg text-lg text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">trending_up</span> Evolução Recente
                </h3>
                {bioRecords.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111', color: '#fff'}} />
                        <Area type="monotone" dataKey="weight" stroke={themeColor} fill={themeColor} fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-20 font-body-md text-on-surface-variant italic">Nenhum dado de biopedância registrado.</p>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <div className="glass-panel bg-surface-container-highest border border-outline-variant/30 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                <span className="material-symbols-outlined absolute -right-4 -top-4 text-9xl text-on-surface-variant/10 rotate-12 group-hover:scale-110 transition-transform duration-700">monitor_heart</span>
                <h4 className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-[0.2em] mb-8">Status Atual</h4>
                {bioRecords.length > 0 ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider">Peso Total</span>
                      <span className="font-display-lg text-3xl text-on-surface">{bioRecords[bioRecords.length-1]?.weight || 0}kg</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider">% Gordura</span>
                      <span className="font-display-lg text-3xl text-error">{bioRecords[bioRecords.length-1]?.body_fat_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider">Massa Magra</span>
                      <span className="font-display-lg text-3xl text-primary-container">{bioRecords[bioRecords.length-1]?.muscle_mass_kg || 0}kg</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center relative z-10">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mx-auto mb-4 block">monitor_weight</span>
                    <p className="font-body-md text-on-surface-variant italic">Aguardando biopedância.</p>
                  </div>
                )}
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
                <h4 className="font-label-caps text-on-surface-variant text-[10px] uppercase tracking-widest mb-4">Metas do Professor</h4>
                <div className="space-y-4">
                  <textarea 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Defina metas para o aluno..."
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 font-body-md text-sm text-on-surface outline-none focus:border-primary-container transition-all min-h-[120px] resize-none"
                  />
                  <button 
                    onClick={handleSaveGoals}
                    disabled={isSavingGoals}
                    className="w-full bg-primary-container/10 text-primary-container font-label-caps py-3 rounded-xl text-xs hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 uppercase tracking-widest"
                  >
                    {isSavingGoals ? 'Salvando...' : 'Atualizar Metas'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSubTab === 'workouts' && (
          <section className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="font-headline-lg text-lg text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">assignment</span> Treinos do Aluno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((w, idx) => (
                <div key={w.id} className="relative group">
                  <button 
                    onClick={() => handleViewWorkoutDetail(w)}
                    className="w-full p-6 bg-surface rounded-3xl border border-outline-variant/30 flex flex-col justify-between hover:border-primary-container/30 transition-all shadow-sm text-left active:scale-95 relative overflow-hidden"
                  >
                    <div className="mb-6 pr-24">
                      <p className="font-headline-md text-on-surface text-xl mb-1 group-hover:text-primary-container transition-colors line-clamp-2">{w.name}</p>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Criado em {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-[10px] text-primary-container bg-primary-container/10 px-3 py-1.5 rounded-full uppercase">Ver Exercícios</span>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">fitness_center</span>
                    </div>
                  </button>

                  <div className="absolute top-6 right-6 flex gap-1 z-20">
                    <button 
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'up'); }}
                      className="p-2 bg-surface-container/80 rounded-xl text-primary-container hover:bg-primary-container hover:text-on-primary-container disabled:opacity-20 border border-outline-variant/30 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined text-lg">expand_less</span>
                    </button>
                    <button 
                      disabled={idx === workouts.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMoveWorkout(idx, 'down'); }}
                      className="p-2 bg-surface-container/80 rounded-xl text-primary-container hover:bg-primary-container hover:text-on-primary-container disabled:opacity-20 border border-outline-variant/30 shadow-lg transition-all backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                  </div>
                </div>
              ))}
              {workouts.length === 0 && (
                <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-2 border-dashed border-outline-variant/30">
                  <p className="font-body-md text-on-surface-variant italic">Nenhum treino criado ainda.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentSubTab === 'evolution' && (
          <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-sm animate-in slide-in-from-right-4 duration-300">
            <h3 className="font-headline-lg text-lg text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">history</span> Histórico de Evolução
            </h3>
            <div className="space-y-4">
              {bioRecords.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-surface rounded-3xl border border-outline-variant/30 group hover:bg-surface-container hover:border-outline-variant/50 hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-surface-container w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-outline-variant/30">
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">{new Date(r.record_date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      <p className="font-display-lg text-lg text-on-surface">{new Date(r.record_date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-display-lg text-primary-container text-lg">{r.weight}kg</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Gordura: <b className="text-on-surface">{r.body_fat_pct}%</b></span>
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Músculo: <b className="text-on-surface">{r.muscle_mass_kg}kg</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {bioRecords.length === 0 && (
                <p className="text-center py-20 font-body-md text-on-surface-variant italic">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {isWorkoutModalOpen && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-outline-variant/30 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-highest">
              <div>
                <h3 className="font-display-xl text-2xl text-on-surface">{selectedWorkoutDetail?.name}</h3>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Lista de Exercícios</p>
              </div>
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-3 bg-surface-container rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingItems ? (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-4xl text-primary-container animate-spin mx-auto mb-4 block">sync</span>
                  <p className="font-label-caps text-on-surface-variant text-xs uppercase tracking-widest">Carregando Itens...</p>
                </div>
              ) : (
                workoutItems.map((item, idx) => {
                  const ex = Array.isArray(item.gym_exercises) ? item.gym_exercises[0] : item.gym_exercises
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-surface rounded-3xl border border-outline-variant/30 group hover:border-primary-container/30 transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
                        {ex?.gif_url ? (
                          <img src={ex.gif_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">fitness_center</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-headline-md text-sm text-on-surface">{ex?.name || 'Exercício'}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="font-label-caps text-[10px] text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.target_sets} Sets</span>
                          <span className="font-label-caps text-[10px] text-[#C6C4FF] bg-[#C6C4FF]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.target_reps} Reps</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            <div className="p-8 bg-surface-container-highest border-t border-outline-variant/30">
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="w-full bg-primary-container text-on-primary-container font-label-caps py-4 rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest neon-glow"
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

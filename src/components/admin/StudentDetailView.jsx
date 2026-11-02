import React, { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  Save, 
  Dumbbell, 
  Activity, 
  Flame, 
  Trophy, 
  Target, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  X, 
  Loader2,
  Calendar,
  Layers,
  Sparkles
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
      const { data: woData } = await supabase
        .from('gym_workouts')
        .select('*')
        .eq('student_id', student.id)
        .order('sequence_order', { ascending: true })
      if (woData) setWorkouts(woData)
      
      const { data: bioData } = await supabase
        .from('gym_biopedance_records')
        .select('*')
        .eq('student_id', student.id)
        .order('record_date', { ascending: true })
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
      showToast('Erro: ID do aluno não encontrado.', 'error')
      return
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
        showToast('Metas do aluno atualizadas com sucesso! 🔥')
      }
    } catch (err) {
      showToast('Ocorreu um erro ao salvar.', 'error')
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
      sequence_order: idx + 1
    }))

    for (const item of updates) {
      await supabase.from('gym_workouts').update({ sequence_order: item.sequence_order }).eq('id', item.id)
    }
    showToast('Ordem das rotinas atualizada!')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Header com Botão Voltar */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-white hover:border-[#E11D2E] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
                {student.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 text-[9px] font-bold text-[#FF3B4A] uppercase">
                Ativo
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              @{student.username} · {workouts.length} rotinas cadastradas
            </p>
          </div>
        </div>

        {/* Alternador de Sub-Abas */}
        <div className="flex gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] p-1.5 rounded-2xl">
          <button
            onClick={() => setCurrentSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentSubTab === 'overview' ? 'bg-[#E11D2E] text-white shadow-sm' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setCurrentSubTab('workouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentSubTab === 'workouts' ? 'bg-[#E11D2E] text-white shadow-sm' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Rotinas
          </button>
          <button
            onClick={() => setCurrentSubTab('biopedance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentSubTab === 'biopedance' ? 'bg-[#E11D2E] text-white shadow-sm' : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Bioimpedância
          </button>
        </div>
      </div>

      {/* SUB-ABA 1: VISÃO GERAL & METAS */}
      {currentSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Metas e Foco do Treinador */}
          <div className="lg:col-span-7 vollon-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#2A2A2A]">
              <Target className="w-5 h-5 text-[#FF3B4A]" />
              <div>
                <h3 className="font-display text-xl font-black uppercase text-white tracking-tight">
                  Metas & Prescrição Nutricional
                </h3>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">
                  Visível no topo do app do aluno
                </p>
              </div>
            </div>

            <textarea 
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="Ex: Foco em hipertrofia dos membros superiores, manter déficit calórico moderado de 300 kcal..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors h-36 resize-none leading-relaxed"
            />

            <button 
              onClick={handleSaveGoals}
              disabled={isSavingGoals}
              className="vollon-btn-primary px-6 h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.35)]"
            >
              {isSavingGoals ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Metas do Aluno</span>
            </button>
          </div>

          {/* Dados Biométricos Rápidos */}
          <div className="lg:col-span-5 vollon-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="font-display text-xl font-black uppercase text-white tracking-tight pb-3 border-b border-[#2A2A2A]">
              Perfil Biométrico
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
                <span className="text-xs text-[#A3A3A3] font-bold uppercase">Idade</span>
                <span className="font-display text-xl font-black text-white">{student.age || '—'} anos</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
                <span className="text-xs text-[#A3A3A3] font-bold uppercase">Altura</span>
                <span className="font-display text-xl font-black text-white">{student.height ? `${student.height} m` : '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
                <span className="text-xs text-[#A3A3A3] font-bold uppercase">Peso Inicial</span>
                <span className="font-display text-xl font-black text-[#FF3B4A]">{student.initial_weight ? `${student.initial_weight} kg` : '—'}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-ABA 2: ROTINAS CADASTRADAS */}
      {currentSubTab === 'workouts' && (
        <div className="vollon-card p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
            <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
              Ordem das Rotinas de Treino
            </h3>
            <span className="text-xs text-[#A3A3A3] font-bold uppercase">
              Use as setas para definir a ordem no app do aluno
            </span>
          </div>

          <div className="space-y-3">
            {workouts.map((w, idx) => (
              <div 
                key={w.id} 
                className="p-4 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-sm text-white">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{w.name}</h4>
                    <p className="text-xs text-[#A3A3A3]">{w.description || 'Rotina sem descrição'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleViewWorkoutDetail(w)}
                    className="vollon-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FF3B4A]" />
                    <span>Exercícios</span>
                  </button>

                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleMoveWorkout(idx, 'up')}
                      disabled={idx === 0}
                      className="w-6 h-5 rounded bg-[#141414] hover:bg-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleMoveWorkout(idx, 'down')}
                      disabled={idx === workouts.length - 1}
                      className="w-6 h-5 rounded bg-[#141414] hover:bg-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {workouts.length === 0 && (
              <p className="text-center py-10 text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
                Nenhuma rotina cadastrada para este aluno.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SUB-ABA 3: GRÁFICO DE BIOIMPEDÂNCIA */}
      {currentSubTab === 'biopedance' && (
        <div className="vollon-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                Evolução de Peso Corporal (kg)
              </h3>
              <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                Histórico de medições
              </p>
            </div>
            <span className="text-xs font-display font-black text-[#FF3B4A]">
              {bioRecords.length} medições
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bioRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D2E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E11D2E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="record_date" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '16px' }}
                  itemStyle={{ color: '#FF3B4A', fontWeight: 900 }}
                  formatter={(val) => [`${val} kg`, 'Peso']}
                />
                <Area type="monotone" dataKey="weight" stroke="#FF3B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modal Detalhes dos Exercícios do Treino */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[85vh] flex flex-col border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-[#2A2A2A] pb-3">
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  {selectedWorkoutDetail?.name}
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  {workoutItems.length} exercícios na rotina
                </p>
              </div>
              <button 
                onClick={() => setIsWorkoutModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingItems ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
                </div>
              ) : (
                workoutItems.map((item, idx) => (
                  <div key={item.id} className="p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#141414] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-xs text-white">
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="font-bold text-xs text-white">
                          {item.gym_exercises?.name || 'Exercício'}
                        </h5>
                        <p className="text-[10px] text-[#A3A3A3]">
                          {item.target_sets || 4} séries · {item.target_reps || '12'} reps · {item.rest_time || '60s'} descanso
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Flame, 
  Copy,
  ChevronRight,
  User,
  ArrowRight
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function WorkoutsTab({ showToast, searchTerm, teacherInfo }) {
  const [students, setStudents] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentWorkouts, setStudentWorkouts] = useState([])
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [workoutItems, setWorkoutItems] = useState([]) 
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos')

  // Templates Rápidos de Treinos para economizar tempo do professor
  const workoutPresets = [
    {
      name: 'Treino A - Peito & Tríceps',
      description: 'Foco em força e hipertrofia de empurrar',
      keywords: ['supino', 'crucifixo', 'tríceps', 'triceps', 'cross']
    },
    {
      name: 'Treino B - Costas & Bíceps',
      description: 'Foco em densidade dorsal e puxadas',
      keywords: ['puxada', 'remada', 'pulldown', 'bíceps', 'biceps', 'rosca']
    },
    {
      name: 'Treino C - Pernas Completo',
      description: 'Membros inferiores e estabilidade',
      keywords: ['agachamento', 'leg press', 'extensora', 'flexora', 'panturrilha']
    },
    {
      name: 'Treino D - Ombros & Abdômen',
      description: 'Deltoides 3D e fortalecimento de core',
      keywords: ['desenvolvimento', 'elevação', 'elevacao', 'abdominal', 'prancha']
    }
  ]

  const fetchData = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('gym_students')
      .select('id, name')
      .eq('teacher_id', teacherInfo.id)
      .order('name')
    if (!error) setStudents(data || [])
    
    const { data: exData } = await supabase
      .from('gym_exercises')
      .select('id, name, category, gif_url')
      .order('name')
    if (exData) setExercises(exData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [teacherInfo?.id])

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentWorkouts()
    } else {
      setStudentWorkouts([])
    }
  }, [selectedStudent])

  const fetchStudentWorkouts = async () => {
    const { data, error } = await supabase
      .from('gym_workouts')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
    
    if (!error) setStudentWorkouts(data || [])
  }

  const loadWorkoutForEdit = async (workout) => {
    setLoading(true)
    setEditingWorkoutId(workout.id)
    setWorkoutName(workout.name)
    setWorkoutDescription(workout.description || '')
    
    const { data, error } = await supabase
      .from('gym_workout_items')
      .select('*, gym_exercises(name, category, gif_url)')
      .eq('workout_id', workout.id)
      .order('sequence_order')

    if (!error && data) {
      setWorkoutItems(data.map(item => ({
        id: item.id,
        exercise_id: item.exercise_id,
        target_sets: item.target_sets || 4,
        target_reps: item.target_reps || '12',
        rest_time: item.rest_time || '60s'
      })))
    }
    setLoading(false)
  }

  // Aplicar Template Rápido
  const applyPreset = (preset) => {
    setWorkoutName(preset.name)
    setWorkoutDescription(preset.description)

    // Encontrar até 5 exercícios correspondentes no acervo
    const matched = []
    preset.keywords.forEach(keyword => {
      const found = exercises.find(ex => 
        ex.name.toLowerCase().includes(keyword) && !matched.some(m => m.id === ex.id)
      )
      if (found && matched.length < 5) {
        matched.push(found)
      }
    })

    if (matched.length > 0) {
      setWorkoutItems(matched.map(ex => ({
        exercise_id: ex.id,
        target_sets: 4,
        target_reps: '10 a 12',
        rest_time: '60s'
      })))
      showToast(`Template "${preset.name}" carregado com ${matched.length} exercícios! 🔥`)
    } else {
      showToast(`Template "${preset.name}" selecionado! Adicione os exercícios abaixo.`)
    }
  }

  const handleSaveWorkout = async () => {
    if (!selectedStudent || !workoutName.trim() || workoutItems.length === 0) {
      showToast('Preencha o nome do treino e adicione ao menos 1 exercício.', 'error')
      return
    }

    // Verificar se todos os itens têm exercício selecionado
    const hasEmptyExercise = workoutItems.some(i => !i.exercise_id)
    if (hasEmptyExercise) {
      showToast('Por favor, selecione todos os exercícios da lista.', 'error')
      return
    }

    setIsSaving(true)
    let workoutId = editingWorkoutId

    if (editingWorkoutId) {
      await supabase.from('gym_workouts').update({ 
        name: workoutName,
        description: workoutDescription 
      }).eq('id', editingWorkoutId)
      await supabase.from('gym_workout_items').delete().eq('workout_id', editingWorkoutId)
    } else {
      const { data, error } = await supabase
        .from('gym_workouts')
        .insert([{ 
          name: workoutName, 
          description: workoutDescription,
          student_id: selectedStudent, 
          teacher_id: teacherInfo.id 
        }])
        .select().single()
      
      if (error) { 
        showToast('Erro ao criar treino: ' + error.message, 'error')
        setIsSaving(false)
        return
      }
      workoutId = data.id
    }

    const itemsToInsert = workoutItems.map((item, index) => ({
      workout_id: workoutId,
      exercise_id: item.exercise_id,
      sequence_order: index + 1,
      target_sets: parseInt(item.target_sets) || 4,
      target_reps: item.target_reps || '12',
      rest_time: item.rest_time || '60s'
    }))

    const { error: itemsError } = await supabase.from('gym_workout_items').insert(itemsToInsert)

    if (itemsError) {
      showToast('Erro ao salvar exercícios: ' + itemsError.message, 'error')
    } else {
      showToast(editingWorkoutId ? 'Treino atualizado com sucesso!' : 'Treino criado com sucesso! 🔥')
      resetForm()
      fetchStudentWorkouts()
    }
    setIsSaving(false)
  }

  const handleDeleteWorkout = async () => {
    if (!editingWorkoutId) return
    setIsDeleting(true)

    await supabase.from('gym_training_logs').delete().eq('workout_id', editingWorkoutId)
    await supabase.from('gym_workout_items').delete().eq('workout_id', editingWorkoutId)
    
    const { error } = await supabase.from('gym_workouts').delete().eq('id', editingWorkoutId)
    
    if (error) {
      showToast('Erro ao excluir treino: ' + error.message, 'error')
    } else {
      showToast('Treino excluído com sucesso!')
      resetForm()
      fetchStudentWorkouts()
      setDeleteModalOpen(false)
    }
    setIsDeleting(false)
  }

  const resetForm = () => {
    setEditingWorkoutId(null)
    setWorkoutName('')
    setWorkoutDescription('')
    setWorkoutItems([])
  }

  const addExercise = () => {
    setWorkoutItems([
      ...workoutItems, 
      { exercise_id: '', target_sets: 4, target_reps: '12', rest_time: '60s' }
    ])
  }

  const removeExercise = (index) => {
    setWorkoutItems(workoutItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...workoutItems]
    newItems[index][field] = value
    setWorkoutItems(newItems)
  }

  // Reordenação de exercícios (Subir na sequência)
  const moveUp = (index) => {
    if (index === 0) return
    const newItems = [...workoutItems]
    const temp = newItems[index - 1]
    newItems[index - 1] = newItems[index]
    newItems[index] = temp
    setWorkoutItems(newItems)
  }

  // Reordenação de exercícios (Descer na sequência)
  const moveDown = (index) => {
    if (index === workoutItems.length - 1) return
    const newItems = [...workoutItems]
    const temp = newItems[index + 1]
    newItems[index + 1] = newItems[index]
    newItems[index] = temp
    setWorkoutItems(newItems)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Métricas do Treino em Construção
  const totalSets = workoutItems.reduce((acc, i) => acc + (parseInt(i.target_sets) || 0), 0)
  const estimatedMinutes = Math.round(totalSets * 2.5)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Top Banner Informativo */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Construtor de Treinos
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Prescreva rotinas personalizadas com templates rápidos, ordem dinâmica e controle de descanso
          </p>
        </div>
        {selectedStudent && (
          <button 
            onClick={resetForm} 
            className="vollon-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#FF3B4A]" />
            <span>Criar Nova Rotina</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Seleção de Aluno & Rotinas Salvas (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Selecionar Aluno */}
          <div className="vollon-card p-6 rounded-3xl space-y-3">
            <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
              1. Selecione o Aluno
            </label>
            <div className="relative">
              <select 
                value={selectedStudent}
                onChange={e => { setSelectedStudent(e.target.value); resetForm(); }}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer appearance-none pr-10"
              >
                <option value="" className="bg-[#141414] text-[#A3A3A3]">Escolha um aluno para prescrever...</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#141414] text-white">
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#A3A3A3] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Treinos Já Existentes do Aluno */}
          {selectedStudent && (
            <div className="vollon-card p-6 rounded-3xl space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">
                  Treinos do Aluno ({studentWorkouts.length})
                </label>
                <span className="text-[10px] text-[#FF3B4A] font-bold uppercase">
                  {students.find(s => s.id === selectedStudent)?.name?.split(' ')[0]}
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {studentWorkouts.map(w => {
                  const isSelected = editingWorkoutId === w.id
                  return (
                    <button 
                      key={w.id}
                      onClick={() => loadWorkoutForEdit(w)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-[#E11D2E]/15 border-[#E11D2E]/50 text-white shadow-sm' 
                          : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A3A3A3] hover:border-[#E11D2E]/40 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className={`font-bold text-xs block truncate ${isSelected ? 'text-[#FF3B4A]' : 'text-white'}`}>
                          {w.name}
                        </span>
                        {w.description && (
                          <span className="text-[10px] text-[#A3A3A3] truncate block mt-0.5">
                            {w.description}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#FF3B4A] translate-x-1' : 'text-[#A3A3A3] group-hover:text-white'}`} />
                    </button>
                  )
                })}
                {studentWorkouts.length === 0 && (
                  <p className="text-xs text-[#A3A3A3] text-center py-6 font-medium">
                    Nenhum treino criado ainda para este aluno.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Coluna Direita: Editor de Rotina e Exercícios (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedStudent ? (
            <div className="space-y-6">
              
              {/* Box de Presets / Modelos Rápidos */}
              <div className="vollon-card p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF3B4A]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Modelos Rápidos (1-Clique para Preencher)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {workoutPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-3 bg-[#1A1A1A] hover:bg-[#E11D2E]/15 border border-[#2A2A2A] hover:border-[#E11D2E]/50 rounded-2xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-[11px] font-bold text-white group-hover:text-[#FF3B4A] transition-colors truncate">
                        {preset.name.split('-')[1]?.trim() || preset.name}
                      </p>
                      <p className="text-[9px] text-[#A3A3A3] mt-0.5 truncate">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informações Básicas do Treino */}
              <div className="vollon-card p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                  <h3 className="font-display text-xl font-black uppercase text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#FF3B4A]" />
                    <span>{editingWorkoutId ? 'Editando Rotina' : 'Nova Rotina de Treino'}</span>
                  </h3>
                  {editingWorkoutId && (
                    <span className="text-[9px] bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/30 px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                      Modo Edição
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                      Nome da Rotina *
                    </label>
                    <input 
                      type="text" 
                      value={workoutName}
                      onChange={e => setWorkoutName(e.target.value)}
                      placeholder="Ex: Treino A - Superior (Peito + Tríceps)"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E11D2E] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                      Foco Muscular / Tag
                    </label>
                    <input 
                      type="text" 
                      value={workoutDescription}
                      onChange={e => setWorkoutDescription(e.target.value)}
                      placeholder="Ex: Foco Peitoral, Hipertrofia, 45min..."
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E11D2E] transition-colors"
                    />
                  </div>
                </div>

                {/* Resumo da Carga do Treino em Tempo Real */}
                <div className="flex items-center gap-6 pt-2 text-xs">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Layers className="w-4 h-4 text-[#FF3B4A]" /> {workoutItems.length} Exercícios
                  </span>
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Flame className="w-4 h-4 text-[#FF3B4A]" /> {totalSets} Séries Totais
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A3A3A3] font-medium">
                    <Clock className="w-4 h-4 text-[#A3A3A3]" /> ~{estimatedMinutes} min estimados
                  </span>
                </div>
              </div>

              {/* Seção de Exercícios da Rotina */}
              <div className="space-y-4">
                
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                    Sequência de Exercícios
                  </h3>
                  <button 
                    type="button"
                    onClick={addExercise}
                    className="vollon-btn-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.3)]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar Exercício</span>
                  </button>
                </div>

                {/* Lista de Exercícios */}
                <div className="space-y-3">
                  {workoutItems.map((item, index) => {
                    const currentEx = exercises.find(e => e.id === item.exercise_id)
                    return (
                      <div 
                        key={index} 
                        className="vollon-card p-4 sm:p-5 rounded-3xl border border-[#2A2A2A] flex flex-wrap md:flex-nowrap gap-4 items-center justify-between group hover:border-[#E11D2E]/40 transition-colors"
                      >
                        
                        {/* Posição e Ordem com Botões de Subir / Descer */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-sm text-white">
                            {index + 1}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="w-5 h-4 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Mover para cima"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDown(index)}
                              disabled={index === workoutItems.length - 1}
                              className="w-5 h-4 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Mover para baixo"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Select de Exercício com Miniatura */}
                        <div className="flex-1 min-w-[220px]">
                          <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1">
                            Exercício
                          </label>
                          <select 
                            value={item.exercise_id}
                            onChange={e => updateItem(index, 'exercise_id', e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer"
                          >
                            <option value="">Selecione o exercício...</option>
                            {exercises.map(ex => (
                              <option key={ex.id} value={ex.id} className="bg-[#141414] text-white">
                                [{ex.category}] {ex.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Controles de Séries */}
                        <div className="w-24 shrink-0">
                          <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1 text-center">
                            Séries
                          </label>
                          <div className="flex items-center gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">
                            <button 
                              type="button"
                              onClick={() => updateItem(index, 'target_sets', Math.max(1, (parseInt(item.target_sets) || 4) - 1))}
                              className="w-7 h-7 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#FF3B4A] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="flex-1 text-center font-display font-black text-sm text-white">
                              {item.target_sets}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateItem(index, 'target_sets', (parseInt(item.target_sets) || 4) + 1)}
                              className="w-7 h-7 rounded-lg bg-[#141414] flex items-center justify-center text-white hover:text-[#FF3B4A] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Repetições */}
                        <div className="w-24 shrink-0">
                          <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1 text-center">
                            Reps
                          </label>
                          <input 
                            type="text" 
                            value={item.target_reps}
                            onChange={e => updateItem(index, 'target_reps', e.target.value)}
                            placeholder="10 a 12"
                            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-2.5 text-xs font-bold text-center focus:outline-none focus:border-[#E11D2E] transition-colors"
                          />
                        </div>

                        {/* Descanso */}
                        <div className="w-20 shrink-0">
                          <label className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1 text-center">
                            Descanso
                          </label>
                          <select 
                            value={item.rest_time}
                            onChange={e => updateItem(index, 'rest_time', e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-2.5 text-xs font-bold text-center focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer"
                          >
                            <option value="30s">30s</option>
                            <option value="45s">45s</option>
                            <option value="60s">60s</option>
                            <option value="90s">90s</option>
                            <option value="120s">120s</option>
                          </select>
                        </div>

                        {/* Botão de Excluir da Lista */}
                        <button 
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#FF3B4A] hover:border-[#E11D2E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Remover exercício da rotina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    )
                  })}

                  {workoutItems.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-[#2A2A2A] rounded-3xl space-y-2">
                      <p className="text-xs text-[#A3A3A3] font-bold uppercase tracking-wider">
                        Nenhum exercício adicionado a esta rotina.
                      </p>
                      <p className="text-[11px] text-[#52525B]">
                        Clique no botão acima ou selecione um dos Modelos Rápidos para preencher.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Botões Finais de Salvar / Excluir Treino */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-[#2A2A2A]">
                {editingWorkoutId && (
                  <button 
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="w-full sm:w-auto px-6 h-12 rounded-xl border border-[#E11D2E]/40 text-[#FF3B4A] hover:bg-[#E11D2E]/15 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Rotina</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={isSaving}
                  className="vollon-btn-primary w-full sm:w-auto px-8 h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_24px_rgba(255,59,74,0.35)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>{isSaving ? 'Salvando...' : editingWorkoutId ? 'Salvar Alterações' : 'Criar Rotina de Treino'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* Estado Inicial: Aluno Não Selecionado */
            <div className="h-[420px] flex flex-col items-center justify-center text-center vollon-card rounded-3xl p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-white">
                Selecione um Aluno
              </h3>
              <p className="text-xs text-[#A3A3A3] max-w-sm leading-relaxed">
                Escolha um dos seus alunos no painel à esquerda para carregar os treinos existentes ou montar uma nova rotina personalizada.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vollon-card border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black uppercase text-white">
                  Excluir Rotina?
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Tem certeza que deseja excluir permanentemente o treino <strong className="text-white">"{workoutName}"</strong> e todo o histórico de execuções vinculado a ele?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="vollon-btn-secondary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleDeleteWorkout}
                disabled={isDeleting}
                className="vollon-btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_20px_rgba(255,59,74,0.35)]"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

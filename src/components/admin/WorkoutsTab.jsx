import React, { useState, useEffect } from 'react'
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

  const fetchData = async () => {
    if (!teacherInfo?.id) return
    setLoading(true)
    const { data, error } = await supabase.from('gym_students').select('id, name').eq('teacher_id', teacherInfo.id).order('name')
    if (!error) setStudents(data)
    
    const { data: exData } = await supabase.from('gym_exercises').select('id, name, category').order('name')
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
    
    if (!error) setStudentWorkouts(data)
  }

  const loadWorkoutForEdit = async (workout) => {
    setLoading(true)
    setEditingWorkoutId(workout.id)
    setWorkoutName(workout.name)
    setWorkoutDescription(workout.description || '')
    
    const { data, error } = await supabase
      .from('gym_workout_items')
      .select('*')
      .eq('workout_id', workout.id)
      .order('sequence_order')

    if (!error) {
      setWorkoutItems(data.map(item => ({
        id: item.id,
        exercise_id: item.exercise_id,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        rest_time: item.rest_time
      })))
    }
    setLoading(false)
  }

  const handleSaveWorkout = async () => {
    if (!selectedStudent || !workoutName || workoutItems.length === 0) {
      showToast('Preencha todos os campos do treino.', 'error')
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
      target_sets: parseInt(item.target_sets),
      target_reps: item.target_reps,
      rest_time: item.rest_time
    }))

    const { error: itemsError } = await supabase.from('gym_workout_items').insert(itemsToInsert)

    if (itemsError) {
      showToast('Erro ao salvar exercícios: ' + itemsError.message, 'error')
    } else {
      showToast(editingWorkoutId ? 'Treino atualizado com sucesso!' : 'Treino criado com sucesso!')
      resetForm()
      fetchStudentWorkouts()
    }
    setIsSaving(false)
  }

  const handleDeleteWorkout = async () => {
    if (!editingWorkoutId) return
    setIsDeleting(true)

    // Precisamos excluir primeiro todos os itens relacionados para não disparar erro de Foreign Key
    await supabase.from('gym_training_logs').delete().eq('workout_id', editingWorkoutId)
    await supabase.from('gym_workout_items').delete().eq('workout_id', editingWorkoutId)
    
    // Por fim, deleta o treino principal
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
    setWorkoutItems([...workoutItems, { exercise_id: '', target_sets: 3, target_reps: '12', rest_time: '60s' }])
  }

  const removeExercise = (index) => {
    setWorkoutItems(workoutItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...workoutItems]
    newItems[index][field] = value
    setWorkoutItems(newItems)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">1. Selecione o Aluno</label>
            <select 
              value={selectedStudent}
              onChange={e => { setSelectedStudent(e.target.value); resetForm(); }}
              className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-4 font-body-md outline-none focus:border-primary-container transition-all"
            >
              <option value="">Selecione um aluno...</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedStudent && (
            <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Treinos do Aluno</label>
                <button onClick={resetForm} className="font-label-caps text-[10px] text-primary-container hover:brightness-110 transition-all uppercase">Novo Treino</button>
              </div>
              <div className="space-y-2">
                {studentWorkouts.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => loadWorkoutForEdit(w)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      editingWorkoutId === w.id ? 'bg-primary-container/10 border-primary-container text-primary-container' : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface'
                    }`}
                  >
                    <span className="font-headline-md text-sm">{w.name}</span>
                    <span className={`material-symbols-outlined text-lg transition-transform ${editingWorkoutId === w.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`}>chevron_right</span>
                  </button>
                ))}
                {studentWorkouts.length === 0 && <p className="font-body-md text-xs text-on-surface-variant text-center py-4 italic">Nenhum treino encontrado.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="space-y-6">
              <section className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display-lg text-xl text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container">assignment</span> {editingWorkoutId ? 'Editando Treino' : 'Novo Treino'}
                  </h3>
                  {editingWorkoutId && (
                    <span className="font-label-caps text-[10px] bg-primary-container/20 text-primary-container px-2 py-1 rounded-full uppercase tracking-widest border border-primary-container/20">Existente</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Identificação do Treino</label>
                  <input 
                    type="text" 
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="Ex: Treino A - Superior (Foco Peito)"
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-4 font-body-md focus:border-primary-container outline-none transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Foco / Descrição (Pílula de Filtro)</label>
                  <input 
                    type="text" 
                    value={workoutDescription}
                    onChange={e => setWorkoutDescription(e.target.value)}
                    placeholder="Ex: Foco Peito, Superior, Cardio..."
                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-4 font-body-md focus:border-primary-container outline-none transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-headline-lg text-lg text-on-surface">Exercícios da Rotina</h3>
                  <button 
                    onClick={addExercise}
                    className="flex items-center gap-2 text-primary-container hover:brightness-110 font-label-caps text-xs transition-all uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-sm p-0.5 bg-primary-container/10 rounded-full">add</span> Adicionar Exercício
                  </button>
                </div>

                <div className="space-y-4">
                  {workoutItems.map((item, index) => (
                    <div key={index} className="bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Exercício {index + 1}</label>
                        <select 
                          value={item.exercise_id}
                          onChange={e => updateItem(index, 'exercise_id', e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md outline-none focus:border-primary-container transition-all"
                        >
                          <option value="">Selecione...</option>
                          {exercises.map(ex => (
                            <option key={ex.id} value={ex.id}>[{ex.category}] {ex.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20 space-y-2">
                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Sets</label>
                        <input 
                          type="number" 
                          value={item.target_sets}
                          onChange={e => updateItem(index, 'target_sets', e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md text-center outline-none focus:border-primary-container transition-all"
                        />
                      </div>

                      <div className="w-24 space-y-2">
                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Reps</label>
                        <input 
                          type="text" 
                          value={item.target_reps}
                          onChange={e => updateItem(index, 'target_reps', e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl p-3 font-body-md text-center outline-none focus:border-primary-container transition-all"
                        />
                      </div>

                      <button 
                        onClick={() => removeExercise(index)}
                        className="p-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end pt-4 gap-4">
                {editingWorkoutId && (
                  <button 
                    onClick={() => setDeleteModalOpen(true)}
                    type="button"
                    className="border border-error text-error hover:bg-error/10 px-8 py-4 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span> Excluir Treino
                  </button>
                )}
                <button 
                  onClick={handleSaveWorkout}
                  disabled={isSaving}
                  className="bg-primary-container hover:brightness-110 text-on-primary-container px-10 py-4 rounded-xl font-label-caps uppercase tracking-widest shadow-[0_0_15px_rgba(195,244,0,0.2)] neon-glow transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingWorkoutId ? 'Salvar Alterações' : 'Criar Treino'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center glass-panel border-2 border-dashed border-outline-variant/30 rounded-3xl">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">assignment</span>
              <p className="font-body-md text-on-surface-variant">Selecione um aluno ao lado <br/> para começar a montar ou editar treinos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative bg-surface-container-low border border-error/30 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-display-lg text-xl text-on-surface">Excluir Treino</h3>
                <p className="font-body-md text-sm text-on-surface-variant mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="font-body-md text-on-surface mb-8">
              Tem certeza que deseja excluir permanentemente o treino <strong className="text-error">{workoutName}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-6 py-3 rounded-xl font-label-caps text-xs text-on-surface-variant hover:bg-surface-container-highest transition-all uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteWorkout}
                disabled={isDeleting}
                className="bg-error hover:brightness-110 text-on-error px-6 py-3 rounded-xl font-label-caps text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,0,0.2)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

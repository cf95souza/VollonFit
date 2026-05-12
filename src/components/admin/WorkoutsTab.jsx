import React, { useState, useEffect } from 'react'
import { ClipboardList, Plus, ChevronRight, LogOut } from 'lucide-react'
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
          <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Selecione o Aluno</label>
            <select 
              value={selectedStudent}
              onChange={e => { setSelectedStudent(e.target.value); resetForm(); }}
              className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#DFFF5E]/20"
            >
              <option value="">Selecione um aluno...</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedStudent && (
            <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-sm space-y-4 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treinos do Aluno</label>
                <button onClick={resetForm} className="text-[10px] font-bold text-[#DFFF5E] hover:underline">Novo Treino</button>
              </div>
              <div className="space-y-2">
                {studentWorkouts.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => loadWorkoutForEdit(w)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      editingWorkoutId === w.id ? 'bg-[#DFFF5E]/10 border-[#DFFF5E] text-[#DFFF5E]' : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-sm">{w.name}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${editingWorkoutId === w.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
                {studentWorkouts.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum treino encontrado.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="space-y-6">
              <section className="bg-[#111111] p-8 rounded-3xl border border-white/5 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-[#DFFF5E]" /> {editingWorkoutId ? 'Editando Treino' : 'Novo Treino'}
                  </h3>
                  {editingWorkoutId && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Existente</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identificação do Treino</label>
                  <input 
                    type="text" 
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="Ex: Treino A - Superior (Foco Peito)"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#DFFF5E]/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Foco / Descrição (Pílula de Filtro)</label>
                  <input 
                    type="text" 
                    value={workoutDescription}
                    onChange={e => setWorkoutDescription(e.target.value)}
                    placeholder="Ex: Foco Peito, Superior, Cardio..."
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#DFFF5E]/20 outline-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-lg font-bold text-white">Exercícios da Rotina</h3>
                  <button 
                    onClick={addExercise}
                    className="flex items-center gap-2 text-[#DFFF5E] hover:text-[#B8E600] font-bold text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 p-0.5 bg-[#DFFF5E]/10 rounded-full" /> Adicionar Exercício
                  </button>
                </div>

                <div className="space-y-4">
                  {workoutItems.map((item, index) => (
                    <div key={index} className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exercício {index + 1}</label>
                        <select 
                          value={item.exercise_id}
                          onChange={e => updateItem(index, 'exercise_id', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm outline-none focus:border-[#DFFF5E]/50"
                        >
                          <option value="">Selecione...</option>
                          {exercises.map(ex => (
                            <option key={ex.id} value={ex.id}>[{ex.category}] {ex.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sets</label>
                        <input 
                          type="number" 
                          value={item.target_sets}
                          onChange={e => updateItem(index, 'target_sets', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm text-center outline-none focus:border-[#DFFF5E]/50"
                        />
                      </div>

                      <div className="w-24 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reps</label>
                        <input 
                          type="text" 
                          value={item.target_reps}
                          onChange={e => updateItem(index, 'target_reps', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg p-3 text-sm text-center outline-none focus:border-[#DFFF5E]/50"
                        />
                      </div>

                      <button 
                        onClick={() => removeExercise(index)}
                        className="p-3 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5 rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveWorkout}
                  disabled={isSaving}
                  className="bg-[#DFFF5E] hover:bg-[#B8E600] text-black px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingWorkoutId ? 'Salvar Alterações' : 'Criar Treino'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center bg-[#111111] border-2 border-dashed border-white/5 rounded-[40px]">
              <ClipboardList className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-slate-400 font-medium">Selecione um aluno ao lado <br/> para começar a montar ou editar treinos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

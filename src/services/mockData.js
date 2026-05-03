export const MOCK_EXERCISES = [
  { id: '1', name: 'Supino Reto', category: 'Peito', description: 'Exercício básico para peitorais.', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZicGgwaG5nYng1bmZ4Yng1bmZ4Yng1bmZ4Yng1bmZ4YngmbnA9Z2lmX3NlYXJjaCZjdD1n/3o7TKMGpxx8y9C1XW0/giphy.gif' },
  { id: '2', name: 'Agachamento Livre', category: 'Pernas', description: 'Exercício composto para quadríceps e glúteos.', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZicGgwaG5nYng1bmZ4Yng1bmZ4Yng1bmZ4Yng1bmZ4YngmbnA9Z2lmX3NlYXJjaCZjdD1n/l3q2u6Z6z6z6z6z6z6/giphy.gif' },
  { id: '3', name: 'Puxada Pulley', category: 'Costas', description: 'Trabalha latíssimo do dorso.', gifUrl: 'https://media.giphy.com/media/3o7TKMGpxx8y9C1XW0/giphy.gif' },
  { id: '4', name: 'Rosca Direta', category: 'Bíceps', description: 'Isolamento de bíceps com barra.', gifUrl: 'https://media.giphy.com/media/3o7TKMGpxx8y9C1XW0/giphy.gif' },
  { id: '5', name: 'Elevação Lateral', category: 'Ombros', description: 'Trabalha a porção lateral do deltoide.', gifUrl: 'https://media.giphy.com/media/3o7TKMGpxx8y9C1XW0/giphy.gif' },
]

export const MOCK_STUDENTS = [
  { id: '1', name: 'Caio', username: 'caio.franca', age: 30, weight: 85.5 },
  { id: '2', name: 'Thais', username: 'thais.franca', age: 28, weight: 62.0 },
]

export const MOCK_WORKOUTS = [
  { 
    id: 'w1', 
    name: 'Treino A - Peito e Tríceps', 
    user_id: '1', // Caio
    exercises: [
      { exercise_id: '1', sets: 4, reps: '8-12', rest: '60s' },
      { exercise_id: '4', sets: 3, reps: '10-12', rest: '45s' },
      { exercise_id: '5', sets: 3, reps: '12-15', rest: '45s' },
    ]
  },
  { 
    id: 'w2', 
    name: 'Treino B - Pernas e Core', 
    user_id: '1', // Caio
    exercises: [
      { exercise_id: '2', sets: 4, reps: '10-12', rest: '90s' },
    ]
  }
]

export const MOCK_TRAINING_LOGS = [
  { id: 'l1', user_id: '1', workout_id: 'w1', exercise_id: '1', set_number: 1, reps_done: 10, weight: 60, date: '2026-04-28' },
  { id: 'l2', user_id: '1', workout_id: 'w1', exercise_id: '1', set_number: 2, reps_done: 10, weight: 60, date: '2026-04-28' },
]

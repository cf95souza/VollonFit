import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import MasterDashboard from './pages/MasterDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AcademyDashboard from './pages/AcademyDashboard'
import LandingPage from './pages/LandingPage'
import { useEffect } from 'react'
import { loadTheme } from './utils/themeLoader'

function App() {
  useEffect(() => {
    // Detectar professor logado ou professor do aluno logado
    const student = localStorage.getItem('vollonfit_user')
    const teacher = localStorage.getItem('vollonfit_teacher')
    
    if (student) {
      const parsed = JSON.parse(student)
      if (parsed.teacher_id) loadTheme(parsed.teacher_id)
    } else if (teacher) {
      const parsed = JSON.parse(teacher)
      if (parsed.id) loadTheme(parsed.id)
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/master" element={<MasterDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/academy" element={<AcademyDashboard />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

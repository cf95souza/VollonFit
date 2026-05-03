import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ShieldCheck, User, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [loginType, setLoginType] = useState('student') // 'student' or 'admin'
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check Admin Session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          navigate('/admin', { replace: true })
          return
        }

        // Check Student Session (Custom Table)
        const student = localStorage.getItem('casalgym_user')
        if (student) {
          navigate('/student', { replace: true })
          return
        }
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [navigate])

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Sessão...</p>
      </div>
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (loginType === 'admin') {
        // Admin Login via Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password,
        })
        if (error) throw error
        navigate('/admin', { replace: true })
      } else {
        // Student Login via Custom Table
        const { data, error } = await supabase
          .from('gym_students')
          .select('*')
          .eq('username', identifier.trim().toLowerCase())
          .eq('password', password.trim())
          .single()

        if (error) throw error
        if (!data) throw new Error('Usuário não encontrado ou senha incorreta')
        
        // Em um app real, salvaríamos a sessão do aluno (localStorage ou context)
        localStorage.setItem('casalgym_user', JSON.stringify(data))
        navigate('/student', { replace: true })
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Erro de conexão com o banco' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-secondary p-8 text-center">
          <div className="inline-flex items-center justify-center bg-primary p-3 rounded-xl mb-4">
            <Dumbbell className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">CasalGym</h1>
          <p className="text-slate-400 text-sm mt-1">Sua jornada de evolução</p>
        </div>

        <div className="p-8">
          {/* Toggle Switch */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setLoginType('student')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'student' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Aluno
            </button>
            <button
              onClick={() => setLoginType('admin')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'admin' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {loginType === 'admin' ? 'E-mail' : 'Usuário (caio.franca / thais.franca)'}
              </label>
              <input
                type={loginType === 'admin' ? 'email' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder={loginType === 'admin' ? 'seu@email.com' : 'usuario.nome'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs text-center max-w-xs">
        Seja bem-vindo de volta! Prepare-se para superar seus limites hoje.
      </p>
    </div>
  )
}

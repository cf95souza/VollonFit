import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ShieldCheck, User, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (session.user.email === 'cf95.souza@gmail.com') {
            navigate('/master', { replace: true })
          } else {
            navigate('/admin', { replace: true })
          }
          return
        }

        const student = localStorage.getItem('vollonfit_user')
        if (student) {
          navigate('/student', { replace: true })
          return
        }

        const teacher = localStorage.getItem('vollonfit_teacher')
        if (teacher) {
          navigate('/admin', { replace: true })
          return
        }

        const academy = localStorage.getItem('vollonfit_academy')
        if (academy) {
          navigate('/academy', { replace: true })
          return
        }
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const isEmail = identifier.includes('@')

      if (isEmail && identifier.trim().toLowerCase() === 'cf95.souza@gmail.com') {
        // Master Admin Login (Supabase Auth)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password: password,
        })
        if (error) throw new Error('Credenciais inválidas')
        navigate('/master', { replace: true })

      } else if (isEmail) {
        // Tenta logar como Gestor de Academia (B2B)
        const { data: admin } = await supabase
          .from('gym_academy_admins')
          .select('*')
          .eq('email', identifier.trim().toLowerCase())
          .eq('password', password.trim())
          .maybeSingle()

        if (admin) {
          localStorage.setItem('vollonfit_academy', JSON.stringify(admin))
          navigate('/academy', { replace: true })
          return
        }

        // Teacher Login (tabela gym_teachers)
        const { data: teacher, error } = await supabase
          .from('gym_teachers')
          .select('*')
          .eq('email', identifier.trim().toLowerCase())
          .eq('password', password.trim())
          .single()

        if (error || !teacher) throw new Error('Email ou senha incorretos')

        if (teacher.status === 'blocked') {
          throw new Error('Sua conta está suspensa. Entre em contato com o administrador.')
        }

        // [SaaS Pro] Lógica de Trial e Assinatura
        let { data: sub } = await supabase
          .from('gym_subscriptions')
          .select('*')
          .eq('teacher_id', teacher.id)
          .maybeSingle()

        if (!sub) {
          // Se não tem assinatura, inicia Trial de 7 dias
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 7)
          
          const { data: newSub } = await supabase
            .from('gym_subscriptions')
            .insert([{
              teacher_id: teacher.id,
              status: 'trialing',
              current_period_end: endDate.toISOString()
            }])
            .select()
            .single()
            
          sub = newSub
        }

        // Verifica expiração do trial
        if (sub && sub.status === 'trialing' && new Date() > new Date(sub.current_period_end)) {
          await supabase.from('gym_subscriptions').update({ status: 'past_due' }).eq('id', sub.id)
          sub.status = 'past_due'
        }

        teacher.subscription = sub

        localStorage.setItem('vollonfit_teacher', JSON.stringify(teacher))
        navigate('/admin', { replace: true })
      } else {
        // Student Login
        const { data, error } = await supabase
          .from('gym_students')
          .select('*')
          .eq('username', identifier.trim().toLowerCase())
          .eq('password', password.trim())
          .single()

        if (error) throw new Error('Usuário ou senha incorretos')

        // Verificar se o professor vinculado está bloqueado
        if (data.teacher_id) {
          const { data: teacher } = await supabase
            .from('gym_teachers')
            .select('status')
            .eq('id', data.teacher_id)
            .single()

          if (teacher?.status === 'blocked') {
            throw new Error('Acesso temporariamente indisponível. Entre em contato com seu professor.')
          }
        }
        
        localStorage.setItem('vollonfit_user', JSON.stringify(data))
        navigate('/student', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Iniciando VollonFit...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-black">
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest z-[100]">
        Login da Versão Nova Ativo
      </div>
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: 'url("/assets/login-bg.png")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-primary/20" />
      
      {/* Animated Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-primary p-4 rounded-3xl mb-6 shadow-2xl shadow-primary/40 animate-bounce-subtle text-black">
            <Dumbbell className="text-white w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 font-display uppercase">
            VOLLON<span className="text-primary">FIT</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Evolution Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Acesso do Usuário</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 focus:bg-white/10 transition-all font-bold"
                  placeholder="Email ou Username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chave de Segurança</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 focus:bg-white/10 transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-black font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 text-lg active:scale-95 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  ACESSAR SISTEMA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-slate-500 text-[10px] text-center font-bold uppercase tracking-[0.3em]">
          Powered by VollonFit OS © 2026
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />
    </div>
  )
}

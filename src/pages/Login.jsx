import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ShieldCheck, User, Loader2, Mail, Phone, Lock, ChevronRight } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)

  // Invite & Register Flow States (Alunos)
  const [inviteId, setInviteId] = useState(null)
  const [inviteTeacher, setInviteTeacher] = useState(null)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', username: '', password: '' })

  // Academy B2B Invite Flow States (Professores)
  const [inviteAcademyId, setInviteAcademyId] = useState(null)
  const [inviteAcademy, setInviteAcademy] = useState(null)
  const [isAcademyRegisterMode, setIsAcademyRegisterMode] = useState(false)
  const [regTeacherForm, setRegTeacherForm] = useState({ name: '', email: '', password: '', phone: '' })

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

  // Extract invite code and load invited teacher/academy info
  useEffect(() => {
    const fetchInviteData = async () => {
      const params = new URLSearchParams(window.location.search)
      const invId = params.get('invite')
      const invAcadId = params.get('academy')

      if (invId) {
        setInviteId(invId)
        try {
          const { data } = await supabase
            .from('gym_teachers')
            .select('name, plan_type')
            .eq('id', invId)
            .maybeSingle()
          
          if (data && data.plan_type === 'premium') {
            const { data: logoSetting } = await supabase
              .from('gym_settings')
              .select('value')
              .eq('key', `logo_${invId}`)
              .maybeSingle()
            
            setInviteTeacher({
              name: data.name,
              logo_url: logoSetting?.value || null
            })
            setIsRegisterMode(true)
          }
        } catch (e) {
          console.error("Erro ao validar convite:", e)
        }
      }

      if (invAcadId) {
        setInviteAcademyId(invAcadId)
        try {
          const { data: acadData } = await supabase
            .from('gym_academies')
            .select('name, logo_url, max_teachers')
            .eq('id', invAcadId)
            .maybeSingle()
          
          if (acadData) {
            setInviteAcademy(acadData)
            setIsAcademyRegisterMode(true)
          }
        } catch (e) {
          console.error("Erro ao validar academia:", e)
        }
      }
    }
    fetchInviteData()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanIdentifier = identifier.trim()
    const cleanPassword = password.trim()

    try {
      const isEmail = cleanIdentifier.includes('@')

      if (isEmail) {
        // 1. Tentar Login Master ADM via Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password: cleanPassword
        })

        if (!authErr && authData?.session) {
          if (authData.session.user.email === 'cf95.souza@gmail.com') {
            navigate('/master', { replace: true })
          } else {
            navigate('/admin', { replace: true })
          }
          return
        }

        // 2. Tentar Login Gestor de Academia
        const { data: academyAdmin } = await supabase
          .from('gym_academy_admins')
          .select('*, gym_academies(*)')
          .eq('email', cleanIdentifier.toLowerCase())
          .eq('password', cleanPassword)
          .maybeSingle()

        if (academyAdmin) {
          localStorage.setItem('vollonfit_academy', JSON.stringify(academyAdmin))
          navigate('/academy', { replace: true })
          return
        }

        // 3. Tentar Login Professor via Tabela
        const { data: teacher } = await supabase
          .from('gym_teachers')
          .select('*')
          .eq('email', cleanIdentifier.toLowerCase())
          .eq('password', cleanPassword)
          .maybeSingle()

        if (teacher) {
          if (teacher.status === 'blocked') {
            throw new Error('Acesso bloqueado por inadimplência ou restrição cadastral.')
          }
          localStorage.setItem('vollonfit_teacher', JSON.stringify(teacher))
          navigate('/admin', { replace: true })
          return
        }
      }

      // 4. Login Aluno (por username ou email)
      let query = supabase.from('gym_students').select('*')
      if (isEmail) {
        query = query.eq('username', cleanIdentifier.toLowerCase())
      } else {
        query = query.eq('username', cleanIdentifier.toLowerCase())
      }

      const { data, error: err } = await query
        .eq('password', cleanPassword)
        .maybeSingle()

      if (err) throw err

      if (!data) {
        throw new Error('Usuário ou senha incorretos.')
      } else {
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

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const usernameClean = regForm.username.toLowerCase().trim()
      
      const { data: existingStudent } = await supabase
        .from('gym_students')
        .select('id')
        .eq('username', usernameClean)
        .maybeSingle()

      if (existingStudent) {
        throw new Error('Este nome de usuário já está sendo usado. Tente outro!')
      }

      const { data: teacher } = await supabase
        .from('gym_teachers')
        .select('quota_limit')
        .eq('id', inviteId)
        .single()

      const { count } = await supabase
        .from('gym_students')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', inviteId)

      if (teacher && count >= teacher.quota_limit) {
        throw new Error('O limite de alunos deste professor foi atingido. Entre em contato com ele!')
      }

      const { data: newStudent, error: insertErr } = await supabase
        .from('gym_students')
        .insert([{
          name: regForm.name.trim(),
          username: usernameClean,
          password: regForm.password.trim(),
          teacher_id: inviteId,
          status: 'active'
        }])
        .select()
        .single()

      if (insertErr) throw insertErr

      localStorage.setItem('vollonfit_user', JSON.stringify(newStudent))
      navigate('/student', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAcademyRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const emailClean = regTeacherForm.email.toLowerCase().trim()

      const { data: existingTeacher } = await supabase
        .from('gym_teachers')
        .select('id')
        .eq('email', emailClean)
        .maybeSingle()

      if (existingTeacher) {
        throw new Error('Este e-mail já está cadastrado!')
      }

      const { data: newTeacher, error: insertErr } = await supabase
        .from('gym_teachers')
        .insert([{
          name: regTeacherForm.name.trim(),
          email: emailClean,
          password: regTeacherForm.password.trim(),
          phone: regTeacherForm.phone.trim(),
          academy_id: inviteAcademyId,
          quota_limit: 10,
          plan_type: 'basic',
          status: 'active'
        }])
        .select()
        .single()

      if (insertErr) throw insertErr

      localStorage.setItem('vollonfit_teacher', JSON.stringify(newTeacher))
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#E11D2E] animate-spin mb-3" />
        <p className="text-[#A3A3A3] font-bold text-xs uppercase tracking-widest font-display">Iniciando VollonFit...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full bg-[#0A0A0A] text-white flex flex-col justify-between relative overflow-y-auto font-body selection:bg-[#E11D2E]/30">
      
      {/* Glows de Fundo Suaves no Topo (conforme 01-login.png) */}
      <div className="absolute top-0 right-1/4 w-[360px] h-[360px] bg-[#E11D2E]/15 rounded-full blur-[100px] pointer-events-none -z-0" />
      <div className="absolute top-20 -left-20 w-[300px] h-[300px] bg-[#9F0012]/15 rounded-full blur-[90px] pointer-events-none -z-0" />

      {/* Top Hero Section */}
      <div className="w-full max-w-md mx-auto px-6 pt-8 pb-4 flex-1 flex flex-col justify-between z-10">
        
        {/* Logo VollonFit */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center shadow-lg">
            <Dumbbell className="w-5 h-5 text-[#FF3B4A]" />
          </div>
          <span className="font-display text-2xl font-black tracking-tight uppercase">
            VOLLON<span className="text-[#E11D2E]">FIT</span>
          </span>
        </div>

        {/* Título Gigante e Frase de Apoio */}
        <div className="my-auto py-4">
          <h1 className="font-display text-[54px] sm:text-[68px] font-black leading-[0.9] uppercase tracking-tight bg-gradient-to-b from-white via-[#FFAAB1] to-[#FF4D5D] bg-clip-text text-transparent">
            TREINE<br />JUNTO.
          </h1>
          <p className="text-[#A3A3A3] text-sm sm:text-base font-medium mt-3 max-w-[280px] leading-relaxed">
            Seu treino, o da sua parceira e o ranking do casal em um só lugar.
          </p>
        </div>

        {/* Informações de Convite (se ativo) */}
        {inviteTeacher && isRegisterMode && (
          <div className="mb-2 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center font-bold text-xs">
              {inviteTeacher.name?.[0]}
            </div>
            <div className="text-xs">
              <p className="text-[#A3A3A3]">Treinador Oficial:</p>
              <p className="font-bold text-white">{inviteTeacher.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet / Painel de Login que sobe da base (raio 32px) */}
      <div className="w-full bg-[#141414] border-t border-[#2A2A2A] rounded-t-[32px] p-6 pt-6 pb-8 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto">
          
          {isAcademyRegisterMode ? (
            /* Formulário Cadastro B2B */
            <form onSubmit={handleAcademyRegister} className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="font-display text-2xl font-black uppercase text-white">Cadastro B2B</h2>
                <p className="text-xs text-[#A3A3A3]">Credenciamento de Professor na Academia</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Nome Completo</label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E]">
                  <User className="w-4 h-4 text-[#A3A3A3]" />
                  <input
                    type="text"
                    required
                    value={regTeacherForm.name}
                    onChange={(e) => setRegTeacherForm({ ...regTeacherForm, name: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">E-mail Corporativo</label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E]">
                  <Mail className="w-4 h-4 text-[#A3A3A3]" />
                  <input
                    type="email"
                    required
                    value={regTeacherForm.email}
                    onChange={(e) => setRegTeacherForm({ ...regTeacherForm, email: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                    placeholder="voce@academia.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Senha</label>
                  <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-3 h-12 focus-within:border-[#E11D2E]">
                    <Lock className="w-4 h-4 text-[#A3A3A3]" />
                    <input
                      type="password"
                      required
                      value={regTeacherForm.password}
                      onChange={(e) => setRegTeacherForm({ ...regTeacherForm, password: e.target.value })}
                      className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Telefone</label>
                  <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-3 h-12 focus-within:border-[#E11D2E]">
                    <Phone className="w-4 h-4 text-[#A3A3A3]" />
                    <input
                      type="text"
                      required
                      value={regTeacherForm.phone}
                      onChange={(e) => setRegTeacherForm({ ...regTeacherForm, phone: e.target.value })}
                      className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#E11D2E]/15 border border-[#E11D2E]/40 text-[#FF3B4A] text-xs font-semibold rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="vollon-btn-primary w-full h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-2 uppercase tracking-wider text-sm mt-3 shadow-[0_8px_24px_rgba(255,59,74,0.35)] cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Conta <ChevronRight className="w-4 h-4" /></>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsAcademyRegisterMode(false)}
                  className="text-xs text-[#A3A3A3] hover:text-white transition-colors"
                >
                  Já possui conta? <span className="text-[#FF3B4A] font-bold">Fazer Login</span>
                </button>
              </div>
            </form>
          ) : isRegisterMode ? (
            /* Formulário Cadastro Aluno */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="font-display text-2xl font-black uppercase text-white">Criar Minha Conta</h2>
                <p className="text-xs text-[#A3A3A3]">Preencha para começar seus treinos no VollonFit</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Nome Completo</label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E]">
                  <User className="w-4 h-4 text-[#A3A3A3]" />
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Usuário de Acesso</label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E]">
                  <span className="text-xs font-bold text-[#A3A3A3]">@</span>
                  <input
                    type="text"
                    required
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                    placeholder="ex: caio.franca"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5 block">Senha</label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E]">
                  <Lock className="w-4 h-4 text-[#A3A3A3]" />
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#E11D2E]/15 border border-[#E11D2E]/40 text-[#FF3B4A] text-xs font-semibold rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="vollon-btn-primary w-full h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-2 uppercase tracking-wider text-sm mt-3 shadow-[0_8px_24px_rgba(255,59,74,0.35)] cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Cadastrar e Acessar <ChevronRight className="w-4 h-4" /></>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-xs text-[#A3A3A3] hover:text-white transition-colors"
                >
                  Já tem conta? <span className="text-[#FF3B4A] font-bold">Fazer Login</span>
                </button>
              </div>
            </form>
          ) : (
            /* Formulário Principal Oficial (01-login.png) */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2 block">
                  USUÁRIO OU E-MAIL
                </label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E] transition-colors">
                  <Mail className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none font-medium"
                    placeholder="voce@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2 block">
                  SENHA
                </label>
                <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 h-12 focus-within:border-[#E11D2E] transition-colors">
                  <Lock className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-[#52525B] text-sm focus:outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#E11D2E]/15 border border-[#E11D2E]/40 text-[#FF3B4A] text-xs font-semibold rounded-xl text-center animate-in fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="vollon-btn-primary w-full h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-1.5 text-base tracking-wide mt-3 cursor-pointer shadow-[0_8px_24px_rgba(255,59,74,0.35)]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {inviteId && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(true)}
                    className="text-xs text-[#A3A3A3] hover:text-white transition-colors"
                  >
                    Não tem conta? <span className="text-[#FF3B4A] font-bold">Cadastrar-se com convite</span>
                  </button>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

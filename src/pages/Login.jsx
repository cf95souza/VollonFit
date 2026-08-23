import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ShieldCheck, User, Loader2, ArrowRight, Mail, Phone } from 'lucide-react'
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
          const { data, error } = await supabase
            .from('gym_teachers')
            .select('name, plan_type')
            .eq('id', invId)
            .maybeSingle()
          
          if (data) {
            // Check if teacher is premium (Plano 2) to allow registration!
            if (data.plan_type === 'premium') {
              // Load custom theme
              const { data: themeSetting } = await supabase
                .from('gym_settings')
                .select('value')
                .eq('key', `theme_${invId}`)
                .maybeSingle()
              
              if (themeSetting) {
                const { hexToRgbString } = await import('../utils/colorUtils')
                document.documentElement.style.setProperty('--color-primary', hexToRgbString(themeSetting.value))
              }

              // Load custom logo
              const { data: logoSetting } = await supabase
                .from('gym_settings')
                .select('value')
                .eq('key', `logo_${invId}`)
                .maybeSingle()
              
              if (logoSetting && logoSetting.value) {
                data.logo_url = logoSetting.value
              }

              setInviteTeacher(data)
              setIsRegisterMode(true)
            } else {
              setError('O link de convite é inválido ou o professor está no plano básico.')
            }
          }
        } catch (e) {
          console.warn('Erro ao carregar dados do convite:', e)
        }
      } else if (invAcadId) {
        setInviteAcademyId(invAcadId)
        
        try {
          const { data: academyData, error: acadErr } = await supabase
            .from('gym_academies')
            .select('name, logo_url, max_teachers')
            .eq('id', invAcadId)
            .maybeSingle()
          
          if (academyData) {
            // Validar limite de professores
            const { count } = await supabase
              .from('gym_teachers')
              .select('*', { count: 'exact', head: true })
              .eq('academy_id', invAcadId)

            if (count >= academyData.max_teachers) {
              setError(`Limite de professores desta academia atingido (${academyData.max_teachers}). Entre em contato com a gestão corporativa.`)
            } else {
              setInviteAcademy(academyData)
              setIsAcademyRegisterMode(true)
            }
          } else {
            setError('O link de convite da academia é inválido ou expirou.')
          }
        } catch (e) {
          console.warn('Erro ao carregar dados do convite da academia:', e)
        }
      }
    }
    fetchInviteData()
  }, [])

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

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const usernameClean = regForm.username.toLowerCase().trim()
      
      // 1. Validar se o nome de usuário já existe
      const { data: existingStudent } = await supabase
        .from('gym_students')
        .select('id')
        .eq('username', usernameClean)
        .maybeSingle()

      if (existingStudent) {
        throw new Error('Este nome de usuário já está sendo usado. Tente outro!')
      }

      // 2. Validar cota de alunos do professor
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

      // 3. Criar o aluno no banco
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

      // 4. Logar automaticamente
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

      // 1. Validar se o e-mail já existe
      const { data: existingTeacher } = await supabase
        .from('gym_teachers')
        .select('id')
        .eq('email', emailClean)
        .maybeSingle()

      if (existingTeacher) {
        throw new Error('Este e-mail já está sendo usado por outro professor. Tente outro!')
      }

      // 2. Validar limite de professores novamente
      const { count } = await supabase
        .from('gym_teachers')
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', inviteAcademyId)

      if (inviteAcademy && count >= inviteAcademy.max_teachers) {
        throw new Error(`O limite de professores desta academia foi atingido (${inviteAcademy.max_teachers})!`)
      }

      // 3. Criar o professor no banco
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

      // 4. Logar automaticamente
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Iniciando VollonFit...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/30 text-on-surface font-sans overflow-hidden">
      
      {/* LEFT PANEL - Branding Image (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black border-r border-outline-variant/30">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
          alt="Gym aesthetic" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity hover:scale-105 transition-transform duration-[20s]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 backdrop-blur-md">
             <Dumbbell className="w-8 h-8 text-primary glow-effect" />
          </div>
          <span className="text-3xl font-display-xl font-black tracking-tighter text-white">
            VOLLON<span className="text-primary">FIT</span>
          </span>
        </div>

        <div className="relative z-10 max-w-lg mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-high/80 border border-outline-variant/30 rounded-full mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              SaaS para Alta Performance
            </span>
          </div>
          <h1 className="text-5xl font-display-xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Eleve o nível do seu <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed-dim">negócio fitness.</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-body-lg">
            A plataforma definitiva de inteligência artificial, gamificação e gestão B2B. Junte-se à elite dos treinadores.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Login / Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-surface-container-lowest">
        
        {/* Mobile Background Image & Overlays */}
        <div className="absolute inset-0 lg:hidden">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym aesthetic" 
            className="w-full h-full object-cover opacity-10 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          <div className="text-center mb-10">
            {inviteAcademy ? (
              /* BRANDED ACADEMY HEADER */
              <>
                <div className="inline-flex items-center justify-center bg-surface-container-high/50 p-1.5 rounded-[32px] mb-6 shadow-2xl border border-white/5 relative group backdrop-blur-xl">
                  {inviteAcademy.logo_url ? (
                    <div className="w-20 h-20 rounded-[26px] overflow-hidden bg-black/40 flex items-center justify-center">
                      <img src={inviteAcademy.logo_url} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-[26px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Dumbbell className="w-10 h-10 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-[32px] bg-primary/10 blur-xl -z-10 group-hover:bg-primary/20 transition-colors duration-500" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2 font-display-xl uppercase leading-tight">
                  PORTAL <span className="text-primary">{inviteAcademy.name}</span>
                </h1>
                <p className="text-on-surface-variant font-bold tracking-widest text-[9px] uppercase">Credenciamento de Professor B2B</p>
              </>
            ) : inviteTeacher ? (
              /* BRANDED TEACHER HEADER */
              <>
                <div className="inline-flex items-center justify-center bg-surface-container-high/50 p-1.5 rounded-[32px] mb-6 shadow-2xl border border-white/5 relative group backdrop-blur-xl">
                  {inviteTeacher.logo_url ? (
                    <div className="w-20 h-20 rounded-[26px] overflow-hidden bg-black/40 flex items-center justify-center">
                      <img src={inviteTeacher.logo_url} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-[26px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <User className="w-10 h-10 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-[32px] bg-primary/10 blur-xl -z-10 group-hover:bg-primary/20 transition-colors duration-500" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2 font-display-xl uppercase leading-tight">
                  STUDIO <span className="text-primary">{inviteTeacher.name}</span>
                </h1>
                <p className="text-on-surface-variant font-bold tracking-widest text-[9px] uppercase">Seu Personal Trainer Oficial</p>
              </>
            ) : (
              /* DEFAULT VOLLONFIT HEADER (Mobile Only) */
              <div className="lg:hidden">
                <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-3xl mb-6 shadow-2xl shadow-primary/20 border border-primary/20 backdrop-blur-md">
                  <Dumbbell className="text-primary w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2 font-display-xl uppercase">
                  VOLLON<span className="text-primary">FIT</span>
                </h1>
                <p className="text-on-surface-variant font-bold tracking-widest text-[9px] uppercase">Acesso ao Sistema</p>
              </div>
            )}
          </div>

          <div className="glass-panel bg-surface-container/40 backdrop-blur-2xl p-8 sm:p-10 rounded-[32px] border border-outline-variant/30 shadow-2xl relative">
            
            {isAcademyRegisterMode ? (
              /* ACADEMY TEACHER AUTO-REGISTRATION FORM */
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-white font-display-xl uppercase tracking-tight">Cadastro B2B</h2>
                  <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                    Preencha seus dados para começar a atuar na equipe.
                  </p>
                </div>

                <form onSubmit={handleAcademyRegister} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regTeacherForm.name}
                        onChange={(e) => setRegTeacherForm({ ...regTeacherForm, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="Seu nome"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regTeacherForm.email}
                        onChange={(e) => setRegTeacherForm({ ...regTeacherForm, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="nome@academia.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Senha</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          value={regTeacherForm.password}
                          onChange={(e) => setRegTeacherForm({ ...regTeacherForm, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">WhatsApp</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regTeacherForm.phone}
                          onChange={(e) => setRegTeacherForm({ ...regTeacherForm, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                          placeholder="(11) 90000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 mt-4 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Criar Conta
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-outline-variant/30 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsAcademyRegisterMode(false)}
                      className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      Já tem cadastro? Entrar
                    </button>
                  </div>
                </form>
              </div>
            ) : isRegisterMode ? (
              /* STUDENT AUTO-REGISTRATION FORM */
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-white font-display-xl uppercase tracking-tight">Cadastro de Aluno</h2>
                  {inviteTeacher && (
                    <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                      Você foi convidado pelo(a) treinador(a) <span className="text-primary font-bold">{inviteTeacher.name}</span>.
                    </p>
                  )}
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="Ex: Carlos Silva"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Username de Acesso</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="Ex: carlos.silva"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 mt-4 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Entrar no App
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-outline-variant/30 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsRegisterMode(false)}
                      className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      Já tem acesso? Entrar
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* STANDARD LOGIN FORM */
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="lg:hidden text-center mb-6">
                  <h2 className="text-xl font-black text-white font-display-xl uppercase tracking-tight">Login</h2>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Credencial</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="Email ou Usuário"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Senha</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/50 rounded-2xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-bold text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 mt-2 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        ACESSAR SISTEMA
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {inviteId && (
                    <div className="text-center pt-4 border-t border-outline-variant/30 mt-4">
                      <button 
                        type="button" 
                        onClick={() => setIsRegisterMode(true)}
                        className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest hover:text-primary transition-colors"
                      >
                        Não tem conta? Cadastrar-se
                      </button>
                    </div>
                  )}

                  {inviteAcademyId && (
                    <div className="text-center pt-4 border-t border-outline-variant/30 mt-4">
                      <button 
                        type="button" 
                        onClick={() => setIsAcademyRegisterMode(true)}
                        className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest hover:text-primary transition-colors"
                      >
                        Cadastrar-se na Academia
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
          
          <p className="mt-8 text-on-surface-variant/40 text-[9px] text-center font-bold uppercase tracking-[0.3em]">
            Powered by VollonFit OS © 2026
          </p>
        </div>
      </div>
    </div>
  )
}

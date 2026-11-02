import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  Flame, 
  Users, 
  Trophy, 
  Brain, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  MessageCircle, 
  Star, 
  Sparkles, 
  Activity, 
  Clock, 
  Target, 
  Smartphone, 
  ChevronDown, 
  Menu, 
  X,
  Droplet,
  TrendingUp,
  Heart
} from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function LandingPage() {
  const navigate = useNavigate()
  const [priceBasic, setPriceBasic] = useState(30)
  const [pricePremium, setPricePremium] = useState(299)
  const [priceEnterprise, setPriceEnterprise] = useState(899)
  const [activeSection, setActiveSection] = useState('hero')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)

  // Scroll spy para a navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180
      const sections = ['hero', 'features', 'squads', 'b2b', 'pricing', 'faq']
      
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const { offsetTop, offsetHeight } = el
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleWhatsApp = (message) => {
    const url = `https://wa.me/5511922928343?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Preços dinâmicos da base de configurações
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await supabase.from('gym_settings').select('*')
        if (data) {
          const basic = data.find(item => item.key === 'price_per_student')
          if (basic) setPriceBasic(parseInt(basic.value) || 30)

          const premium = data.find(item => item.key === 'price_premium')
          if (premium) setPricePremium(parseInt(premium.value) || 299)

          const enterprise = data.find(item => item.key === 'price_enterprise')
          if (enterprise) setPriceEnterprise(parseInt(enterprise.value) || 899)
        }
      } catch (err) {
        console.error('Erro ao buscar preços:', err)
      }
    }
    fetchPrices()
  }, [])

  // Auto-redirect se já tiver sessão ativa
  useEffect(() => {
    const checkSession = async () => {
      try {
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

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (session.user.email === 'cf95.souza@gmail.com') {
            navigate('/master', { replace: true })
          } else {
            navigate('/admin', { replace: true })
          }
        }
      } catch (e) {
        console.warn("Erro ao checar sessão na Landing Page:", e)
      }
    }
    checkSession()
  }, [navigate])

  const faqs = [
    {
      q: "Como funciona o período de teste grátis?",
      a: "Você tem 7 dias de acesso completo a todas as ferramentas sem compromisso. Treinadores podem cadastrar alunos ilimitados e experimentar o IA Coach e Squads na prática."
    },
    {
      q: "Preciso baixar algum aplicativo na Apple Store ou Google Play?",
      a: "Não! O VollonFit utiliza tecnologia PWA (Progressive Web App). Basta abrir o link no celular e tocar em 'Adicionar à Tela de Início'. O app instala instantaneamente, funciona offline e não ocupa memória do aparelho."
    },
    {
      q: "Como funciona a gamificação e o Duelo do Casal?",
      a: "Alunos podem vincular suas contas com parceiros(as) ou amigos de treino. Cada treino e série concluída gera pontos em tempo real, gerando um ranking do casal, botão de lembrete 'Acordar' e feed de conquistas mútuas."
    },
    {
      q: "Sou personal trainer independente. O VollonFit serve para mim?",
      a: "Com certeza! O plano Personal Starter foi criado sob medida para autônomos. Você monta treinos em minutos com biblioteca completa de exercícios, acompanha a execução do aluno e gerencia o progresso individual com extrema facilidade."
    },
    {
      q: "Existe taxa de cancelamento ou fidelidade?",
      a: "Nenhuma. Você pode cancelar sua assinatura a qualquer momento com um único clique ou via suporte, sem burocracias ou multas."
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-body selection:bg-[#E11D2E]/30 selection:text-white overflow-x-hidden">
      
      {/* GLOWS DE FUNDO CINEMÁTICOS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#E11D2E]/10 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#9F0012]/10 rounded-full blur-[160px] pointer-events-none -z-0" />
      <div className="fixed bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#E11D2E]/8 rounded-full blur-[160px] pointer-events-none -z-0" />

      {/* TOP NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-[#2A2A2A]/80 transition-all">
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          
          {/* Logo VollonFit */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center group-hover:border-[#E11D2E]/60 transition-colors shadow-lg">
              <Dumbbell className="w-5 h-5 text-[#FF3B4A]" />
            </div>
            <span className="font-display text-2xl font-black tracking-tight uppercase">
              VOLLON<span className="text-[#E11D2E]">FIT</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSection === 'features' ? 'text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Tecnologia
            </a>
            <a 
              href="#squads" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSection === 'squads' ? 'text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Casal & Squads
            </a>
            <a 
              href="#b2b" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSection === 'b2b' ? 'text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Para Treinadores
            </a>
            <a 
              href="#pricing" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSection === 'pricing' ? 'text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Planos
            </a>
            <a 
              href="#faq" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSection === 'faq' ? 'text-[#FF3B4A]' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Dúvidas
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl border border-[#2A2A2A] text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] hover:bg-[#141414] transition-all cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => handleWhatsApp('Olá, quero iniciar meu teste grátis no VollonFit')}
              className="vollon-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <span>Testar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-white cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#101010] border-b border-[#2A2A2A] px-5 py-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white py-2"
            >
              Tecnologia & IA
            </a>
            <a 
              href="#squads" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white py-2"
            >
              Casal & Squads
            </a>
            <a 
              href="#b2b" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white py-2"
            >
              Para Treinadores e Academias
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white py-2"
            >
              Planos & Preços
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-[#A3A3A3] hover:text-white py-2"
            >
              Perguntas Frequentes
            </a>

            <div className="pt-4 border-t border-[#2A2A2A] grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login') }}
                className="w-full py-3 rounded-xl border border-[#2A2A2A] text-xs font-bold uppercase tracking-wider text-white bg-[#141414] text-center"
              >
                Entrar
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleWhatsApp('Olá, vim iniciar meu teste grátis no VollonFit') }}
                className="vollon-btn-primary w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white text-center"
              >
                Testar Grátis
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-24">

        {/* HERO SECTION */}
        <section id="hero" className="relative min-h-[90vh] flex items-center justify-center px-5 pt-12 pb-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 z-10 text-center lg:text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#2A2A2A] shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#E11D2E] animate-ping" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  PLATAFORMA FITNESS 2026 · ALTA PERFORMANCE
                </span>
              </div>

              {/* Título Principal */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[76px] font-black uppercase tracking-tight leading-[0.92] text-white">
                ELEVE SEU TREINO <br />
                <span className="bg-gradient-to-r from-white via-[#FFAAB1] to-[#FF3B4A] bg-clip-text text-transparent">
                  AO NÍVEL MÁXIMO.
                </span>
              </h1>

              {/* Subtítulo */}
              <p className="text-sm sm:text-base text-[#A3A3A3] font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                O ecossistema definitivo que une <strong>treino inteligente</strong>, <strong>IA preditiva</strong>, rastreamento de <strong>nutrição</strong> e o inédito <strong>duelo em tempo real para casais e squads</strong>.
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => handleWhatsApp('Olá, quero iniciar meu teste grátis de 7 dias no VollonFit')}
                  className="vollon-btn-primary w-full sm:w-auto h-14 px-8 rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(255,59,74,0.35)]"
                >
                  <Flame className="w-5 h-5" />
                  <span>Começar Teste de 7 Dias</span>
                </button>

                <button 
                  onClick={() => navigate('/login')}
                  className="vollon-btn-secondary w-full sm:w-auto h-14 px-8 rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:border-[#E11D2E] cursor-pointer"
                >
                  <span>Acessar Plataforma</span>
                  <ChevronRight className="w-4 h-4 text-[#A3A3A3]" />
                </button>
              </div>

              {/* Social Proof Badges */}
              <div className="pt-6 border-t border-[#2A2A2A]/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-white">+15.000</p>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Séries Salvas</p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-[#FF3B4A]">99.2%</p>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Assiduidade</p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-white">4.9 / 5.0</p>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider flex items-center justify-center lg:justify-start gap-1">
                    <Star className="w-3 h-3 text-[#FF3B4A] fill-current" /> Nota Média
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive App Cockpit Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] rounded-[36px] bg-[#141414] border-2 border-[#2A2A2A] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-4">
                
                {/* Mockup Status Bar */}
                <div className="flex justify-between items-center px-3 pt-1 text-[10px] text-[#A3A3A3] font-semibold">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D2E]" />
                    <span>5G</span>
                  </div>
                </div>

                {/* Mockup Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-display font-black text-white">
                      C
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">OLÁ, CAIO!</p>
                      <p className="text-[10px] text-[#FF3B4A] font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3" /> 4 treinos na semana
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 text-[9px] font-bold text-[#FF3B4A] uppercase">
                    PRO
                  </span>
                </div>

                {/* Mockup Widget: Treino Sugerido */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider">TREINO DO DIA</span>
                      <h4 className="font-display text-xl font-black uppercase text-white">SUPERIOR · PEITO + TRÍCEPS</h4>
                      <p className="text-[10px] text-[#A3A3A3]">5 exercícios · ~45 minutos</p>
                    </div>
                    {/* Anel de progresso em miniatura */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="#2A2A2A" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="16" stroke="#E11D2E" strokeWidth="3" fill="none" strokeDasharray="100" strokeDashoffset="40" strokeLinecap="round" />
                      </svg>
                      <span className="absolute font-display text-[10px] font-black text-white">3/5</span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E11D2E] to-[#FF3B4A] w-[60%]" />
                  </div>
                </div>

                {/* Mockup Widget: Duelo do Casal */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-[#FF3B4A] flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current" /> DUELO DO CASAL
                    </span>
                    <span className="text-white">SEMANA ATUAL</span>
                  </div>

                  {/* Versus Bar */}
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-white">CAIO (18)</span>
                    <span className="text-[10px] font-bold text-[#A3A3A3]">EMPATE</span>
                    <span className="text-white">THAIS (18)</span>
                  </div>
                  <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#E11D2E] w-1/2" />
                    <div className="h-full bg-white w-1/2" />
                  </div>
                </div>

                {/* Mockup Floating Pill Badge */}
                <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase">Novo Recorde (PR)</p>
                      <p className="text-[9px] text-[#A3A3A3]">Supino Reto: 104 kg</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-display font-black text-[#FF3B4A]">+4kg</span>
                </div>

              </div>

              {/* Background Glow behind mockup */}
              <div className="absolute inset-0 bg-[#E11D2E]/20 rounded-full blur-[90px] -z-10 transform scale-90" />
            </div>

          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-24 px-5 border-t border-[#2A2A2A]/60 relative">
          <div className="max-w-6xl mx-auto space-y-16">
            
            {/* Section Header */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#FF3B4A] uppercase tracking-widest">
                COCKPIT TECNOLÓGICO
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                POTÊNCIA EM CADA DETALHE DO SEU TREINO
              </h2>
              <p className="text-sm text-[#A3A3A3] font-medium leading-relaxed">
                Desenvolvido com foco absoluto em alta performance, robustez e estética esportiva contemporânea.
              </p>
            </div>

            {/* 6 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  IA Coach Nutricional 2.0
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Cálculo biométrico exato (Mifflin-St Jeor) com divisão customizada de calorias, proteínas, carboidratos e hidratação diária com registro rápido de copos de 250ml.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Smart Rest Timer & Séries
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Cronômetro inteligente que dispara ao salvar cada série, alerta com vibração no bolso e botões de carga/repetições com bloqueio anti-duplo clique para dados 100% confiáveis.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Hall de Recordes (PRs)
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Detecção automática de carga recorde por exercício histórico. Visualização em estante de troféus, calendário mensal de frequência e cálculo de volume bruto.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Squads & Duelo do Casal
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Vincule contas de treino, dispute quem completa mais séries na semana, envie alertas "Acordar" para quem estiver procrastinando e acompanhe o feed de treinos da sua dupla.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  PWA Mobile Ultra Rápido
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Instala direto pelo navegador no iOS e Android sem precisar passar por App Store. Carregamento veloz, suporte offline e zero consumo inútil de armazenamento no smartphone.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="vollon-card p-7 rounded-3xl space-y-4 hover:border-[#E11D2E]/60 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A] group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  Gestão B2B e Multi-tenant
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Painéis independentes para Treinador, Academia e Aluno. Prescrição de treinos em segundos, controle de mensalidades e proteção de dados de ponta a ponta.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SQUADS & CASAL HIGHLIGHT SECTION */}
        <section id="squads" className="py-24 px-5 bg-gradient-to-b from-[#0A0A0A] via-[#101010] to-[#0A0A0A] border-t border-[#2A2A2A]/60">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Duelo Mockup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="vollon-card p-6 rounded-3xl border border-[#2A2A2A] space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 text-[10px] font-bold text-[#FF3B4A] uppercase">
                    <Heart className="w-3.5 h-3.5 fill-current" /> DUELO DO CASAL
                  </div>
                  <span className="text-xs text-[#A3A3A3] font-bold">Semana 44</span>
                </div>

                {/* Placar 50 / 50 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-center space-y-1">
                    <p className="text-[10px] font-bold text-[#A3A3A3] uppercase">CAIO</p>
                    <p className="font-display text-4xl font-black text-white">18</p>
                    <p className="text-[10px] text-[#FF3B4A] font-semibold">SÉRIES FEITAS</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-center space-y-1">
                    <p className="text-[10px] font-bold text-[#A3A3A3] uppercase">THAIS</p>
                    <p className="font-display text-4xl font-black text-white">18</p>
                    <p className="text-[10px] text-white font-semibold">SÉRIES FEITAS</p>
                  </div>
                </div>

                {/* Barra do Duelo */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-[#A3A3A3]">
                    <span>50%</span>
                    <span className="text-white">PLACAR IGUALADO 🔥</span>
                    <span>50%</span>
                  </div>
                  <div className="h-3 w-full bg-[#0A0A0A] rounded-full overflow-hidden flex border border-[#2A2A2A]">
                    <div className="h-full bg-[#E11D2E] w-1/2" />
                    <div className="h-full bg-white w-1/2" />
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="vollon-btn-secondary p-3 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <span>🔔</span> Acordar parceira
                  </div>
                  <div className="vollon-btn-primary p-3 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <span>🔥</span> Chamar o bando
                  </div>
                </div>

              </div>
            </div>

            {/* Texto Descritivo */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-[#FF3B4A] uppercase tracking-widest">
                ENGAJAMENTO REAL & GAMIFICAÇÃO
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
                TREINE JUNTO. <br />
                <span className="text-[#E11D2E]">NUNCA MAIS PERCA A CONSTÂNCIA.</span>
              </h2>
              <p className="text-sm text-[#A3A3A3] font-medium leading-relaxed">
                Estudos comprovam que pessoas que treinam com compromisso mútuo têm <strong>3x mais chances de atingir seus objetivos físicos</strong>. No VollonFit, você e seu parceiro(a) acompanham o ranking semanal, comemoram novas cargas e se mantêm motivados diariamente.
              </p>

              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs font-semibold text-white">
                  <div className="w-5 h-5 rounded-full bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Notificação instantânea quando seu parceiro conclui o treino</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-semibold text-white">
                  <div className="w-5 h-5 rounded-full bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Feed de atividades cronológico com foto do dia e PRs batidos</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-semibold text-white">
                  <div className="w-5 h-5 rounded-full bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Bônus semanal de constância para manter a frequência acima de 4 dias</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* B2B TRAINERS & GYMS SECTION */}
        <section id="b2b" className="py-24 px-5 border-t border-[#2A2A2A]/60">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#FF3B4A] uppercase tracking-widest">
                SOLUÇÃO CORPORATIVA & SAAS
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                GESTÃO COMPLETA PARA TREINADORES E ACADEMIAS
              </h2>
              <p className="text-sm text-[#A3A3A3] font-medium leading-relaxed">
                Vá muito além da montagem de treinos. Tenha uma operação profissional, reduza o cancelamento e aumente o LTV dos seus alunos.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="vollon-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white">
                  Radar Anti-Evasão
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Identifique automaticamente alunos inativos há mais de 5 dias e receba alertas preditivos de risco de abandono antes que peçam cancelamento.
                </p>
              </div>

              <div className="vollon-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white">
                  White Label Exclusivo
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Seus alunos acessam com seu logotipo, cores e marca oficial. Uma presença digital de altíssimo padrão sem custo de desenvolvimento.
                </p>
              </div>

              <div className="vollon-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF3B4A]">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-black uppercase text-white">
                  Prescrição em 2 Minutos
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Biblioteca com centenas de exercícios em vídeo/GIFs, rotinas prontas de hipertrofia, força e emagrecimento prontas para clonar e customizar.
                </p>
              </div>

            </div>

            {/* Banner CTA B2B */}
            <div className="vollon-card p-8 sm:p-12 rounded-3xl border border-[#2A2A2A] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left z-10">
                <h3 className="font-display text-3xl sm:text-4xl font-black uppercase text-white">
                  PRECISA DE UMA SOLUÇÃO PARA REDE DE ACADEMIAS?
                </h3>
                <p className="text-xs sm:text-sm text-[#A3A3A3]">
                  Fale diretamente com nosso time comercial para planos corporativos com faturamento via boleto e SLA dedicado.
                </p>
              </div>
              <button 
                onClick={() => handleWhatsApp('Olá, vim saber mais sobre a solução corporativa do VollonFit para academias')}
                className="vollon-btn-primary h-14 px-8 rounded-2xl font-bold uppercase tracking-wider text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 z-10"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com Consultor B2B</span>
              </button>
            </div>

          </div>
        </section>

        {/* PRICING PLANS SECTION */}
        <section id="pricing" className="py-24 px-5 border-t border-[#2A2A2A]/60 relative">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#FF3B4A] uppercase tracking-widest">
                INVESTIMENTO TRANSPARENTE
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                PLANOS QUE ESCALAM COM SEU SUCESSO
              </h2>
              <p className="text-sm text-[#A3A3A3] font-medium leading-relaxed">
                Comece grátis por 7 dias. Cancele quando quiser, sem fidelidade ou contratos engessados.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* PLANO 1: STARTER */}
              <div className="vollon-card p-8 rounded-3xl flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-widest block">
                    INDEPENDENTE
                  </span>
                  <h3 className="font-display text-3xl font-black uppercase text-white">
                    Personal Starter
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Ideal para treinadores autônomos começando sua carteira online.
                  </p>
                  <div className="pt-2">
                    <span className="font-display text-5xl font-black text-white">R$ {priceBasic}</span>
                    <span className="text-xs text-[#A3A3A3] font-bold ml-1.5">/ aluno ativo</span>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-[#2A2A2A]">
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Alunos ilimitados
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Prescrição de treinos ágil
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> App do Atleta (PWA)
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Smart Rest Timer
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => handleWhatsApp('Olá, quero assinar o plano Personal Starter do VollonFit')}
                  className="vollon-btn-secondary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] transition-all cursor-pointer"
                >
                  Assinar Starter
                </button>
              </div>

              {/* PLANO 2: PRO (DESTAQUE) */}
              <div className="bg-[#141414] border-2 border-[#E11D2E] rounded-3xl p-8 flex flex-col justify-between space-y-8 relative shadow-[0_10px_40px_rgba(225,29,46,0.25)] md:-translate-y-3">
                
                {/* Badge Destaque */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#E11D2E] text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                  MAIS ESCOLHIDO
                </div>

                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-bold text-[#FF3B4A] uppercase tracking-widest block">
                    ALTA PERFORMANCE
                  </span>
                  <h3 className="font-display text-3xl font-black uppercase text-white">
                    Box / Studio PRO
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    A experiência definitiva com IA e gamificação para personal trainers de elite.
                  </p>
                  <div className="pt-2">
                    <span className="font-display text-5xl font-black text-white">R$ {pricePremium}</span>
                    <span className="text-xs text-[#A3A3A3] font-bold ml-1.5">/ mês</span>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-[#2A2A2A]">
                    <li className="flex items-center gap-2.5 text-xs text-white font-semibold">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Tudo do Starter incluído
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-white font-semibold">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> IA Coach Nutricional 2.0
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-white font-semibold">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Squads & Duelo do Casal
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-white font-semibold">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> White Label com Sua Marca
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-white font-semibold">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Hall de Recordes e Bioimpedância
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => handleWhatsApp('Olá, quero iniciar meu teste grátis no plano PRO do VollonFit')}
                  className="vollon-btn-primary w-full h-14 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_rgba(255,59,74,0.4)] cursor-pointer"
                >
                  Começar 7 Dias Grátis
                </button>
              </div>

              {/* PLANO 3: ENTERPRISE */}
              <div className="vollon-card p-8 rounded-3xl flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-widest block">
                    REDE DE ACADEMIAS
                  </span>
                  <h3 className="font-display text-3xl font-black uppercase text-white">
                    Rede Enterprise
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Gestão centralizada para múltiplas unidades, franquias e estúdios.
                  </p>
                  <div className="pt-2">
                    <span className="font-display text-5xl font-black text-white">R$ {priceEnterprise}</span>
                    <span className="text-xs text-[#A3A3A3] font-bold ml-1.5">/ mês</span>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-[#2A2A2A]">
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Tudo do plano PRO
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Multi-filiais e professores
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Dashboard financeiro consolidado
                    </li>
                    <li className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Check className="w-4 h-4 text-[#FF3B4A]" /> Suporte VIP & Treinamento
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => handleWhatsApp('Olá, quero conversar sobre o plano Rede Enterprise do VollonFit')}
                  className="vollon-btn-secondary w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#E11D2E] transition-all cursor-pointer"
                >
                  Falar com Consultor
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24 px-5 border-t border-[#2A2A2A]/60">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#FF3B4A] uppercase tracking-widest">
                TIRE SUAS DÚVIDAS
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                PERGUNTAS FREQUENTES
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx
                return (
                  <div 
                    key={idx}
                    className="vollon-card rounded-2xl border border-[#2A2A2A] overflow-hidden transition-all"
                  >
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="font-bold text-sm text-white">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-[#FF3B4A] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-[#A3A3A3] leading-relaxed border-t border-[#2A2A2A]/40 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A2A] bg-[#0A0A0A] py-12 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-[#FF3B4A]" />
            </div>
            <span className="font-display text-2xl font-black tracking-tight uppercase">
              VOLLON<span className="text-[#E11D2E]">FIT</span>
            </span>
          </div>

          <p className="text-xs text-[#A3A3A3] text-center md:text-left">
            © 2026 VollonFit Performance Systems. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-6 text-xs text-[#A3A3A3]">
            <button 
              onClick={() => navigate('/login')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Área de Membros
            </button>
            <button 
              onClick={() => handleWhatsApp('Olá, preciso de suporte no VollonFit')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Suporte WhatsApp
            </button>
          </div>

        </div>
      </footer>

    </div>
  )
}

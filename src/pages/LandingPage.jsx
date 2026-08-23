import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LandingPage() {
  const navigate = useNavigate();
  const [priceBasic, setPriceBasic] = useState(30);
  const [pricePremium, setPricePremium] = useState(299);
  const [priceEnterprise, setPriceEnterprise] = useState(899);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // 150px é um offset para compensar a navbar fixa
      const scrollPosition = window.scrollY + 150; 
      
      const sections = ['hero', 'features', 'solutions', 'pricing'];
      
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const { offsetTop, offsetHeight } = el;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Chama uma vez para setar o estado inicial
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsApp = (message) => {
    const url = `https://wa.me/5511922928343?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await supabase.from('gym_settings').select('*');
        if (data) {
          const basic = data.find(item => item.key === 'price_per_student');
          if (basic) setPriceBasic(parseInt(basic.value) || 30);

          const premium = data.find(item => item.key === 'price_premium');
          if (premium) setPricePremium(parseInt(premium.value) || 299);

          const enterprise = data.find(item => item.key === 'price_enterprise');
          if (enterprise) setPriceEnterprise(parseInt(enterprise.value) || 899);
        }
      } catch (err) {
        console.error('Erro ao buscar preços:', err);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const student = localStorage.getItem('vollonfit_user');
        if (student) {
          navigate('/student', { replace: true });
          return;
        }

        const teacher = localStorage.getItem('vollonfit_teacher');
        if (teacher) {
          navigate('/admin', { replace: true });
          return;
        }

        const academy = localStorage.getItem('vollonfit_academy');
        if (academy) {
          navigate('/academy', { replace: true });
          return;
        }

        // Verifica sessão ativa do Supabase (para o Master Admin)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (session.user.email === 'cf95.souza@gmail.com') {
            navigate('/master', { replace: true });
          } else {
            navigate('/admin', { replace: true });
          }
        }
      } catch (e) {
        console.warn("Erro ao checar sessão na Landing Page:", e);
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="w-full flex-1 bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container h-full min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed w-full z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <span className="material-symbols-outlined text-primary-container text-3xl glow-effect">fitness_center</span>
            <span className="text-headline-md font-headline-md font-black text-primary tracking-tight">VollonFit</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a 
              className={`font-body-md text-body-md transition-colors ${activeSection === 'features' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
              href="#features">Produto</a>
            <a 
              className={`font-body-md text-body-md transition-colors ${activeSection === 'solutions' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
              href="#solutions">Soluções</a>
            <a 
              className={`font-body-md text-body-md transition-colors ${activeSection === 'pricing' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
              href="#pricing">Planos</a>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/login')} className="font-label-caps text-on-surface-variant hover:text-on-surface transition-colors text-xs uppercase tracking-widest hidden sm:block">Entrar</button>
             <button 
                onClick={() => handleWhatsApp('Olá vim realizar a minha assinatura do VollonFit')}
                className="hidden md:flex items-center gap-2 bg-primary-container text-on-primary font-label-caps text-xs px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(195,244,0,0.4)] transition-all hover:-translate-y-0.5"
             >
                Start Free Trial
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
             </button>
             <button className="md:hidden text-primary" onClick={() => navigate('/login')}>
                <span className="material-symbols-outlined text-2xl">menu</span>
             </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-gutter overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-highest via-background to-background opacity-80 -z-10"></div>
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-tertiary-container/5 rounded-full blur-[120px] -z-10"></div>
          
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl items-center w-full">
            <div className="flex flex-col items-start z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant bg-surface-container-high/50 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">SaaS para Treinadores e Academias</span>
              </div>
              <h1 className="font-display-xl text-5xl md:text-display-xl text-primary leading-tight mb-6 tracking-tight">
                Transforme sua <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-tertiary-fixed">gestão de treinos</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
                A plataforma definitiva que combina inteligência artificial, gamificação e gestão robusta para elevar o desempenho dos seus alunos e o faturamento do seu negócio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => handleWhatsApp('Olá vim para resgatar meus 7 dias gratis do VollonFit')} 
                  className="flex items-center justify-center gap-2 bg-primary-container text-on-primary font-headline-md text-sm md:text-headline-md px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(195,244,0,0.5)] transition-all transform hover:-translate-y-1"
                >
                  <span className="material-symbols-outlined">chat</span>
                  Teste Grátis Agora
                </button>
                <a href="#features" className="flex items-center justify-center gap-2 bg-transparent text-primary font-headline-md text-sm md:text-headline-md px-8 py-4 rounded-xl border-2 border-primary-container hover:bg-primary-container/10 transition-colors">
                  Ver Funcionalidades
                </a>
              </div>
            </div>
            
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square z-10 flex items-center justify-center mt-10 lg:mt-0">
              {/* Dashboard Preview Hero Image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-high to-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
                <img 
                  alt="A sleek, modern high-tech dashboard interface displayed on a tablet device, angled slightly to show depth. The screen displays complex fitness data charts, glowing neon green and blue progress rings, and a dark mode UI. The background is a dimly lit, professional high-performance gym with subtle lens flares and a cinematic atmosphere." 
                  className="w-full h-full object-cover opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_ifNwcDIGsVOIvlmjyDzZR_dYU2z-7FK3BvPYIAaAVZugSPBlPX1AGKk2QfPXqNXJKMc9uSs3_adJduj9Cc2SkvM8WO5LjWtaYTx4oogMg8fWaf60TPj2mNsTm1iep4XHYHGanvbMF-jJhNYlP2i2JcYdYiUkP53Die9m9PUsEqBASQPBUSRsIGyXZa6M_ioJVYGtMZJBuMwxjqw1h4eKevzxpAPmWSoEXPIeCEa6Lfle_qNpfFix"
                />
                
                {/* Floating Glass Elements overlay */}
                <div className="absolute top-1/4 -left-8 md:left-[-20px] glass-panel p-4 rounded-xl shadow-lg flex items-center gap-3 animate-[float_4s_ease-in-out_infinite]">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary">trending_up</span>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">1RM PREDICT</p>
                    <p className="font-data-display text-sm text-primary">+15% FORÇA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-gutter bg-surface-container-lowest relative">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-3xl md:text-headline-lg text-primary mb-4 tracking-tight">Potência em cada funcionalidade</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Tecnologia desenvolvida para o esporte de alto rendimento, acessível para o seu box ou academia.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel rounded-2xl p-8 hover:border-primary-container/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center mb-6 group-hover:bg-primary-container/20 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-primary-container">psychology</span>
                </div>
                <h3 className="font-headline-md text-xl text-primary mb-3">IA Coach 2.0</h3>
                <p className="font-body-md text-sm text-on-surface-variant">Predição de 1RM em tempo real e ajustes dinâmicos de carga baseados no histórico de fadiga e performance do atleta.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="glass-panel rounded-2xl p-8 hover:border-tertiary-fixed/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center mb-6 group-hover:bg-tertiary-fixed/20 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-tertiary-fixed">groups</span>
                </div>
                <h3 className="font-headline-md text-xl text-primary mb-3">Squads & Gamificação</h3>
                <p className="font-body-md text-sm text-on-surface-variant">Crie comunidades engajadas. Leaderboards ao vivo, badges de conquista e interação social estilo rede para motivar treinos.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="glass-panel rounded-2xl p-8 hover:border-primary-container/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center mb-6 group-hover:bg-primary-container/20 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-primary-container">admin_panel_settings</span>
                </div>
                <h3 className="font-headline-md text-xl text-primary mb-3">Gestão Multi-tenant</h3>
                <p className="font-body-md text-sm text-on-surface-variant">Administre múltiplas filiais, treinadores e milhares de alunos em um único painel centralizado com permissões granulares.</p>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Enterprise Section */}
        <section id="solutions" className="py-20 px-gutter relative overflow-hidden">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
            
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden glass-panel h-[400px] md:h-[500px]">
              <img 
                alt="A detailed view of a dark mode business intelligence dashboard for a gym management software. Highlighting revenue graphs in bright neon green, member retention charts, and active user counters. The UI is sleek, data-dense, with a professional B2B SaaS aesthetic, sharply focused with soft ambient lighting around the edges." 
                className="w-full h-full object-cover opacity-70 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbq6HqT2FE1EGlxUSePV1Q7SCaiHzRPaQ-HzFT0UMKnaIHbrUV0P4saIYxDsEX5B7XSQ-kGILVNC6Nn1HAUmq7ctfpesZk6pDTtZnhzlc6KQv6ygXRk3mlUZXxAPQ4ieaZsSH0zHZ3lvnw_pa8UD-m4FxRmsLJpkmhuzKwKzD1gt5JOAB9o7FwFCF1Mh8ggzKQ8zzB0hQl3ZFM9gAufYwH28_X4cUBnYJ5wyeAjytX_WJ1nYDIvTL1"
              />
              
              {/* Data overlay components */}
              <div className="absolute bottom-6 left-6 right-6 bg-surface-container-highest/80 backdrop-blur-md rounded-xl p-6 border border-outline-variant/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">KPIs da Unidade Principal</span>
                  <span className="material-symbols-outlined text-primary-container">more_horiz</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-data-display text-2xl text-primary block">R$ 145k</span>
                    <span className="font-label-caps text-[10px] text-tertiary-fixed flex items-center gap-1 mt-1 uppercase"><span className="material-symbols-outlined text-xs">arrow_upward</span> +12% MRR</span>
                  </div>
                  <div>
                    <span className="font-data-display text-2xl text-primary block">98.2%</span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1 mt-1 uppercase">Retenção Ativa</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="font-headline-lg text-3xl md:text-headline-lg text-primary mb-6 tracking-tight">Gestão completa para sua academia</h2>
              <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant mb-8">
                Vá além da montagem de treinos. Nossa solução B2B oferece uma visão 360º da saúde financeira e engajamento do seu negócio. Controle assinaturas, automatize cobranças e preveja churn com nossa IA.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-1">check_circle</span>
                  <span className="font-body-md text-sm md:text-body-md text-on-surface">Dashboard de performance financeira em tempo real.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-1">check_circle</span>
                  <span className="font-body-md text-sm md:text-body-md text-on-surface">Integração com principais gateways de pagamento.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-1">check_circle</span>
                  <span className="font-body-md text-sm md:text-body-md text-on-surface">CRM focado em aquisição e retenção de alunos.</span>
                </li>
              </ul>
              <button 
                onClick={() => handleWhatsApp('Olá vim para falar com um especialista B2B do VollonFit')}
                className="inline-flex items-center gap-2 text-primary-container hover:text-primary font-headline-md text-sm md:text-headline-md border-b-2 border-primary-container pb-1 transition-colors bg-transparent p-0"
              >
                Falar com Especialista B2B <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-gutter bg-surface-container-lowest relative">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-3xl md:text-headline-lg text-primary mb-4 tracking-tight">Planos que escalam com você</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Invista na tecnologia que os profissionais usam. Sem taxas ocultas.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              
              {/* Basic Plan */}
              <div className="glass-panel rounded-2xl p-8 flex flex-col">
                <h3 className="font-headline-md text-xl text-primary mb-2">Personal Starter</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-6">Para treinadores independentes.</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="font-display-xl text-5xl text-primary">R${priceBasic}</span>
                  <span className="font-body-md text-sm text-on-surface-variant">/aluno</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Gestão de alunos ilimitada</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Montagem de treinos básica</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">App do Atleta (PWA)</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handleWhatsApp('Olá vim realizar a minha assinatura do plano Professor Basic do VollonFit')}
                  className="w-full py-3 rounded-lg border border-primary-container text-primary-container font-headline-md text-sm text-center hover:bg-primary-container/10 transition-colors"
                >
                  Assinar Starter
                </button>
              </div>
              
              {/* Premium Plan */}
              <div className="bg-surface-container-high rounded-2xl p-8 flex flex-col relative border-2 border-primary-container transform md:-translate-y-4 shadow-[0_0_30px_rgba(195,244,0,0.15)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary font-label-caps text-[10px] px-4 py-1 rounded-full uppercase">
                  MAIS POPULAR
                </div>
                <h3 className="font-headline-md text-xl text-primary mb-2">Box / Studio PRO</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-6">A experiência completa para seu espaço.</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="font-display-xl text-5xl text-primary">R${pricePremium}</span>
                  <span className="font-body-md text-sm text-on-surface-variant">/aluno</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Tudo do Starter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface font-bold text-white">White Label & Personalização</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface font-bold text-white">IA Coach & Nutrição 2.0</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Squads e Gamificação GymRats</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handleWhatsApp('Olá vim realizar a minha assinatura do plano Professor Premium do VollonFit')}
                  className="w-full py-3 rounded-lg bg-primary-container text-on-primary font-headline-md text-sm text-center hover:shadow-[0_0_15px_rgba(195,244,0,0.4)] transition-all glow-effect"
                >
                  Começar Trial de 14 Dias
                </button>
              </div>
              
              {/* Enterprise Plan */}
              <div className="glass-panel rounded-2xl p-8 flex flex-col">
                <h3 className="font-headline-md text-xl text-primary mb-2">Rede Enterprise</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-6">Gestão em escala para múltiplas unidades.</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="font-display-xl text-5xl text-primary">R${priceEnterprise}</span>
                  <span className="font-body-md text-sm text-on-surface-variant">/mês (base)</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Tudo do plano PRO</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Painel Multi-unidades (Academias)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Integração Marketplace B2B</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-1">check</span>
                    <span className="font-body-md text-sm text-on-surface">Gerente de Conta Dedicado</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handleWhatsApp('Olá vim realizar a minha assinatura do plano Academia Enterprise do VollonFit')}
                  className="w-full py-3 rounded-lg border border-outline-variant text-primary font-headline-md text-sm text-center hover:border-primary transition-colors bg-transparent"
                >
                  Falar com Consultor
                </button>
              </div>
              
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="w-full py-10 px-gutter flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <span className="material-symbols-outlined text-primary-container text-2xl">fitness_center</span>
            <span className="font-headline-md text-headline-md text-primary tracking-tight">VollonFit</span>
          </div>
          <div className="text-center md:text-left mb-6 md:mb-0">
            <p className="font-body-md text-sm text-on-surface-variant">© 2026 VollonFit Performance Systems</p>
          </div>
          <div className="flex gap-6">
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Política de Privacidade</a>
            <a className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Termos de Uso</a>
            <button onClick={() => handleWhatsApp('Olá vim pedir ajuda no suporte do VollonFit')} className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors bg-transparent p-0">Contato Comercial</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
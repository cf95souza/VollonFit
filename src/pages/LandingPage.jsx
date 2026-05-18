import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, ArrowRight, CheckCircle2, Zap, Shield, Smartphone } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function LandingPage() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-black shadow-[0_0_15px_rgba(223,255,94,0.3)]">
              <Gem className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white font-display">
              VOLLON<span className="text-primary font-normal text-sm ml-0.5">FIT</span>
            </span>
          </div>
          <div className="flex gap-2 sm:gap-4 items-center">
            <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white font-bold px-3 py-2 transition-colors text-sm sm:text-base">Entrar</button>
            <button onClick={() => navigate('/login')} className="hidden sm:block bg-primary hover:bg-primary-dark text-black px-6 py-2 rounded-full font-black uppercase text-sm tracking-widest transition-all shadow-lg shadow-primary/20 hover:scale-105">Assinar Agora</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pb-10 md:pb-20 px-6 max-w-7xl mx-auto text-center relative animate-in fade-in duration-1000" style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top))' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        <h1 className="text-4xl md:text-7xl font-black text-white font-display leading-tight mb-6 relative z-10">
          A Plataforma Definitiva para <br className="hidden md:block" />
          <span className="text-primary drop-shadow-[0_0_25px_rgba(223,255,94,0.5)]">Personal Trainers</span> e <span className="text-white">Academias</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-medium relative z-10">
          Transforme a forma como você prescreve treinos, gerencia pagamentos e engaja seus alunos. Tudo em um único ecossistema SaaS poderoso e White Label.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <button onClick={() => navigate('/login')} className="bg-primary text-black px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20">
            Comece seu Teste Grátis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-10 md:py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white font-display mb-4">Planos que crescem com você</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Simples, transparente e escalável</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic */}
          <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] flex flex-col hover:border-white/10 transition-all">
            <h3 className="text-xl font-black text-white mb-2">Professor Basic</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">R$ 30</span>
              <span className="text-slate-500 font-bold text-sm">/aluno/mês</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Gestão de Alunos Ilimitada
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Prescrição de Treinos
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 font-medium line-through">
                Personalização White Label
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 font-medium line-through">
                IA Coach para Alunos
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Começar Agora</button>
          </div>

          {/* Premium */}
          <div className="bg-[#111111] border-2 border-primary p-8 rounded-[40px] flex flex-col relative md:scale-105 shadow-2xl shadow-primary/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mais Popular</div>
            <h3 className="text-xl font-black text-white mb-2">Professor Premium</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">R$ 45</span>
              <span className="text-slate-500 font-bold text-sm">/aluno/mês</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Tudo do Plano Basic
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> <b>Personalização White Label</b>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> <b>IA Coach para Alunos</b>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Aba de Nutrição Exclusiva
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:bg-primary-dark transition-all">Assinar Premium</button>
          </div>

          {/* Enterprise */}
          <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] flex flex-col hover:border-white/10 transition-all">
            <h3 className="text-xl font-black text-white mb-2">Academia Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">R$ 899</span>
              <span className="text-slate-500 font-bold text-sm">/mês fixo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Até 10 Professores
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Alunos Ilimitados
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> White Label para toda a Rede
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Dashboard de Gestão Macro
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Falar com Consultor</button>
          </div>
        </div>
      </section>

    </div>
  );
}
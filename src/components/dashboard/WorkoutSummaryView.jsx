import React from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function WorkoutSummaryView({ summary, workout, onClose }) {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans max-w-md mx-auto animate-in fade-in duration-500 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-primary/20">
          <CheckCircle2 className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(223,255,94,0.8)]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white font-display">Treino Concluído!</h2>
          <p className="text-slate-400 font-medium">Você esmagou o {workout?.name} hoje.</p>
        </div>

        <div className="w-full bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-2">Volume Total de Carga</p>
            <p className="text-5xl font-black text-primary font-display">{summary?.totalWeight || 0}<span className="text-xl font-bold ml-1 text-primary/70">kg</span></p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Exercícios</p>
              <p className="text-xl font-bold text-white font-display">{(summary?.exerciseLogs || []).length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
              <p className="text-xl font-bold text-primary font-display">Evoluindo</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-white text-black font-black py-5 rounded-[32px] active:scale-95 transition-all text-lg shadow-xl shadow-white/10 uppercase tracking-widest font-display"
        >
          Voltar para Home
        </button>
      </main>
    </div>
  )
}

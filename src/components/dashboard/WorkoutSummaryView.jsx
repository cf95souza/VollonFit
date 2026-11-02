import React from 'react'
import { Trophy, CheckCircle2 } from 'lucide-react'

export default function WorkoutSummaryView({ summary, workout, onClose }) {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col font-body max-w-md mx-auto animate-in fade-in duration-500 relative px-6 py-10 justify-between">
      
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#E11D2E]/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10 my-auto">
        
        {/* Ícone Troféu com Glow */}
        <div className="w-20 h-20 bg-[#141414] border border-[#2A2A2A] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(225,29,46,0.5)]">
          <Trophy className="w-10 h-10 text-[#FF3B4A]" />
        </div>
        
        <div className="space-y-1">
          <h2 className="font-display text-4xl font-black uppercase text-white tracking-tight">
            TREINO CONCLUÍDO!
          </h2>
          <p className="text-sm text-[#A3A3A3] font-medium">
            Você finalizou o {workout?.name || 'treino'} com sucesso.
          </p>
        </div>

        {/* Card de Volume e Estatísticas */}
        <div className="w-full vollon-card p-6 rounded-3xl space-y-5">
          <div>
            <p className="text-[11px] text-[#A3A3A3] font-bold uppercase tracking-widest mb-1">
              VOLUME TOTAL DE CARGA
            </p>
            <p className="font-display text-5xl font-black text-white leading-none">
              {summary?.totalWeight || 0}
              <span className="font-display text-2xl font-bold ml-1 text-[#FF3B4A]">KG</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#2A2A2A]">
            <div className="vollon-card-elevated p-3 rounded-2xl">
              <p className="text-[10px] text-[#A3A3A3] font-bold uppercase mb-0.5">Séries / Logs</p>
              <p className="font-display text-2xl font-black text-white leading-none">
                {(summary?.exerciseLogs || []).length}
              </p>
            </div>
            <div className="vollon-card-elevated p-3 rounded-2xl">
              <p className="text-[10px] text-[#A3A3A3] font-bold uppercase mb-0.5">Status</p>
              <p className="font-display text-2xl font-black text-[#FF3B4A] leading-none">
                Evoluindo
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="w-full relative z-10 pt-4">
        <button 
          onClick={onClose}
          className="vollon-btn-primary w-full h-[54px] rounded-2xl font-bold uppercase tracking-wider text-base cursor-pointer"
        >
          Voltar para Início
        </button>
      </div>

    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  ClipboardList,
  Trophy, 
  Medal, 
  Star, 
  Users,
  RefreshCw,
  Bell
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function ProfileTab({ student, totalWorkouts = 0, onOpenConfig, onOpenGoals, showToast, onLogout }) {
  const achievements = [
    { id: 1, name: 'Primeiro Passo', desc: 'Completou 1 treino', icon: <Star className="w-6 h-6 text-[#FF3B4A]" />, unlocked: totalWorkouts >= 1 },
    { id: 2, name: 'Constância', desc: 'Completou 10 treinos', icon: <Medal className="w-6 h-6 text-slate-300" />, unlocked: totalWorkouts >= 10 },
    { id: 3, name: 'Rato de Academia', desc: 'Completou 50 treinos', icon: <Trophy className="w-6 h-6 text-[#E11D2E]" />, unlocked: totalWorkouts >= 50 },
    { id: 4, name: 'Membro do Bando', desc: 'Entrou em um Squad', icon: <Users className="w-6 h-6 text-white" />, unlocked: !!student?.id },
  ]

  return (
    <div className="animate-in fade-in duration-500 text-center py-6 space-y-8 pb-32">
      
      {/* Avatar e Nome */}
      <div>
        <div className="w-28 h-28 bg-gradient-to-b from-[#E11D2E] to-[#9F0012] rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-[#2A2A2A] shadow-[0_0_24px_rgba(225,29,46,0.4)] text-white text-5xl font-black font-display">
          {student?.name?.[0] || 'C'}
        </div>
        <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">{student?.name}</h2>
        <p className="text-[#A3A3A3] font-bold tracking-widest uppercase text-xs mt-1">@{student?.username}</p>
      </div>

      {/* Sala de Troféus / Conquistas */}
      <div className="vollon-card p-6 rounded-3xl space-y-4">
        <div className="text-left">
          <h3 className="font-black text-white font-display text-xl uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF3B4A]" /> Sala de Troféus
          </h3>
          <p className="text-[11px] text-[#A3A3A3] font-bold uppercase tracking-wider">Suas conquistas desbloqueadas</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {achievements.map(ach => (
            <div key={ach.id} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
              ach.unlocked 
                ? 'bg-[#1A1A1A] border-[#2A2A2A]' 
                : 'bg-[#101010] border-[#2A2A2A]/40 opacity-40 grayscale'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center">
                {ach.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-white uppercase">{ach.name}</p>
                <p className="text-[10px] text-[#A3A3A3] mt-0.5">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button 
          onClick={onOpenConfig}
          className="w-full p-4.5 px-5 text-left vollon-card rounded-2xl flex items-center justify-between group hover:border-[#E11D2E]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] group-hover:text-white transition-colors">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">Configurações da Conta</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A3A3A3] group-hover:text-white transition-colors" />
        </button>

        <button 
          onClick={onOpenGoals}
          className="w-full p-4.5 px-5 text-left vollon-card rounded-2xl flex items-center justify-between group hover:border-[#E11D2E]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] group-hover:text-white transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">Metas e Objetivos</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A3A3A3] group-hover:text-white transition-colors" />
        </button>

        {/* Atualizar App (Limpar Cache) */}
        <button 
          onClick={() => {
            if (window.confirm('Deseja atualizar o aplicativo? Isso irá limpar o cache e carregar a versão mais recente.')) {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for (let registration of registrations) {
                    registration.unregister()
                  }
                  window.location.reload(true)
                })
              } else {
                window.location.reload(true)
              }
            }
          }}
          className="w-full p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center gap-2.5 hover:border-[#E11D2E]/40 transition-all text-[#A3A3A3] hover:text-white text-xs font-bold uppercase cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar App (Limpar Cache)</span>
        </button>

        {/* Notificações Push */}
        <button 
          onClick={() => {
            if (!("Notification" in window)) {
              showToast("Seu navegador não suporta notificações.", "error")
              return
            }
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                showToast("Notificações ativadas com sucesso!")
              } else if (permission === "denied") {
                showToast("Você bloqueou as notificações. Ative nas configurações do navegador.", "error")
              } else {
                showToast("Permissão não concedida.", "error")
              }
            })
          }}
          className="w-full p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center gap-2.5 hover:border-[#E11D2E]/40 transition-all text-[#A3A3A3] hover:text-white text-xs font-bold uppercase cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span>Ativar Notificações Push</span>
        </button>

        {/* Sair da Conta */}
        <button 
          onClick={onLogout}
          className="w-full p-4 rounded-2xl bg-[#E11D2E]/10 border border-[#E11D2E]/30 flex items-center justify-center gap-2.5 hover:bg-[#E11D2E]/20 transition-all text-[#FF3B4A] text-xs font-bold uppercase cursor-pointer mt-4"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

    </div>
  )
}

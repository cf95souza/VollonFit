import { useState, useEffect } from 'react'
import { 
  Plus, 
  Heart, 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  ClipboardList 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { Trophy, Medal, Star, Shield, Users } from 'lucide-react'

export default function ProfileTab({ student, totalWorkouts = 0, onOpenConfig, onOpenGoals, showToast, onLogout }) {
  const [allStudents, setAllStudents] = useState([])
  const [isLinking, setIsLinking] = useState(false)
  const [search, setSearch] = useState('')
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!student?.id) return
      try {
        const { data } = await supabase.from('gym_students').select('id, name, username').neq('id', student.id)
        if (data) setAllStudents(data)
      } catch (e) {
        console.warn("Erro ao buscar alunos:", e)
      }
    }
    fetchStudents()
  }, [student?.id])

  const achievements = [
    { id: 1, name: 'Primeiro Passo', desc: 'Completou 1 treino', icon: <Star className="w-6 h-6 text-yellow-500" />, unlocked: totalWorkouts >= 1 },
    { id: 2, name: 'Constância', desc: 'Completou 10 treinos', icon: <Medal className="w-6 h-6 text-slate-300" />, unlocked: totalWorkouts >= 10 },
    { id: 3, name: 'Rato de Academia', desc: 'Completou 50 treinos', icon: <Trophy className="w-6 h-6 text-amber-500" />, unlocked: totalWorkouts >= 50 },
    { id: 4, name: 'Membro do Bando', desc: 'Entrou em um Squad', icon: <Users className="w-6 h-6 text-blue-500" />, unlocked: !!student?.id },
  ]

  return (
    <div className="animate-in fade-in duration-500 text-center py-10 space-y-12 pb-32">
      <div>
        <div className="w-32 h-32 fitness-gradient rounded-[40px] flex items-center justify-center mx-auto mb-6 border-4 border-[#1A1A1A] shadow-2xl text-black text-5xl font-black font-display neon-shadow">
          {student?.name?.[0]}
        </div>
        <h2 className="text-3xl font-black text-white font-display">{student?.name}</h2>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs mt-2">@{student?.username}</p>
      </div>
      

      {/* CONQUISTAS */}
      <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
        <div className="text-left">
          <h3 className="font-black text-white font-display text-lg tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Sala de Troféus
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Suas conquistas desbloqueadas</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {achievements.map(ach => (
            <div key={ach.id} className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all ${
              ach.unlocked 
                ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(223,255,94,0.1)]' 
                : 'bg-black/50 border-white/5 opacity-50 grayscale'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                ach.unlocked ? 'bg-black' : 'bg-white/5'
              }`}>
                {ach.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-white uppercase">{ach.name}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onOpenConfig}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Configurações da Conta</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        <button 
          onClick={onOpenGoals}
          className="w-full p-8 text-left bg-[#1A1A1A] rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="font-black text-white font-display text-lg tracking-tight">Metas e Objetivos</span>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
        </button>

        {/* UPDATE APP BUTTON */}
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
          className="w-full mt-4 p-6 text-center bg-primary/10 rounded-[32px] border border-primary/20 flex items-center justify-center gap-3 hover:bg-primary hover:text-black transition-all text-primary active:scale-95 shadow-xl shadow-primary/5"
        >
          <Plus className="w-5 h-5 rotate-45" />
          <span className="font-black uppercase tracking-widest font-display text-sm">Atualizar App (Limpar Cache)</span>
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={onLogout}
          className="w-full mt-4 p-6 text-center bg-rose-500/10 rounded-[32px] border border-rose-500/20 flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all text-rose-500 active:scale-95 shadow-xl shadow-rose-500/5"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest font-display text-sm">Sair da Conta</span>
        </button>
      </div>
    </div>
  )
}

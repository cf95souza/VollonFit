import { useState, useEffect } from 'react'
import { Users, Copy, CheckCircle2, UserPlus, LogOut, Trophy, Target, Trash2, XCircle, MessageSquare, Activity, BellRing, Moon } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import SquadLeaderboard from './SquadLeaderboard'

export default function SquadTab({ student, showToast }) {
  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  
  const [newSquadName, setNewSquadName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPingingSquad, setIsPingingSquad] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)

  const fetchSquadInfo = async () => {
    setIsLoading(true)
    try {
      // Verifica se o aluno pertence a algum squad
      const { data: memberData, error: memberError } = await supabase
        .from('gym_squad_members')
        .select('squad_id, role')
        .eq('student_id', student.id)
        .maybeSingle()
      
      if (memberError) throw memberError

      if (memberData) {
        // Busca os dados do Squad
        const { data: squadData, error: squadError } = await supabase
          .from('gym_squads')
          .select('*')
          .eq('id', memberData.squad_id)
          .single()
        
        if (squadError) throw squadError
        setSquad({ ...squadData, myRole: memberData.role })

        // Busca os membros com um JOIN na tabela de estudantes (fazendo 2 queries pela simplicidade do custom auth)
        const { data: squadMembers, error: membersError } = await supabase
          .from('gym_squad_members')
          .select('student_id, role, joined_at')
          .eq('squad_id', squadData.id)
          .order('joined_at', { ascending: true })
        
        if (membersError) throw membersError

        const studentIds = squadMembers.map(m => m.student_id)
        
        const { data: studentsData, error: stError } = await supabase
          .from('gym_students')
          .select('id, name, username')
          .in('id', studentIds)
          
        if (stError) throw stError

        // Verificar inatividade (> 3 dias)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const limitDateStr = threeDaysAgo.toISOString().split('T')[0]

        const { data: recentLogs } = await supabase
          .from('gym_training_logs')
          .select('student_id, workout_date')
          .in('student_id', studentIds)
          .gte('workout_date', limitDateStr)
          
        const activeIds = new Set((recentLogs || []).map(l => l.student_id))

        const formattedMembers = squadMembers.map(m => {
          const st = studentsData.find(s => s.id === m.student_id)
          return { ...m, ...st, isInactive: !activeIds.has(m.student_id) }
        })

        setMembers(formattedMembers)

        // Fetch Posts
        const { data: squadPosts, error: postsError } = await supabase
          .from('gym_squad_posts')
          .select('*, gym_students(name, username)')
          .eq('squad_id', squadData.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!postsError) {
          setPosts(squadPosts)
        }

        // Buscar total de pontos do Squad (últimos 30 dias)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const dateStr = sevenDaysAgo.toISOString().split('T')[0]

        const { data: scoreData } = await supabase
          .from('gym_squad_score_logs')
          .select('points')
          .eq('squad_id', squadData.id)
          .gte('created_at', dateStr)
        
        const total = (scoreData || []).reduce((acc, curr) => acc + curr.points, 0)
        setTotalPoints(total)
      } else {
        setSquad(null)
        setMembers([])
      }
    } catch (e) {
      console.error("Erro ao carregar squad:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (student?.id) {
      fetchSquadInfo()
    }
  }, [student?.id])

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) {
      showToast('Digite um nome para o Squad', 'error')
      return
    }

    setIsCreating(true)
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data: newSquad, error: squadError } = await supabase
        .from('gym_squads')
        .insert([{
          name: newSquadName,
          created_by: student.id,
          invite_code: code
        }])
        .select()
        .single()
      
      if (squadError) throw squadError

      const { error: memberError } = await supabase
        .from('gym_squad_members')
        .insert([{
          squad_id: newSquad.id,
          student_id: student.id,
          role: 'admin'
        }])
      
      if (memberError) throw memberError

      showToast('Squad criado com sucesso!')
      setNewSquadName('')
      fetchSquadInfo()

    } catch (e) {
      console.error(e)
      showToast('Erro ao criar Squad', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinSquad = async () => {
    if (!inviteCode.trim()) {
      showToast('Digite o código de convite', 'error')
      return
    }

    setIsJoining(true)
    try {
      const { data: foundSquad, error: findError } = await supabase
        .from('gym_squads')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .maybeSingle()
      
      if (findError) throw findError

      if (!foundSquad) {
        showToast('Código de Squad não encontrado', 'error')
        setIsJoining(false)
        return
      }

      const { error: joinError } = await supabase
        .from('gym_squad_members')
        .insert([{
          squad_id: foundSquad.id,
          student_id: student.id,
          role: 'member'
        }])
      
      if (joinError) throw joinError

      showToast('Você entrou no Squad!')
      setInviteCode('')
      fetchSquadInfo()

    } catch (e) {
      console.error(e)
      if (e.code === '23505') {
        showToast('Você já faz parte deste Squad', 'error')
      } else {
        showToast('Erro ao entrar no Squad', 'error')
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveSquad = async () => {
    if (!window.confirm('Tem certeza que deseja sair do Squad?')) return

    try {
      await supabase
        .from('gym_squad_members')
        .delete()
        .eq('squad_id', squad.id)
        .eq('student_id', student.id)
      
      showToast('Você saiu do Squad')
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao sair do Squad', 'error')
    }
  }

  const handleDeleteSquad = async () => {
    if (!window.confirm('ATENÇÃO: Isso excluirá o Squad e todos os dados vinculados (feed, pontos). Confirmar?')) return

    try {
      const { error } = await supabase
        .from('gym_squads')
        .delete()
        .eq('id', squad.id)
      
      if (error) throw error
      
      showToast('Squad deletado com sucesso')
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao deletar Squad', 'error')
    }
  }

  const handleKickMember = async (memberId, memberName) => {
    if (!window.confirm(`Deseja remover ${memberName} do Squad?`)) return

    try {
      const { error } = await supabase
        .from('gym_squad_members')
        .delete()
        .eq('squad_id', squad.id)
        .eq('student_id', memberId)
      
      if (error) throw error
      
      showToast(`${memberName} removido`)
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao remover membro', 'error')
    }
  }

  const copyCode = () => {
    if (!squad?.invite_code) return
    navigator.clipboard.writeText(squad.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Código copiado!')
  }

  const handlePingSquad = async () => {
    setIsPingingSquad(true)
    try {
      const otherMembers = members.filter(m => m.student_id !== student.id)
      
      const notifications = otherMembers.map(m => ({
        sender_id: student.id,
        receiver_id: m.student_id,
        type: 'ping',
        message: `${student.name} mandou um PING para o bando! Bora treinar! 💪`
      }))

      if (notifications.length > 0) {
        await supabase.from('gym_social_notifications').insert(notifications)
      }

      await supabase.from('gym_squad_posts').insert([{
        squad_id: squad.id,
        student_id: student.id,
        type: 'achievement',
        content: `Mandou um PING motivacional para todo o bando! 📢🔥`
      }])

      showToast('Ping enviado para o Squad!')
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao enviar ping', 'error')
    } finally {
      setIsPingingSquad(false)
    }
  }

  const handleNudge = async (memberId, memberName) => {
    try {
      await supabase.from('gym_social_notifications').insert([{
        sender_id: student.id,
        receiver_id: memberId,
        type: 'ping',
        message: `O bando sentiu sua falta, ${memberName}! Bora voltar pro foco? 🔥`
      }])
      showToast(`Cobrança enviada para ${memberName}!`)
    } catch (e) {
      console.error(e)
      showToast('Erro ao enviar cobrança', 'error')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
  }

  if (!squad) {
    return (
      <div className="animate-in fade-in duration-500 py-6 space-y-10">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 border border-primary/20">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Seu Bando</h2>
          <p className="text-slate-400 font-medium text-sm px-4">Treinar em grupo é o melhor jeito de manter a constância. Junte-se ao bando!</p>
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
          <div className="space-y-4">
            <h3 className="font-black text-white text-lg font-display tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Criar um Squad
            </h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Nome do Squad"
                value={newSquadName}
                onChange={e => setNewSquadName(e.target.value)}
                className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={handleCreateSquad}
                disabled={isCreating}
                className="bg-primary text-black font-black uppercase tracking-widest text-xs px-6 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                {isCreating ? '...' : 'Criar'}
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full my-6"></div>

          <div className="space-y-4">
            <h3 className="font-black text-white text-lg font-display tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Entrar em um Squad
            </h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Código de Convite"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent/50 transition-all placeholder:text-slate-600 uppercase"
              />
              <button 
                onClick={handleJoinSquad}
                disabled={isJoining}
                className="bg-accent text-black font-black uppercase tracking-widest text-xs px-6 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                {isJoining ? '...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 py-6 space-y-8">
      {/* Header do Squad com Placar */}
      <div className="bg-[#1A1A1A] rounded-[40px] border border-white/5 shadow-2xl relative mb-10">
        <div className="h-24 fitness-gradient w-full opacity-20 absolute top-0 left-0 rounded-t-[40px]"></div>
        <div className="p-8 relative z-10 text-center space-y-4">
          <div className="w-20 h-20 bg-black border-[3px] border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto shadow-2xl -mt-14 text-primary neon-shadow transition-transform hover:scale-110 duration-500">
            <Trophy className="w-10 h-10 drop-shadow-[0_0_10px_rgba(223,255,94,0.8)]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Squad Ativo</p>
            <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">{squad.name}</h2>
          </div>
          
          <div className="flex justify-center gap-4">
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-primary/20 flex flex-col items-center shadow-lg">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Pontos do Bando</p>
              <p className="text-2xl font-black text-white font-display tracking-tight">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Ranking Global</p>
              <p className="text-2xl font-black text-white font-display tracking-tight">#12</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-center">
            <button 
              onClick={copyCode}
              className="bg-black border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 hover:border-primary/50 transition-all group"
            >
              <span className="text-xs font-bold text-slate-400">CÓDIGO:</span>
              <span className="text-sm font-black text-white tracking-wider font-mono group-hover:text-primary transition-colors">{squad.invite_code}</span>
              {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />}
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={handlePingSquad}
        disabled={isPingingSquad}
        className="w-full bg-primary/10 border border-primary/20 text-primary py-4 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <Activity className="w-5 h-5" /> {isPingingSquad ? 'Enviando...' : 'Ping no Bando'}
      </button>

      {/* Leaderboard Semanal */}
      <SquadLeaderboard squadId={squad.id} studentId={student.id} />

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-white text-lg font-display tracking-tight flex items-center gap-2">
            Membros
            <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">{members.length}</span>
          </h3>
        </div>
        
        <div className="space-y-3">
          {members.map(member => (
            <div key={member.student_id} className="bg-[#1A1A1A] p-4 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center font-black text-white">
                {member.name?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm flex items-center gap-2">
                  {member.name} 
                  {member.student_id === student.id && <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">Você</span>}
                  {member.role === 'admin' && <span className="text-[9px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>}
                  {member.isInactive && member.student_id !== student.id && (
                    <span className="inline-flex items-center gap-1 text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                      <Moon className="w-2.5 h-2.5 shrink-0 animate-pulse" /> Dormindo
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 font-medium">@{member.username}</p>
              </div>

              {member.isInactive && member.student_id !== student.id && (
                <button 
                  onClick={() => handleNudge(member.student_id, member.name)}
                  className="px-3 h-8 rounded-full bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center gap-1"
                >
                  <BellRing className="w-3 h-3" /> Cobrar
                </button>
              )}

              {squad.myRole === 'admin' && member.student_id !== student.id && (
                <button 
                  onClick={() => handleKickMember(member.student_id, member.name)}
                  className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                  title="Remover Membro"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed Social */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-white text-lg font-display tracking-tight flex items-center gap-2">
            Feed do Bando
            <MessageSquare className="w-4 h-4 text-primary" />
          </h3>
        </div>
        
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-slate-500 text-sm font-bold text-center py-4 bg-[#1A1A1A] rounded-3xl border border-white/5">Nenhuma atividade ainda.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-[#1A1A1A] p-4 rounded-3xl border border-white/5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-xs shadow-inner">
                    {post.gym_students?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">{post.gym_students?.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-300 pl-11">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-6 pb-20">
        {squad.myRole === 'admin' ? (
          <button 
            onClick={handleDeleteSquad}
            className="w-full py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20 shadow-lg shadow-rose-500/5"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Squad Permanentemente
          </button>
        ) : (
          <button 
            onClick={handleLeaveSquad}
            className="w-full py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-white/5 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-white/5"
          >
            <LogOut className="w-4 h-4" />
            Sair do Squad
          </button>
        )}
      </div>
    </div>
  )
}

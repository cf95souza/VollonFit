import { useState, useEffect } from 'react'

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
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-primary-container border-t-transparent animate-spin"></div></div>
  }

  if (!squad) {
    return (
      <div className="animate-in fade-in duration-500 py-6 space-y-10">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary-container/10 text-primary-container rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(195,244,0,0.2)] border border-primary-container/20">
            <span className="material-symbols-outlined text-5xl">groups</span>
          </div>
          <h2 className="font-display-xl text-3xl text-primary uppercase tracking-tight">Seu Bando</h2>
          <p className="font-body-md text-on-surface-variant px-4">Treinar em grupo é o melhor jeito de manter a constância. Junte-se ao bando!</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 shadow-2xl space-y-6">
          <div className="space-y-4">
            <h3 className="font-display-lg text-on-surface text-lg tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">track_changes</span>
              Criar um Squad
            </h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Nome do Squad"
                value={newSquadName}
                onChange={e => setNewSquadName(e.target.value)}
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl p-4 text-sm font-headline-md text-on-surface outline-none focus:border-primary-container transition-all placeholder:text-on-surface-variant/50"
              />
              <button 
                onClick={handleCreateSquad}
                disabled={isCreating}
                className="bg-primary-container text-on-primary-container font-label-caps tracking-widest text-xs px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary-container/20"
              >
                {isCreating ? '...' : 'Criar'}
              </button>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30 w-full my-6"></div>

          <div className="space-y-4">
            <h3 className="font-display-lg text-on-surface text-lg tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">person_add</span>
              Entrar em um Squad
            </h3>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Código de Convite"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl p-4 text-sm font-headline-md text-on-surface outline-none focus:border-secondary-container transition-all placeholder:text-on-surface-variant/50 uppercase"
              />
              <button 
                onClick={handleJoinSquad}
                disabled={isJoining}
                className="bg-secondary-container text-on-secondary-container font-label-caps tracking-widest text-xs px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary-container/20"
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
    <div className="animate-in fade-in duration-500 py-6 space-y-lg">
      {/* Header do Squad com Placar */}
      <div className="glass-panel rounded-3xl border border-outline-variant/30 shadow-2xl relative mb-10 mt-8">
        <div className="h-24 bg-gradient-to-b from-primary-container/20 to-transparent w-full absolute top-0 left-0 rounded-t-3xl"></div>
        <div className="p-8 relative z-10 text-center space-y-4">
          <div className="w-20 h-20 bg-surface-container-high border-4 border-surface rounded-full flex items-center justify-center mx-auto shadow-2xl -mt-16 text-primary-container neon-glow transition-transform hover:scale-110 duration-500">
            <span className="material-symbols-outlined text-4xl drop-shadow-[0_0_10px_rgba(195,244,0,0.8)]">emoji_events</span>
          </div>
          <div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-primary-container mb-1">Squad Ativo</p>
            <h2 className="font-display-xl text-3xl text-primary uppercase tracking-tight">{squad.name}</h2>
          </div>
          
          <div className="flex justify-center gap-4">
            <div className="glass-panel px-6 py-3 rounded-2xl border border-primary-container/30 flex flex-col items-center shadow-lg">
              <p className="font-label-caps text-[9px] text-primary-container uppercase tracking-[0.2em] mb-1">Pontos do Bando</p>
              <p className="font-display-xl text-2xl text-on-surface tracking-tight">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="glass-panel px-6 py-3 rounded-2xl border border-outline-variant/30 flex flex-col items-center">
              <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">Ranking Global</p>
              <p className="font-display-xl text-2xl text-on-surface tracking-tight">#12</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-center">
            <button 
              onClick={copyCode}
              className="bg-surface border border-outline-variant/30 px-6 py-3 rounded-full flex items-center gap-3 hover:border-primary-container/50 transition-all group"
            >
              <span className="font-label-caps text-xs text-on-surface-variant">CÓDIGO:</span>
              <span className="font-headline-lg text-sm text-on-surface tracking-wider group-hover:text-primary-container transition-colors">{squad.invite_code}</span>
              {copied ? <span className="material-symbols-outlined text-sm text-primary-container">check_circle</span> : <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary-container transition-colors">content_copy</span>}
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={handlePingSquad}
        disabled={isPingingSquad}
        className="w-full glass-panel border border-primary-container/30 text-primary-container py-4 rounded-2xl font-label-caps uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-primary-container/10"
      >
        <span className="material-symbols-outlined">campaign</span> {isPingingSquad ? 'Enviando...' : 'Ping no Bando'}
      </button>

      {/* Leaderboard Semanal */}
      <SquadLeaderboard squadId={squad.id} studentId={student.id} />

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-display-lg text-on-surface text-lg tracking-tight flex items-center gap-2">
            Membros
            <span className="bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-label-caps text-[10px] px-2 py-0.5 rounded-full">{members.length}</span>
          </h3>
        </div>
        
        <div className="space-y-3">
          {members.map(member => (
            <div key={member.student_id} className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-4 hover:border-primary-container/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center font-headline-lg text-on-surface">
                {member.name?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-headline-md text-on-surface text-sm flex items-center gap-2">
                  {member.name} 
                  {member.student_id === student.id && <span className="font-label-caps text-[8px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full uppercase tracking-widest">Você</span>}
                  {member.role === 'admin' && <span className="font-label-caps text-[8px] bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>}
                  {member.isInactive && member.student_id !== student.id && (
                    <span className="inline-flex items-center gap-1 font-label-caps text-[8px] bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[10px] animate-pulse">bedtime</span> Dormindo
                    </span>
                  )}
                </p>
                <p className="font-body-md text-[10px] text-on-surface-variant">@{member.username}</p>
              </div>

              {member.isInactive && member.student_id !== student.id && (
                <button 
                  onClick={() => handleNudge(member.student_id, member.name)}
                  className="px-3 h-8 rounded-full bg-surface-container text-on-surface font-label-caps text-[10px] uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all border border-outline-variant/30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">notifications_active</span> Cobrar
                </button>
              )}

              {squad.myRole === 'admin' && member.student_id !== student.id && (
                <button 
                  onClick={() => handleKickMember(member.student_id, member.name)}
                  className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-all"
                  title="Remover Membro"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed Social */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-display-lg text-on-surface text-lg tracking-tight flex items-center gap-2">
            Feed do Bando
            <span className="material-symbols-outlined text-primary-container">forum</span>
          </h3>
        </div>
        
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="font-body-md text-on-surface-variant text-center py-4 glass-panel rounded-2xl border border-outline-variant/30">Nenhuma atividade ainda.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="glass-panel p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center font-headline-md text-primary-container text-xs shadow-inner">
                    {post.gym_students?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-headline-md text-on-surface text-sm">{post.gym_students?.name}</p>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="font-body-md text-sm text-on-surface pl-11">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-6 pb-20">
        {squad.myRole === 'admin' ? (
          <button 
            onClick={handleDeleteSquad}
            className="w-full py-4 flex items-center justify-center gap-2 font-label-caps text-xs uppercase tracking-widest text-error bg-error/10 rounded-2xl hover:bg-error hover:text-on-error transition-all active:scale-95 border border-error/20 shadow-lg shadow-error/5"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Excluir Squad Permanentemente
          </button>
        ) : (
          <button 
            onClick={handleLeaveSquad}
            className="w-full py-4 flex items-center justify-center gap-2 font-label-caps text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container rounded-2xl hover:bg-error hover:text-on-error transition-all active:scale-95 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sair do Squad
          </button>
        )}
      </div>
    </div>
  )
}

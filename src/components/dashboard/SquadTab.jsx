import { useState, useEffect } from 'react'

import { supabase } from '../../supabaseClient'
import SquadLeaderboard from './SquadLeaderboard'

export default function SquadTab({ student, showToast }) {
  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  const [postsPage, setPostsPage] = useState(0)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false)
  const POSTS_PER_PAGE = 10
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

        // Fetch Posts Iniciais (Pagina 0)
        const { data: squadPosts, error: postsError } = await supabase
          .from('gym_squad_posts')
          .select('*, gym_students(name, username)')
          .eq('squad_id', squadData.id)
          .order('created_at', { ascending: false })
          .range(0, POSTS_PER_PAGE - 1)

        if (!postsError) {
          setPosts(squadPosts || [])
          setPostsPage(1)
          setHasMorePosts((squadPosts?.length || 0) === POSTS_PER_PAGE)
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

  const loadMorePosts = async () => {
    if (!squad || !hasMorePosts || isLoadingMorePosts) return
    setIsLoadingMorePosts(true)
    
    try {
      const start = postsPage * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1
      
      const { data: morePosts, error } = await supabase
        .from('gym_squad_posts')
        .select('*, gym_students(name, username)')
        .eq('squad_id', squad.id)
        .order('created_at', { ascending: false })
        .range(start, end)
        
      if (error) throw error
      
      if (morePosts) {
        setPosts(prev => [...prev, ...morePosts])
        setPostsPage(prev => prev + 1)
        setHasMorePosts(morePosts.length === POSTS_PER_PAGE)
      }
    } catch (e) {
      console.error("Erro ao carregar mais posts", e)
      showToast('Erro ao carregar mais posts', 'error')
    } finally {
      setIsLoadingMorePosts(false)
    }
  }

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
      <div className="bg-[#101417] text-[#e0e2e8] min-h-screen pb-24 font-sans animate-in fade-in duration-500 relative pt-[env(safe-area-inset-top,0px)]">
        <style dangerouslySetInnerHTML={{__html: `
          .glass-panel { background: rgba(50, 53, 57, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
          .neon-glow { box-shadow: 0 0 15px rgba(195,244,0,0.3); }
        `}} />
        
        {/* TopAppBar Fake */}
        <header className="fixed top-0 w-full z-50 bg-[#101417]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(195,244,0,0.1)] flex justify-between items-center px-4 h-16 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
          </div>
          <div className="font-sans italic font-black text-primary text-xl tracking-tighter uppercase">
              STRENGTH HUB
          </div>
          <div className="flex items-center gap-2 opacity-0">
            <span className="material-symbols-outlined">shopping_cart</span>
          </div>
        </header>

        <div className="pt-[calc(80px+env(safe-area-inset-top,0px))] px-4 max-w-md mx-auto space-y-8 pb-20">
          <div className="text-center space-y-3 mt-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 neon-glow border border-primary/20">
              <span className="material-symbols-outlined text-5xl">groups</span>
            </div>
            <h2 className="font-sans text-3xl text-white font-black italic uppercase tracking-tighter">Seu Bando</h2>
            <p className="font-sans text-sm text-[#c4c9ac] px-4 font-semibold">A união faz a força. Junte-se a um bando para grindar XP!</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="space-y-3 z-10 relative">
              <h3 className="font-sans font-bold text-white text-base tracking-tight flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-primary">track_changes</span>
                Criar um Squad
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nome do Squad"
                  value={newSquadName}
                  onChange={e => setNewSquadName(e.target.value)}
                  className="flex-1 bg-[#0b0f12] border border-white/10 rounded-xl p-3 text-sm font-sans font-semibold text-white outline-none focus:border-primary transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={handleCreateSquad}
                  disabled={isCreating}
                  className="bg-primary text-black font-sans font-bold uppercase tracking-widest text-[10px] px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all neon-glow"
                >
                  {isCreating ? '...' : 'Criar'}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full my-4"></div>

            <div className="space-y-3 z-10 relative">
              <h3 className="font-sans font-bold text-white text-base tracking-tight flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-[#00dbe9]">person_add</span>
                Entrar em um Squad
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Código de Convite"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#0b0f12] border border-white/10 rounded-xl p-3 text-sm font-sans font-semibold text-white outline-none focus:border-[#00dbe9] transition-all placeholder:text-gray-600 uppercase"
                />
                <button 
                  onClick={handleJoinSquad}
                  disabled={isJoining}
                  className="bg-[#00dbe9] text-black font-sans font-bold uppercase tracking-widest text-[10px] px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,219,233,0.3)]"
                >
                  {isJoining ? '...' : 'Entrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#101417] text-[#e0e2e8] min-h-screen pb-24 font-sans relative overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel { background: rgba(50, 53, 57, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .neon-glow { box-shadow: 0 0 15px rgba(195,244,0,0.3); }
        .avatar-ring-live { box-shadow: 0 0 10px rgba(0, 219, 233, 0.8); border: 2px solid #00dbe9; }
      `}} />

      <main className="pt-6 px-4 max-w-md mx-auto space-y-6 pb-20">
        
        {/* Squad Hero */}
        <section className="glass-panel rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="font-sans text-[10px] text-[#c4c9ac] uppercase mb-1 font-bold tracking-widest">Active Squad</p>
              <h1 className="font-sans text-2xl text-white font-black italic tracking-tight uppercase">{squad.name}</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 bg-[#272a2e] px-3 py-1 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-[#00dbe9] animate-pulse"></div>
                <span className="font-sans font-bold text-[#e0e2e8] text-[10px] tracking-wider uppercase">LIVE</span>
              </div>
              <button onClick={copyCode} className="text-[#c4c9ac] text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 hover:text-primary mt-1 bg-black/20 px-2 py-1 rounded border border-white/5">
                 {squad.invite_code} <span className="material-symbols-outlined text-[12px]">{copied ? 'check_circle' : 'content_copy'}</span>
              </button>
            </div>
          </div>

          <div className="mt-2 z-10">
            <div className="flex justify-between items-center mb-2">
               <h2 className="font-sans text-[10px] text-[#abd600] font-bold tracking-widest uppercase">Squad Grinders</h2>
               <span className="font-sans text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider border border-primary/20 shadow-[0_0_10px_rgba(195,244,0,0.1)]">{totalPoints.toLocaleString()} PTS</span>
            </div>
            
            <div className="space-y-1 mt-3">
              {members.map((member, index) => (
                <div key={member.student_id} className="flex items-center justify-between bg-[#1c2024]/50 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`font-sans font-bold w-4 text-center text-sm ${index === 0 ? 'text-primary' : index === 1 ? 'text-[#c6c6ca]' : 'text-[#bbbbbf]'}`}>{index + 1}</div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${member.isInactive ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] opacity-50' : 'bg-primary/20 text-primary avatar-ring-live'}`}>
                       {member.name?.[0]}
                    </div>
                    
                    <div className="flex flex-col">
                       <span className={`font-sans text-sm font-semibold ${member.isInactive ? 'text-gray-500 line-through' : 'text-white'}`}>
                         {member.name} 
                         {member.student_id === student.id && <span className="ml-1 text-[8px] text-[#00dbe9] bg-[#00dbe9]/10 px-1 py-0.5 rounded">VOCÊ</span>}
                       </span>
                       {member.isInactive && member.student_id !== student.id && (
                          <button onClick={() => handleNudge(member.student_id, member.name)} className="text-[9px] text-[#ffb4ab] uppercase tracking-wider hover:underline text-left mt-0.5 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">notifications_active</span> Acordar
                          </button>
                       )}
                    </div>
                  </div>
                  {squad.myRole === 'admin' && member.student_id !== student.id && (
                    <button onClick={() => handleKickMember(member.student_id, member.name)} className="text-[#ffb4ab] opacity-50 hover:opacity-100 flex items-center justify-center bg-[#ffb4ab]/10 w-6 h-6 rounded">
                      <span className="material-symbols-outlined text-[14px]">cancel</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={handlePingSquad} disabled={isPingingSquad} className="w-full mt-2 py-3 bg-transparent border border-primary/30 rounded-lg font-sans text-xs uppercase font-bold tracking-widest text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              {isPingingSquad ? 'Enviando...' : 'Notificar Todo o Bando'}
          </button>
        </section>

        {/* Leaderboard Semanal - Removido por enquanto para não causar erro do Recharts (tamanho 0 quando oculto) */}
        
        {/* Social Feed */}
        <section className="space-y-4 pt-2">
          <h2 className="font-sans text-xl font-bold italic tracking-tighter text-white flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">local_fire_department</span>
             SQUAD FEED
          </h2>

          {posts.length === 0 ? (
             <p className="font-sans text-sm text-[#c4c9ac] text-center py-4 glass-panel rounded-2xl border border-white/5">Ainda não há atividade neste bando.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="glass-panel rounded-xl p-4 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[#00dbe9]/20 text-[#00dbe9] border border-[#00dbe9]/50 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(0,219,233,0.3)]">
                          {post.gym_students?.name?.[0]}
                       </div>
                       <div>
                          <p className="font-sans text-sm font-semibold text-white">{post.gym_students?.name}</p>
                          <p className="font-sans text-[10px] text-[#c4c9ac] uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    <p className="font-sans text-sm text-[#e0e2e8] mb-2">{post.content}</p>
                    {post.type === 'achievement' && (
                       <div className="flex gap-2 mb-2 flex-wrap">
                          <span className="font-sans text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full tracking-wider uppercase border border-primary/20">#Atividade</span>
                       </div>
                    )}
                 </div>
              </div>
            ))
          )}

          {hasMorePosts && posts.length > 0 && (
            <button 
              onClick={loadMorePosts}
              disabled={isLoadingMorePosts}
              className="w-full py-3 bg-[#1c2024] border border-white/5 rounded-xl font-sans text-xs uppercase font-bold tracking-widest text-[#c4c9ac] hover:bg-white/5 transition-colors mt-4"
            >
              {isLoadingMorePosts ? 'Carregando...' : 'Carregar mais antigas'}
            </button>
          )}
        </section>

        {/* Administrative Actions */}
        <div className="pt-6">
           {squad.myRole === 'admin' ? (
              <button onClick={handleDeleteSquad} className="w-full py-4 flex items-center justify-center gap-2 font-sans font-bold text-xs uppercase tracking-widest text-[#ffb4ab] bg-[#ffb4ab]/10 rounded-xl hover:bg-[#ffb4ab] hover:text-[#690005] transition-all border border-[#ffb4ab]/20">
                <span className="material-symbols-outlined text-sm">delete</span> Destruir Squad
              </button>
           ) : (
              <button onClick={handleLeaveSquad} className="w-full py-4 flex items-center justify-center gap-2 font-sans font-bold text-xs uppercase tracking-widest text-[#c4c9ac] bg-[#1c2024] rounded-xl hover:bg-[#ffb4ab] hover:text-[#690005] transition-all border border-white/10">
                <span className="material-symbols-outlined text-sm">logout</span> Sair do Squad
              </button>
           )}
        </div>
      </main>
    </div>
  )
}

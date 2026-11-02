import { useState, useEffect } from 'react'
import { Bell, Users, Copy, CheckCircle2, ChevronRight, LogOut, Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { daysAgoLocally } from '../../utils/dateUtils'

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
  const [memberPoints, setMemberPoints] = useState({})

  const fetchSquadInfo = async () => {
    setIsLoading(true)
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('gym_squad_members')
        .select('squad_id, role')
        .eq('student_id', student.id)
        .maybeSingle()
      
      if (memberError) throw memberError

      if (memberData) {
        const { data: squadData, error: squadError } = await supabase
          .from('gym_squads')
          .select('*')
          .eq('id', memberData.squad_id)
          .single()
        
        if (squadError) throw squadError
        setSquad({ ...squadData, myRole: memberData.role })

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

        // Inatividade calculada localmente (evita virada UTC após 21h)
        const limitDateStr = daysAgoLocally(3)

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

        // Buscar pontos dos membros na semana (data local)
        const dateStr7d = daysAgoLocally(7)
        const { data: scoreLogs } = await supabase
          .from('gym_squad_score_logs')
          .select('student_id, points')
          .eq('squad_id', squadData.id)
          .gte('created_at', dateStr7d)

        const scoreMap = {}
        ;(scoreLogs || []).forEach(log => {
          scoreMap[log.student_id] = (scoreMap[log.student_id] || 0) + (log.points || 0)
        })
        setMemberPoints(scoreMap)

        // Buscar Posts
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

      // Gravar post de boas vindas
      await supabase.from('gym_squad_posts').insert([{
        squad_id: foundSquad.id,
        student_id: student.id,
        type: 'achievement',
        content: `Entrou no squad!`
      }])

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
        message: `${student.name} mandou um PING motivacional para todo o bando! Bora treinar! 💪`
      }))

      if (notifications.length > 0) {
        await supabase.from('gym_social_notifications').insert(notifications)
      }

      await supabase.from('gym_squad_posts').insert([{
        squad_id: squad.id,
        student_id: student.id,
        type: 'achievement',
        content: `Mandou um PING motivacional para todo o bando!`
      }])

      showToast('Chamou o bando!')
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao enviar aviso', 'error')
    } finally {
      setIsPingingSquad(false)
    }
  }

  const handleNudge = async (partnerId, partnerName) => {
    try {
      await supabase.from('gym_social_notifications').insert([{
        sender_id: student.id,
        receiver_id: partnerId,
        type: 'ping',
        message: `Bora treinar, ${partnerName}! 🔔 Caio te chamou!`
      }])

      await supabase.from('gym_squad_posts').insert([{
        squad_id: squad.id,
        student_id: student.id,
        type: 'achievement',
        content: `Mandou um lembrete para acordar ${partnerName}! 🔔`
      }])

      showToast(`Você acordou ${partnerName}!`)
      fetchSquadInfo()
    } catch (e) {
      console.error(e)
      showToast('Erro ao avisar parceiro', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#E11D2E] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Estado: Sem Squad Cadastrado
  if (!squad) {
    return (
      <div className="max-w-md mx-auto w-full px-5 pt-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#141414] border border-[#2A2A2A] rounded-2xl flex items-center justify-center mx-auto text-[#FF3B4A]">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Squad Casal
          </h2>
          <p className="text-xs text-[#A3A3A3] max-w-xs mx-auto">
            Treine junto e acompanhe o duelo de constância e pontuação em tempo real.
          </p>
        </div>

        <div className="vollon-card p-5 space-y-4 rounded-3xl">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
              Criar Novo Squad
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do Squad (ex: Squad Casal)"
                value={newSquadName}
                onChange={e => setNewSquadName(e.target.value)}
                className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-3.5 py-3 text-white text-sm focus:border-[#E11D2E] outline-none"
              />
              <button
                onClick={handleCreateSquad}
                disabled={isCreating}
                className="vollon-btn-primary px-5 rounded-xl font-bold text-xs uppercase"
              >
                {isCreating ? '...' : 'Criar'}
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#2A2A2A]" />
            <span className="shrink mx-3 text-[10px] text-[#52525B] font-bold uppercase">ou</span>
            <div className="flex-grow border-t border-[#2A2A2A]" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider block">
              Entrar em Squad Existente
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de 6 dígitos"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-3.5 py-3 text-white text-sm uppercase tracking-wider focus:border-[#E11D2E] outline-none"
              />
              <button
                onClick={handleJoinSquad}
                disabled={isJoining}
                className="vollon-btn-secondary px-5 rounded-xl font-bold text-xs uppercase"
              >
                {isJoining ? '...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Identificação do Usuário e do Parceiro
  const currentUser = members.find(m => m.student_id === student.id) || { name: student.name, student_id: student.id }
  const partnerUser = members.find(m => m.student_id !== student.id) || { name: 'Thais', student_id: 'partner' }

  const currentUserName = currentUser.name?.split(' ')[0] || 'Caio'
  const partnerUserName = partnerUser.name?.split(' ')[0] || 'Thais'

  const userPts = memberPoints[currentUser.student_id] || 0
  const partnerPts = memberPoints[partnerUser.student_id] || 0

  const totalDuelPts = userPts + partnerPts
  const userPercent = totalDuelPts > 0 ? Math.round((userPts / totalDuelPts) * 100) : 50

  return (
    <div className="max-w-md mx-auto w-full px-5 pt-8 space-y-6">
      
      {/* Card Principal: SQUAD CASAL (04-squads.png) */}
      <div className="vollon-card p-6 rounded-3xl relative overflow-hidden">
        
        {/* Glow Superior Suave */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#E11D2E]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do Card */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h1 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            {squad.name || 'SQUAD CASAL'}
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B4A] animate-pulse" />
            <span className="text-[10px] font-bold text-[#FF3B4A] tracking-wider uppercase">
              AO VIVO
            </span>
          </div>
        </div>

        {/* Duelo Face a Face: Caio VS Thais (04-squads.png) */}
        <div className="flex items-center justify-between px-2 relative z-10">
          
          {/* Lado Usuário (Vermelho) */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#E11D2E] text-white flex items-center justify-center font-display text-3xl font-black shadow-[0_0_24px_rgba(225,29,46,0.6)]">
              {currentUserName[0]}
            </div>
            <p className="font-bold text-white text-sm mt-2">{currentUserName}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-display text-2xl font-black text-white">{userPts}</span>
              <span className="font-display text-xs font-black text-[#FFAAB1]">PTS</span>
            </div>
          </div>

          {/* VS no Meio */}
          <div className="font-display text-2xl font-black text-[#52525B] uppercase tracking-widest px-2">
            VS
          </div>

          {/* Lado Parceiro (Cinza / Branco neutro conforme regra do kernel) */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#3F3F46] border-2 border-[#52525B] text-white flex items-center justify-center font-display text-3xl font-black">
              {partnerUserName[0]}
            </div>
            <p className="font-bold text-white text-sm mt-2">{partnerUserName}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-display text-2xl font-black text-white">{partnerPts}</span>
              <span className="font-display text-xs font-black text-white">PTS</span>
            </div>
          </div>

        </div>

        {/* Barra Comparativa Proporcional (04-squads.png) */}
        <div className="mt-6 relative z-10">
          <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-[#2A2A2A]">
            <div 
              className="bg-[#E11D2E] transition-all duration-500 shadow-[0_0_8px_rgba(225,29,46,0.8)]" 
              style={{ width: `${userPercent}%` }}
            />
            <div 
              className="bg-white transition-all duration-500" 
              style={{ width: `${100 - userPercent}%` }}
            />
          </div>

          <p className="text-center text-xs text-[#A3A3A3] mt-3">
            Código do squad: <span onClick={copyCode} className="font-black text-white hover:text-[#FF3B4A] cursor-pointer">{squad.invite_code}</span>
          </p>
        </div>

      </div>

      {/* Dois Botões de Ação (04-squads.png) */}
      <div className="flex gap-3">
        {/* Botão Acordar Parceiro */}
        <button
          onClick={() => handleNudge(partnerUser.student_id, partnerUserName)}
          className="vollon-btn-primary flex-1 h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white shadow-[0_8px_28px_rgba(255,59,74,0.35)] cursor-pointer"
        >
          <Bell className="w-4 h-4 fill-current" />
          <span>Acordar {partnerUserName}</span>
        </button>

        {/* Botão Chamar o Bando */}
        <button
          onClick={handlePingSquad}
          disabled={isPingingSquad}
          className="vollon-btn-secondary flex-1 h-[52px] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white border border-[#2A2A2A] hover:border-[#52525B] cursor-pointer"
        >
          <span>Chamar o bando</span>
        </button>
      </div>

      {/* Seção ATIVIDADE: Linha do Tempo Vertical (04-squads.png) */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display text-2xl font-black uppercase text-white tracking-wider">
          ATIVIDADE
        </h2>

        {posts.length === 0 ? (
          <div className="vollon-card p-6 text-center rounded-2xl">
            <p className="text-xs text-[#A3A3A3]">Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6">
            {/* Linha vertical cinza */}
            <div className="absolute left-2.5 top-2 bottom-2 w-[2px] bg-[#2A2A2A] -translate-x-1/2" />

            {posts.map(post => {
              const authorName = post.gym_students?.name || 'Membro'
              const dateObj = new Date(post.created_at)
              const formattedDate = dateObj.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })

              return (
                <div key={post.id} className="relative flex items-start gap-3">
                  {/* Ponto vermelho na linha */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#E11D2E] shadow-[0_0_8px_rgba(225,29,46,0.8)] shrink-0" />

                  <div className="space-y-0.5">
                    <p className="text-xs">
                      <span className="font-bold text-white">{authorName}</span>
                      <span className="text-[#71717A] ml-2">· {formattedDate}</span>
                    </p>
                    <p className="text-sm text-[#E5E5E5] leading-snug">
                      {post.content}
                    </p>
                  </div>
                </div>
              )
            })}

            {hasMorePosts && (
              <button
                onClick={loadMorePosts}
                disabled={isLoadingMorePosts}
                className="w-full py-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors"
              >
                {isLoadingMorePosts ? 'Carregando...' : 'Carregar mais atividades'}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

import { useState } from 'react'
import { 
  Trophy, 
  Calendar, 
  Camera, 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Flame,
  Scale
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { supabase } from '../../supabaseClient'
import { formatDateBR, getTodayLocally } from '../../utils/dateUtils'

export default function EvolutionView({ 
  records = [], 
  prs = [], 
  history = [], 
  photos = [], 
  studentId, 
  studentName = 'Caio',
  weeklyWorkouts = 0,
  onNewRecord, 
  onPhotosUpdate, 
  showToast 
}) {
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'records'
  const [isUploading, setIsUploading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState(null)

  // Dados do Mês Atual
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0-indexed

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ]
  const currentMonthName = monthNames[currentMonth]

  // Dias no mês atual
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() // 0 = Domingo

  const todayLocalStr = getTodayLocally()

  // Treinos concluídos neste mês
  const monthlyWorkoutsCount = history.filter(dateStr => {
    const [y, m] = dateStr.split('-')
    return parseInt(y) === currentYear && parseInt(m) === currentMonth + 1
  }).length

  // Upload de Foto de Evolução
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('evolution_photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('evolution_photos')
        .getPublicUrl(filePath)

      const { data: newPhoto, error: dbError } = await supabase
        .from('gym_evolution_photos')
        .insert([{
          student_id: studentId,
          photo_url: publicUrl,
          caption: 'Check-in de Evolução'
        }])
        .select()
        .single()

      if (dbError) throw dbError
      
      onPhotosUpdate([newPhoto, ...photos])
      showToast('Foto de evolução salva com sucesso!')
    } catch (err) {
      console.error('Erro no upload:', err)
      showToast('Erro no upload da foto.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return
    const { id, url } = photoToDelete
    setIsUploading(true) 
    
    try {
      const pathParts = url.split('evolution_photos/')
      const filePath = pathParts[pathParts.length - 1]

      await supabase.storage
        .from('evolution_photos')
        .remove([filePath])

      const { error: dbError } = await supabase
        .from('gym_evolution_photos')
        .delete()
        .eq('id', id)
      
      if (dbError) throw dbError

      onPhotosUpdate(photos.filter(p => p.id !== id))
      showToast('Foto removida.')
      setPhotoToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir foto:', err)
      showToast('Erro ao excluir foto.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const chartData = records.map(r => ({
    date: formatDateBR(r.record_date).slice(0, 5),
    weight: parseFloat(r.weight) || 0,
    fat: parseFloat(r.body_fat_pct) || 0
  }))

  return (
    <div className="max-w-md mx-auto w-full px-5 pt-8 space-y-6">
      
      {/* Alternador no Topo: CALENDÁRIO | RECORDES (03-evolucao.png) */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-1 flex">
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2.5 rounded-xl font-display text-sm font-black uppercase tracking-wider transition-all ${
            viewMode === 'calendar'
              ? 'bg-gradient-to-r from-[#E11D2E] to-[#9F0012] text-white shadow-[0_4px_16px_rgba(225,29,46,0.4)]'
              : 'text-[#A3A3A3] hover:text-white'
          }`}
        >
          CALENDÁRIO
        </button>

        <button
          onClick={() => setViewMode('records')}
          className={`flex-1 py-2.5 rounded-xl font-display text-sm font-black uppercase tracking-wider transition-all ${
            viewMode === 'records'
              ? 'bg-gradient-to-r from-[#E11D2E] to-[#9F0012] text-white shadow-[0_4px_16px_rgba(225,29,46,0.4)]'
              : 'text-[#A3A3A3] hover:text-white'
          }`}
        >
          RECORDES
        </button>
      </div>

      {viewMode === 'calendar' ? (
        /* VISTA CALENDÁRIO (03-evolucao.png) */
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Título do Mês e Contador Total de Treinos */}
          <div className="flex items-baseline justify-between px-1">
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {currentMonthName}
            </h1>
            <div className="text-right">
              <span className="font-display text-4xl font-black text-[#FF3B4A] block leading-none">
                {monthlyWorkoutsCount || history.length || 0}
              </span>
              <span className="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wider">
                treinos no total
              </span>
            </div>
          </div>

          {/* Grid do Calendário Compacto */}
          <div className="vollon-card p-4 sm:p-5 rounded-3xl">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1.5 mb-2.5 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <span key={i} className="text-xs font-bold text-[#A3A3A3] uppercase">
                  {day}
                </span>
              ))}
            </div>

            {/* Células dos dias */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Espaços vazios no início do mês */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Dias do mês */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const monthStr = String(currentMonth + 1).padStart(2, '0')
                const dayStr = String(dayNum).padStart(2, '0')
                const dateStr = `${currentYear}-${monthStr}-${dayStr}`
                
                const isToday = dateStr === todayLocalStr
                const hasTrained = history.includes(dateStr)

                return (
                  <div
                    key={dayNum}
                    className={`aspect-square rounded-xl flex items-center justify-center font-display text-sm font-bold transition-all ${
                      isToday
                        ? 'bg-gradient-to-b from-[#E11D2E] to-[#9F0012] text-white shadow-[0_4px_14px_rgba(225,29,46,0.6)] ring-1 ring-[#FF3B4A]'
                        : hasTrained
                        ? 'bg-[#1A1A1A] border border-[#E11D2E]/60 text-white font-extrabold'
                        : 'bg-[#141414]/80 text-[#71717A] border border-[#2A2A2A]/40'
                    }`}
                  >
                    {dayNum}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Seção Recordes Pessoais */}
          <div className="space-y-3 pt-2">
            <h2 className="font-display text-2xl font-black uppercase text-white tracking-wider">
              RECORDES PESSOAIS
            </h2>

            {prs.length === 0 ? (
              <div className="vollon-card p-6 text-center rounded-2xl">
                <p className="text-xs text-[#A3A3A3]">Treine para registrar seus primeiros recordes!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {prs.slice(0, 5).map((pr, idx) => (
                  <div
                    key={idx}
                    className="vollon-card p-4 rounded-2xl flex items-center justify-between hover:border-[#E11D2E]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-[#FF3B4A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm sm:text-base truncate">
                          {pr.exercise_name}
                        </p>
                        <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                          {formatDateBR(pr.record_date)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="font-display text-3xl font-black text-white leading-none">
                        {pr.max_weight}
                      </span>
                      <span className="font-display text-sm font-bold text-[#A3A3A3] ml-1 uppercase">
                        KG
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* VISTA RECORDES / COMPOSIÇÃO / FOTOS */
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Gráfico de Evolução de Peso */}
          {chartData.length > 0 && (
            <div className="vollon-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">Evolução de Peso</span>
                <span className="text-[10px] text-[#A3A3A3]">{chartData.length} registros</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D2E" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#E11D2E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3' }} />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#FF3B4A' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#E11D2E" strokeWidth={3} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Galeria de Fotos de Evolução */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black uppercase text-white">Fotos de Evolução</h3>
              <label className="vollon-btn-primary px-3 py-1.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>Nova Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  disabled={isUploading} 
                  className="hidden" 
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="vollon-card p-6 text-center rounded-2xl">
                <p className="text-xs text-[#A3A3A3]">Nenhuma foto registrada ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map(p => (
                  <div key={p.id} className="vollon-card rounded-2xl overflow-hidden relative group">
                    <img src={p.photo_url} alt="Check-in" className="w-full h-44 object-cover" />
                    <button 
                      onClick={() => setPhotoToDelete(p)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="p-2 text-[10px] text-[#A3A3A3] text-center">
                      {formatDateBR(p.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal de confirmação de exclusão de foto */}
          {photoToDelete && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="vollon-card p-6 rounded-2xl max-w-sm w-full space-y-4">
                <p className="text-sm font-bold text-white text-center">Excluir esta foto?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPhotoToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDeletePhoto}
                    className="flex-1 py-2.5 rounded-xl bg-[#E11D2E] text-white text-xs font-bold"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

import { useState } from 'react'
import { 
  TrendingUp, 
  Plus, 
  Scale, 
  Flame, 
  Activity, 
  Camera, 
  X, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts'
import { supabase } from '../../supabaseClient'

export default function EvolutionView({ records = [], prs = [], history = [], photos = [], studentId, onNewRecord, onPhotosUpdate, showToast }) {
  const themeColor = localStorage.getItem('vollonfit_theme_color') || '#DFFF5E';
  const [isUploading, setIsUploading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState(null)
  
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
      showToast('Foto de evolução salva!', 'success')
    } catch (err) {
      console.error('Erro no upload:', err)
      showToast('Erro no Upload: ' + (err.message || err.error_description || 'Verifique o bucket'), 'error')
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

      const { error: storageError } = await supabase.storage
        .from('evolution_photos')
        .remove([filePath])
      
      if (storageError) console.warn('Erro ao remover do storage (pode já não existir):', storageError)

      const { error: dbError } = await supabase
        .from('gym_evolution_photos')
        .delete()
        .eq('id', id)
      
      if (dbError) throw dbError

      onPhotosUpdate(photos.filter(p => p.id !== id))
      showToast('Foto excluída com sucesso.', 'success')
      setPhotoToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir foto:', err)
      showToast('Erro ao Excluir: ' + (err.message || 'Erro de permissão'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const latest = (records || []).length > 0 ? records[records.length - 1] : null
  
  const chartData = (records || []).map(r => ({
    date: r?.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '?',
    weight: r?.weight || 0,
    fat: r?.body_fat_pct || 0,
    muscle: r?.muscle_mass_kg || 0
  }))

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' })
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      day,
      hasTrained: (history || []).includes(dateStr)
    }
  })

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Sua Jornada</p>
        <h1 className="text-4xl font-black text-white font-display">Sua Evolução</h1>
      </header>

      {/* Calendário de Frequência */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display capitalize">{monthName}</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase bg-[#1A1A1A] px-4 py-2 rounded-full border border-white/5">Frequência</span>
        </div>
        
        <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-[10px] font-black text-slate-500 text-center uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(d => (
              <div 
                key={d.day}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  d.hasTrained 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-110' 
                  : 'bg-black text-slate-600 border border-white/5'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Recordes Pessoais (Troféus) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display">Hall de Recordes</h3>
          <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20">🏆 {prs.length} Marcas</span>
        </div>

        {(prs || []).length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {prs.map((pr, idx) => (
              <div key={idx} className="flex-shrink-0 w-40 bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 shadow-lg flex flex-col items-center text-center group hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-black text-white font-display mb-1 line-clamp-1">{pr.exercise_name}</h4>
                <p className="text-2xl font-black text-primary font-display">{pr.max_weight}<span className="text-[10px] ml-1 uppercase text-slate-500">kg</span></p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">{new Date(pr.record_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 text-center shadow-lg">
            <p className="text-xs text-slate-500 font-bold">Treine para registrar seus primeiros recordes!</p>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black text-white font-display">Composição Corporal</h3>
        <button 
          onClick={onNewRecord}
          className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center gap-2 border border-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo Registro
        </button>
      </div>

      {!records || records.length === 0 ? (
        <div className="bg-[#1A1A1A] p-10 rounded-[40px] border border-white/5 text-center space-y-4 shadow-2xl">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-500 text-sm">Registre sua primeira biopedância para começar a ver sua evolução!</p>
          <button 
            onClick={onNewRecord}
            className="bg-primary text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <>
          {/* Gráfico Principal */}
          <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" /> Peso Corporal (kg)
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                Últimos {records.length} registros
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}}
                    itemStyle={{color: themeColor}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px', color: '#94a3b8'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke={themeColor} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
              <h3 className="font-bold text-white text-xs mb-4 flex items-center gap-2">
                <Flame className="w-3 h-3 text-orange-500" /> Gordura (%)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#1A1A1A] p-6 rounded-[40px] border border-white/5 shadow-2xl">
              <h3 className="font-bold text-white text-xs mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-accent" /> Músculo (kg)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="muscle" stroke="#C6C4FF" strokeWidth={3} dot={{r: 4, fill: '#C6C4FF'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Diário de Evolução (Fotos) */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white font-display">Diário Visual</h3>
          <label className="cursor-pointer bg-primary text-black px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            {isUploading ? 'Subindo...' : 'Novo Check-in'}
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-[4/5] rounded-[32px] overflow-hidden group border border-white/10 shadow-md">
                <img src={p.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Evolução" />
                
                {/* Botão Excluir */}
                <button 
                  onClick={() => setPhotoToDelete({ id: p.id, url: p.photo_url })}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90 border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                  <p className="text-[8px] font-bold text-white uppercase tracking-widest">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-black border-2 border-dashed border-white/10 p-12 rounded-[40px] text-center space-y-4">
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-white/5">
              <ImageIcon className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Sua transformação merece ser vista. <br/> Comece seu histórico hoje!
            </p>
          </div>
        )}
      </section>

      {records && records.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Histórico Completo</h3>
          <div className="space-y-3">
            {(records || []).slice().reverse().map((r, i) => (
              <div key={i} className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="font-bold text-white">{r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR') : '-'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Peso: <b className="text-slate-300">{r.weight || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Gordura: <b className="text-slate-300">{r.body_fat_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Músculo: <b className="text-slate-300">{r.muscle_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Visceral: <b className="text-slate-300">{r.visceral_fat || '-'}</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Água: <b className="text-slate-300">{r.body_water_pct || 0}%</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Óssea: <b className="text-slate-300">{r.bone_mass_kg || 0}kg</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">Idade: <b className="text-slate-300">{r.body_age || '-'}</b></span>
                    <span className="text-[10px] text-slate-500 font-medium">IMC: <b className="text-slate-300">{r.bmi || '-'}</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-sm">{r.tmb || 0} kcal</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">TMB</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Confirmação Customizado */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] w-full max-w-xs rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center border border-white/10">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white font-display mb-2">Excluir Foto?</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8">Esta ação não pode ser desfeita.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleDeletePhoto}
                disabled={isUploading}
                className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button 
                onClick={() => setPhotoToDelete(null)}
                disabled={isUploading}
                className="w-full bg-black text-slate-400 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all disabled:opacity-50 border border-white/5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

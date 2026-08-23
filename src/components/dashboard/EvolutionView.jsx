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
    <div className="space-y-lg animate-in fade-in duration-700 w-full">
      <header>
        <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-2">Sua Jornada</p>
        <h1 className="font-display-xl text-display-xl text-primary">Sua Evolução</h1>
      </header>

      {/* Calendário de Frequência */}
      <section className="space-y-sm">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline-md text-headline-md text-primary capitalize">{monthName}</h3>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant/30">Frequência</span>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
              <div key={idx} className="font-label-caps text-label-caps text-on-surface-variant text-center uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(d => (
              <div 
                key={d.day}
                className={`aspect-square rounded-xl flex items-center justify-center font-body-md text-body-md font-bold transition-all ${
                  d.hasTrained 
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(195,244,0,0.2)] scale-110' 
                  : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Recordes Pessoais (Troféus) */}
      <section className="space-y-sm">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline-md text-headline-md text-primary">Hall de Recordes</h3>
          <span className="font-label-caps text-label-caps text-primary-container uppercase bg-primary-container/10 px-3 py-1 rounded-full border border-primary-container/20">🏆 {prs.length} Marcas</span>
        </div>

        {(prs || []).length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {prs.map((pr, idx) => (
              <div key={idx} className="flex-shrink-0 w-40 glass-panel p-5 rounded-2xl flex flex-col items-center text-center group hover:bg-surface-container-high transition-all border border-outline-variant/30">
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container mb-3 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
                <h4 className="font-body-md text-body-md font-bold text-primary mb-1 line-clamp-1">{pr.exercise_name}</h4>
                <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">{pr.max_weight}<span className="font-data-display text-[10px] ml-1 uppercase text-on-surface-variant">kg</span></p>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-2">{new Date(pr.record_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">Treine para registrar seus primeiros recordes!</p>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center px-1 mt-8">
        <h3 className="font-headline-md text-headline-md text-primary">Composição Corporal</h3>
        <button 
          onClick={onNewRecord}
          className="bg-primary-container/10 text-primary-container px-4 py-2 rounded-lg font-label-caps text-label-caps uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-2 border border-primary-container/20"
        >
          <span className="material-symbols-outlined text-sm">add</span> Novo Registro
        </button>
      </div>

      {!records || records.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mx-auto block">trending_up</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Registre sua primeira biopedância para começar a ver sua evolução!</p>
          <button 
            onClick={onNewRecord}
            className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-label-caps text-label-caps uppercase tracking-widest neon-glow hover:bg-surface-tint"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <>
          {/* Gráfico Principal */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-body-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-sm">monitor_weight</span> Peso Corporal (kg)
              </h3>
              <span className="font-label-caps text-[10px] text-primary-container bg-primary-container/10 border border-primary-container/20 px-3 py-1 rounded-full uppercase">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: 'var(--on-surface-variant)', fontFamily: 'Inter'}} 
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)'}}
                    itemStyle={{color: themeColor}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px', color: 'var(--on-surface-variant)'}}
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

          <div className="grid grid-cols-2 gap-sm">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-body-md text-[12px] font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500 text-sm">local_fire_department</span> Gordura (%)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-body-md text-[12px] font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C6C4FF] text-sm">fitness_center</span> Músculo (kg)
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="muscle" stroke="#C6C4FF" strokeWidth={3} dot={{r: 4, fill: '#C6C4FF'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Diário de Evolução (Fotos) */}
      <section className="space-y-sm mt-8">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline-md text-headline-md text-primary">Diário Visual</h3>
          <label className="cursor-pointer bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-caps text-label-caps uppercase tracking-widest hover:bg-surface-tint transition-all flex items-center gap-2 neon-glow">
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            {isUploading ? 'Subindo...' : 'Novo Check-in'}
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-sm">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-[4/5] rounded-2xl overflow-hidden group border border-outline-variant/30 shadow-md">
                <img src={p.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Evolução" />
                
                {/* Botão Excluir */}
                <button 
                  onClick={() => setPhotoToDelete({ id: p.id, url: p.photo_url })}
                  className="absolute top-3 right-3 w-8 h-8 bg-surface/80 backdrop-blur-md rounded-lg flex items-center justify-center text-error opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90 border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                  <p className="font-label-caps text-[8px] text-on-surface uppercase tracking-widest font-bold">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel border-dashed p-10 rounded-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center mx-auto border border-outline-variant/30">
              <span className="material-symbols-outlined text-on-surface-variant text-2xl">image</span>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest leading-relaxed">
              Sua transformação merece ser vista. <br/> Comece seu histórico hoje!
            </p>
          </div>
        )}
      </section>

      {records && records.length > 0 && (
        <section className="mt-8">
          <h3 className="font-headline-md text-headline-md text-primary mb-4">Histórico Completo</h3>
          <div className="space-y-sm">
            {(records || []).slice().reverse().map((r, i) => (
              <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div>
                  <p className="font-body-md text-body-md font-bold text-primary">{r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR') : '-'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="font-data-display text-[10px] text-on-surface-variant">Peso: <b className="text-on-surface">{r.weight || 0}kg</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Gordura: <b className="text-on-surface">{r.body_fat_pct || 0}%</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Músculo: <b className="text-on-surface">{r.muscle_mass_kg || 0}kg</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Visceral: <b className="text-on-surface">{r.visceral_fat || '-'}</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Água: <b className="text-on-surface">{r.body_water_pct || 0}%</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Óssea: <b className="text-on-surface">{r.bone_mass_kg || 0}kg</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">Idade: <b className="text-on-surface">{r.body_age || '-'}</b></span>
                    <span className="font-data-display text-[10px] text-on-surface-variant">IMC: <b className="text-on-surface">{r.bmi || '-'}</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body-lg text-body-lg font-bold text-primary-container">{r.tmb || 0} kcal</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">TMB</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Confirmação Customizado */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-xs rounded-2xl p-6 animate-in zoom-in-95 duration-300 text-center border border-outline-variant">
            <div className="w-16 h-16 bg-error-container/20 rounded-xl flex items-center justify-center mx-auto mb-6 text-error border border-error/30">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h3 className="font-headline-lg text-2xl text-primary mb-2">Excluir Foto?</h3>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest leading-relaxed mb-6">Esta ação não pode ser desfeita.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleDeletePhoto}
                disabled={isUploading}
                className="w-full bg-error text-on-error py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,0,0,0.2)]"
              >
                {isUploading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
              <button 
                onClick={() => setPhotoToDelete(null)}
                disabled={isUploading}
                className="w-full bg-surface-container-highest text-on-surface py-4 rounded-lg font-label-caps text-label-caps uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 border border-outline-variant/50"
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

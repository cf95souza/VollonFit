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
  const [prPage, setPrPage] = useState(0)
  
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
  const firstRecord = (records || []).length > 1 ? records[0] : latest
  
  const diffWeight = (latest?.weight || 0) - (firstRecord?.weight || 0)
  const diffFat = (latest?.body_fat_pct || 0) - (firstRecord?.body_fat_pct || 0)
  const diffMuscle = (latest?.muscle_mass_kg || 0) - (firstRecord?.muscle_mass_kg || 0)
  
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

  // Bordas para o Bento Grid
  const bentoBorders = ['border-l-primary', 'border-l-[#7df4ff]', 'border-l-[#444933]', 'border-l-[#c6c6ca]', 'border-l-[#abd600]'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full font-sans pb-10">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel { background: rgba(28, 32, 36, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .kinetic-glow { box-shadow: 0 0 15px rgba(195, 244, 0, 0.2); }
      `}} />

      <header className="flex flex-col gap-1 px-1 mt-2">
        <h2 className="font-sans text-2xl font-bold text-white tracking-tight">Análise de Desempenho</h2>
        <p className="text-[#c4c9ac] font-sans text-sm">Acompanhando seu desempenho e medidas.</p>
      </header>

      {/* Calendário de Frequência */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-sans text-xl font-bold text-white capitalize">{monthName}</h3>
          <span className="font-sans text-[10px] font-bold text-[#c4c9ac] uppercase bg-[#323539] px-3 py-1 rounded-full border border-white/5">Frequência</span>
        </div>
        
        <div className="glass-panel p-5 rounded-xl">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
              <div key={idx} className="font-sans text-[10px] font-bold text-[#c4c9ac] text-center uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(d => (
              <div 
                key={d.day}
                className={`aspect-square rounded-lg flex items-center justify-center font-sans text-sm font-bold transition-all ${
                  d.hasTrained 
                  ? 'bg-primary text-[#161e00] kinetic-glow scale-110' 
                  : 'bg-[#1c2024] text-[#c4c9ac] border border-white/5'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Records Bento Grid */}
      <section className="flex flex-col gap-3">
        <h3 className="font-sans text-xl font-bold text-white px-1">Recordes Pessoais</h3>
        <div className="grid grid-cols-2 gap-3">
          {(prs || []).length > 0 ? (
            (prs || []).slice(prPage * 4, (prPage + 1) * 4).map((pr, idx) => {
              const borderClass = bentoBorders[idx % bentoBorders.length];
              return (
                <div key={idx} className={`glass-panel rounded-lg p-3 flex flex-col gap-1 border-l-2 ${borderClass}`}>
                  <div className="flex justify-between items-center text-[#c4c9ac]">
                    <span className="font-sans text-[10px] font-bold uppercase truncate pr-1" title={pr.exercise_name}>{pr.exercise_name}</span>
                    <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                  </div>
                  <div className="font-mono text-xl font-bold text-white">
                    {pr.max_weight}<span className="text-xs text-[#c4c9ac] ml-1 font-sans">kg</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#00dbe9] mt-auto pt-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    <span className="font-mono text-[9px] font-bold">{new Date(pr.record_date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="glass-panel p-6 rounded-lg text-center col-span-2">
                <p className="font-sans text-sm text-[#c4c9ac]">Treine para registrar seus primeiros recordes!</p>
             </div>
          )}
        </div>
        
        {Math.ceil((prs || []).length / 4) > 1 && (
          <div className="flex justify-between items-center px-2 mt-1">
            <button 
              onClick={() => setPrPage(p => Math.max(0, p - 1))}
              disabled={prPage === 0}
              className="text-primary text-[10px] font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 hover:text-[#abd600] transition-colors"
            >
              <span className="material-symbols-outlined text-[12px]">chevron_left</span> Anterior
            </button>
            <span className="text-[#c4c9ac] font-mono text-[10px]">{prPage + 1} / {Math.ceil((prs || []).length / 4)}</span>
            <button 
              onClick={() => setPrPage(p => Math.min(Math.ceil((prs || []).length / 4) - 1, p + 1))}
              disabled={prPage === Math.ceil((prs || []).length / 4) - 1}
              className="text-primary text-[10px] font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 hover:text-[#abd600] transition-colors"
            >
               Próximo <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            </button>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center px-1 mt-6">
        <h3 className="font-sans text-xl font-bold text-white">Composição Corporal</h3>
        <button 
          onClick={onNewRecord}
          className="bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-lg font-sans text-[10px] font-bold uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-1 border border-primary-container/20"
        >
          <span className="material-symbols-outlined text-[14px]">add</span> Registro
        </button>
      </div>

      {!records || records.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#c4c9ac] mx-auto block">trending_up</span>
          <p className="font-sans text-sm text-[#c4c9ac]">Registre sua primeira biopedância para começar a ver sua evolução!</p>
          <button 
            onClick={onNewRecord}
            className="bg-primary text-[#161e00] px-6 py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest kinetic-glow"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Body Measurements Comparison (Designer's UI) */}
          <section className="glass-panel rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-sans text-sm text-[#c4c9ac]">Peso Corporal</span>
              <div className="flex items-center gap-3 font-mono font-bold">
                {records.length > 1 && <span className="text-[#c4c9ac] line-through text-sm">{firstRecord?.weight}kg</span>}
                {records.length > 1 && <span className="material-symbols-outlined text-[16px] text-primary">arrow_right_alt</span>}
                <span className="text-white text-base">{latest?.weight}kg</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-sans text-sm text-[#c4c9ac]">% Gordura</span>
              <div className="flex items-center gap-3 font-mono font-bold">
                {records.length > 1 && <span className="text-[#c4c9ac] line-through text-sm">{firstRecord?.body_fat_pct}%</span>}
                {records.length > 1 && <span className="material-symbols-outlined text-[16px] text-primary">arrow_right_alt</span>}
                <span className="text-white text-base">{latest?.body_fat_pct}%</span>
              </div>
            </div>
            
            <div className="mt-1">
              <div className="flex justify-between font-sans text-[10px] font-bold text-[#c4c9ac] mb-1.5 uppercase">
                <span>MASSA MAGRA EST. (KG)</span>
                {diffMuscle > 0 ? (
                  <span className="text-[#7df4ff]">+{diffMuscle.toFixed(1)}kg</span>
                ) : (
                  <span className="text-[#c4c9ac]">{diffMuscle.toFixed(1)}kg</span>
                )}
              </div>
              <div className="w-full h-3 bg-[#1c2024] rounded-full overflow-hidden flex border border-white/5">
                <div className="h-full bg-[#323539] w-[70%]"></div>
                {diffMuscle > 0 && <div className="h-full bg-[#7df4ff] w-[10%] kinetic-glow" style={{ boxShadow: '0 0 10px rgba(125,244,255,0.4)' }}></div>}
              </div>
              <div className="font-mono text-xs text-right mt-1 font-bold text-white">{latest?.muscle_mass_kg}kg</div>
            </div>
          </section>

          {/* Gráfico Principal */}
          <div className="glass-panel p-5 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">monitor_weight</span> Evolução do Peso
              </h3>
              <span className="font-sans text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-sans text-xs font-bold text-white mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-orange-500 text-xs">local_fire_department</span> Gordura (%)
              </h3>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1c2024', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-sans text-xs font-bold text-white mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-[#C6C4FF] text-xs">fitness_center</span> Músculo (kg)
              </h3>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="muscle" stroke="#C6C4FF" strokeWidth={3} dot={{r: 4, fill: '#C6C4FF'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1c2024', color: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diário de Evolução (Fotos) */}
      <section className="space-y-4 mt-8">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-sans text-xl font-bold text-white">Diário Visual</h3>
          <label className="cursor-pointer bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-sans text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-[#161e00] transition-all flex items-center gap-1 border border-primary/20">
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
            {isUploading ? 'Subindo...' : 'Novo Check-in'}
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-[4/5] rounded-xl overflow-hidden group border border-white/5 shadow-md">
                <img src={p.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Evolução" />
                
                {/* Botão Excluir */}
                <button 
                  onClick={() => setPhotoToDelete({ id: p.id, url: p.photo_url })}
                  className="absolute top-2 right-2 w-8 h-8 bg-[#101417]/80 backdrop-blur-md rounded-lg flex items-center justify-center text-[#ffb4ab] opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90 border border-white/10 hover:bg-[#ffb4ab]/20"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-[#101417] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                  <p className="font-sans text-[10px] text-[#e0e2e8] uppercase tracking-widest font-bold">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel border-dashed p-10 rounded-xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#1c2024] rounded-xl flex items-center justify-center mx-auto border border-white/5">
              <span className="material-symbols-outlined text-[#c4c9ac] text-2xl">image</span>
            </div>
            <p className="font-sans text-xs text-[#c4c9ac] uppercase tracking-widest leading-relaxed">
              Sua transformação merece ser vista. <br/> Comece seu histórico hoje!
            </p>
          </div>
        )}
      </section>

      {records && records.length > 0 && (
        <section className="mt-8">
          <h3 className="font-sans text-xl font-bold text-white mb-4 px-1">Histórico Completo</h3>
          <div className="space-y-3">
            {(records || []).slice().reverse().map((r, i) => (
              <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <p className="font-mono text-sm font-bold text-primary mb-1">{r.record_date ? new Date(r.record_date).toLocaleDateString('pt-BR') : '-'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Peso: <b className="text-white">{r.weight || 0}kg</b></span>
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Gordura: <b className="text-white">{r.body_fat_pct || 0}%</b></span>
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Músculo: <b className="text-white">{r.muscle_mass_kg || 0}kg</b></span>
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Visceral: <b className="text-white">{r.visceral_fat || '-'}</b></span>
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Água: <b className="text-white">{r.body_water_pct || 0}%</b></span>
                    <span className="font-sans text-[10px] text-[#c4c9ac]">Idade: <b className="text-white">{r.body_age || '-'}</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold text-white">{r.tmb || 0}</p>
                  <p className="font-sans text-[8px] text-[#c4c9ac] uppercase font-bold tracking-widest">Kcal (TMB)</p>
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

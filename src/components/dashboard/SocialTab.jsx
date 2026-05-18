import React from 'react'
import { 
  Activity, 
  Dumbbell, 
  User as UserIcon 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function SocialTab({ 
  student, 
  partner, 
  weeklyStats, 
  partnerWeeklyVolume, 
  partnerTrainedToday, 
  socialNotifications, 
  isPinging, 
  setIsPinging, 
  showToast, 
  fetchWorkouts 
}) {
  const handlePing = async () => {
    if (!partner) return
    setIsPinging(true)
    const { error } = await supabase.from('gym_social_notifications').insert([{
      sender_id: student.id,
      receiver_id: partner.id,
      type: 'ping',
      message: `${student.name} mandou um PING! Bora treinar! 💪`
    }])
    setIsPinging(false)
    if (!error) {
      showToast('Ping enviado com sucesso!')
      fetchWorkouts()
    } else {
      showToast('Erro ao enviar ping', 'error')
    }
  }

  const myVol = weeklyStats?.volume || 0;
  const pVol = partnerWeeklyVolume || 0;
  const totalVol = myVol + pVol;
  const myVolPercent = totalVol > 0 ? (myVol / totalVol) * 100 : 50;

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        window.alert('Seu navegador não suporta Service Workers (essencial para PWA).');
        return;
      }

      if (!('PushManager' in window)) {
        window.alert('Seu navegador não suporta Notificações Push (PWA).');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        window.alert('Erro: Chave VAPID não configurada no .env');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        window.alert('⚠️ Permissão Negada! Você precisa permitir notificações nas configurações do seu navegador/celular.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const { endpoint, keys } = subscription.toJSON();
      
      const { error } = await supabase.from('gym_push_subscriptions').upsert({
        user_id: student.id,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        platform: /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) ? 'ios' : 'android'
      }, { onConflict: 'endpoint' });

      if (!error) {
        window.alert('✅ Notificações ativadas com sucesso!');
        window.location.reload();
      } else {
        throw error;
      }
    } catch (err) {
      console.error('Erro ao assinar push:', err);
      if (err.message.includes('applicationServerKey')) {
        window.alert('❌ Erro na Chave de Segurança (VAPID). Talvez o formato no .env esteja incorreto.');
      } else {
        window.alert('❌ Falha ao ativar: ' + err.message);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 pb-32 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-white font-display uppercase tracking-tight">VollonFit<span className="text-primary"> Social</span></h1>
        <p className="text-slate-400 font-bold mt-1">Conectado com <span className="text-white">{partner ? partner.name : 'Ninguém'}</span></p>
      </header>

      {!partner ? (
        <div className="bg-[#1A1A1A] p-8 rounded-[32px] border border-white/5 text-center">
          <Dumbbell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-white font-display mb-2">Vincule seu parceiro</h3>
          <p className="text-slate-400 text-sm font-bold">Vá até a aba Perfil e adicione o código do seu parceiro para liberar o VollonFit Social!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card de Notificações PWA */}
          {Notification.permission === 'default' && (
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between animate-in zoom-in duration-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Ativar Notificações</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Receba PINGS do seu parceiro!</p>
                </div>
              </div>
              <button 
                onClick={subscribeToPush}
                className="bg-primary text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
              >
                Permitir
              </button>
            </div>
          )}

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <UserIcon className="w-24 h-24 text-primary" />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">
                {partner.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-display">{partner.name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${partnerTrainedToday ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {partnerTrainedToday ? 'Treinou Hoje! 🔥' : 'Não treinou hoje 😴'}
                </span>
              </div>
            </div>

            <button 
              onClick={handlePing}
              disabled={isPinging}
              className="w-full fitness-gradient text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" /> {isPinging ? 'Enviando...' : 'Mandar um Ping'}
            </button>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Batalha de Carga (7 Dias)</h3>
            
            <div className="flex justify-between items-end mb-3">
              <div className="text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Você</p>
                <p className="text-2xl font-black text-white font-display">{myVol} <span className="text-xs text-slate-500">kg</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{partner.name}</p>
                <p className="text-2xl font-black text-primary font-display">{pVol} <span className="text-xs text-primary/50">kg</span></p>
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${myVolPercent}%` }}
              />
              <div 
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_rgb(var(--color-primary))]"
                style={{ width: `${100 - myVolPercent}%` }}
              />
            </div>
            
            {myVol > pVol && <p className="text-center text-xs font-bold text-white mt-4">Você está ganhando! 🚀</p>}
            {myVol < pVol && <p className="text-center text-xs font-bold text-primary mt-4">Corra atrás do prejuízo! 🏃‍♂️</p>}
            {myVol === pVol && totalVol > 0 && <p className="text-center text-xs font-bold text-slate-400 mt-4">Empate técnico! 🤝</p>}
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Feed de Atividades</h3>
            <div className="space-y-4">
              {socialNotifications?.length === 0 ? (
                <p className="text-slate-500 text-sm font-bold text-center py-4">Nenhuma atividade recente.</p>
              ) : (
                socialNotifications?.map(note => (
                  <div key={note.id} className="flex gap-4 items-start p-3 bg-black rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {note.type === 'ping' ? <Activity className="w-5 h-5 text-primary" /> : <Dumbbell className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-snug">{note.message}</p>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">
                        {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

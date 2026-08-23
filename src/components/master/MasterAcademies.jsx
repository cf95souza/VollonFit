import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function MasterAcademies({ showToast }) {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    academyName: '',
    academyCnpj: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const fetchAcademies = async () => {
    setLoading(true);
    // Traz a academia e o admin associado a ela
    const { data } = await supabase.from('gym_academies').select(`
      *,
      admins:gym_academy_admins(*)
    `).order('name');
    if (data) setAcademies(data);
    setLoading(false);
  };

  useEffect(() => { fetchAcademies(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.academyName || !formData.adminEmail || !formData.adminPassword) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Criar Academia
      const { data: newAcademy, error: accErr } = await supabase
        .from('gym_academies')
        .insert([{ name: formData.academyName, cnpj: formData.academyCnpj }])
        .select()
        .single();
      
      if (accErr) throw accErr;

      // 2. Criar Gestor
      const { error: adminErr } = await supabase
        .from('gym_academy_admins')
        .insert([{
          academy_id: newAcademy.id,
          name: formData.adminName || 'Gestor Principal',
          email: formData.adminEmail,
          password: formData.adminPassword
        }]);

      if (adminErr) throw adminErr;

      showToast('Academia e Gestor criados com sucesso!');
      setIsModalOpen(false);
      setFormData({ academyName: '', academyCnpj: '', adminName: '', adminEmail: '', adminPassword: '' });
      fetchAcademies();
    } catch (err) {
      showToast('Erro ao criar academia: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><span className="material-symbols-outlined w-12 h-12 text-primary-container animate-spin text-5xl">sync</span></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-[32px] border border-outline-variant/30">
        <div>
          <h2 className="font-display-md text-2xl text-on-surface uppercase tracking-tight">Academias (B2B)</h2>
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Gestão de Clientes Enterprise</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-primary-container hover:brightness-110 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95 neon-glow">
          <span className="material-symbols-outlined text-sm">add</span> Nova Academia
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academies.length === 0 ? (
          <div className="col-span-full text-center py-12 glass-panel rounded-[32px] border border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mx-auto mb-4 block">domain</span>
            <p className="font-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Nenhuma academia cadastrada.</p>
          </div>
        ) : (
          academies.map(acc => (
            <div key={acc.id} className="glass-panel p-6 rounded-[32px] border border-outline-variant/30 flex flex-col justify-between group hover:border-primary-container/30 transition-all">
              <div>
                <h3 className="font-headline-md text-xl text-on-surface uppercase tracking-tight mb-1">{acc.name}</h3>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">CNPJ: {acc.cnpj || 'Não informado'}</p>
                
                <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30">
                  <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">Acesso do Gestor</p>
                  <p className="font-headline-sm text-sm text-on-surface mt-1">{acc.admins?.[0]?.email || 'Sem gestor'}</p>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Senha: {acc.admins?.[0]?.password || '---'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="glass-panel w-full max-w-xl rounded-[40px] p-8 border border-outline-variant/30 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in duration-300">
            <h2 className="font-display-md text-2xl text-on-surface uppercase tracking-tight mb-6">Cadastrar Nova Academia</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-label-caps text-primary-container uppercase text-xs tracking-widest mb-4 border-b border-outline-variant/30 pb-2">1. Dados da Empresa</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Nome da Academia *</label>
                    <input 
                      required
                      type="text"
                      value={formData.academyName}
                      onChange={e => setFormData(p => ({...p, academyName: e.target.value}))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
                      placeholder="Ex: SmartFit Paulista"
                    />
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">CNPJ (Opcional)</label>
                    <input 
                      type="text"
                      value={formData.academyCnpj}
                      onChange={e => setFormData(p => ({...p, academyCnpj: e.target.value}))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-label-caps text-primary-container uppercase text-xs tracking-widest mb-4 border-b border-outline-variant/30 pb-2">2. Acesso do Gestor</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Nome do Gestor</label>
                    <input 
                      type="text"
                      value={formData.adminName}
                      onChange={e => setFormData(p => ({...p, adminName: e.target.value}))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">E-mail de Login *</label>
                      <input 
                        required
                        type="email"
                        value={formData.adminEmail}
                        onChange={e => setFormData(p => ({...p, adminEmail: e.target.value}))}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
                        placeholder="gestor@academia.com"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Senha Provisória *</label>
                      <input 
                        required
                        type="text"
                        value={formData.adminPassword}
                        onChange={e => setFormData(p => ({...p, adminPassword: e.target.value}))}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary-container font-body-md transition-all"
                        placeholder="Senha123!"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-outline-variant/30">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-highest text-on-surface py-4 rounded-2xl font-label-caps text-sm uppercase tracking-widest border border-outline-variant/30 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-primary-container hover:brightness-110 text-on-primary-container py-4 rounded-2xl font-label-caps text-sm uppercase tracking-widest transition-all disabled:opacity-50 neon-glow shadow-lg shadow-primary-container/10 active:scale-[0.98]"
              >
                {isSaving ? 'Salvando...' : 'Criar Academia'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
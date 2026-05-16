import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader2 } from 'lucide-react';
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

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white font-display">Academias (B2B)</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Gestão de Clientes Enterprise</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <Plus className="w-5 h-5" /> Nova Academia
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academies.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-[#1A1A1A] rounded-[32px] border border-white/5">
            <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase">Nenhuma academia cadastrada.</p>
          </div>
        ) : (
          academies.map(acc => (
            <div key={acc.id} className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/5 flex flex-col justify-between group hover:border-primary/30 transition-all">
              <div>
                <h3 className="text-xl font-black text-white font-display mb-1">{acc.name}</h3>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4">CNPJ: {acc.cnpj || 'Não informado'}</p>
                
                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Acesso do Gestor</p>
                  <p className="text-sm text-white font-bold">{acc.admins?.[0]?.email || 'Sem gestor'}</p>
                  <p className="text-xs text-slate-400">Senha: {acc.admins?.[0]?.password || '---'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-[#1A1A1A] w-full max-w-xl rounded-[40px] p-8 border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-white font-display mb-6">Cadastrar Nova Academia</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-4 border-b border-white/10 pb-2">1. Dados da Empresa</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Nome da Academia *</label>
                    <input 
                      required
                      type="text"
                      value={formData.academyName}
                      onChange={e => setFormData(p => ({...p, academyName: e.target.value}))}
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all"
                      placeholder="Ex: SmartFit Paulista"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">CNPJ (Opcional)</label>
                    <input 
                      type="text"
                      value={formData.academyCnpj}
                      onChange={e => setFormData(p => ({...p, academyCnpj: e.target.value}))}
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-4 border-b border-white/10 pb-2">2. Acesso do Gestor</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Nome do Gestor</label>
                    <input 
                      type="text"
                      value={formData.adminName}
                      onChange={e => setFormData(p => ({...p, adminName: e.target.value}))}
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">E-mail de Login *</label>
                      <input 
                        required
                        type="email"
                        value={formData.adminEmail}
                        onChange={e => setFormData(p => ({...p, adminEmail: e.target.value}))}
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all"
                        placeholder="gestor@academia.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Senha Provisória *</label>
                      <input 
                        required
                        type="text"
                        value={formData.adminPassword}
                        onChange={e => setFormData(p => ({...p, adminPassword: e.target.value}))}
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all"
                        placeholder="Senha123!"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary-dark text-black py-4 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, Users, LayoutDashboard, LogOut } from 'lucide-react';

export default function AcademyDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const stored = localStorage.getItem('vollonfit_academy');
      if (!session && !stored) {
        navigate('/', { replace: true });
        return;
      }
      
      if (stored) {
        setAdminData(JSON.parse(stored));
      }
      setChecking(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_academy');
    navigate('/');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Autenticando Gestor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center">
      <h1 className="text-4xl font-black text-primary font-display mb-4">Portal B2B</h1>
      <p className="text-slate-400 mb-8">Painel do Gestor de Academia em construção.</p>
      <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl flex items-center gap-2">
        <LogOut className="w-5 h-5" /> Sair do Portal
      </button>
    </div>
  );
}
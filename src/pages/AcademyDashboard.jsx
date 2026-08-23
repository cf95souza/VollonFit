import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AcademyDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingData, setLoadingData] = useState(true);
  
  // Custom Toast State
  const [toast, setToast] = useState(null);

  // Modals States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Forms States
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    quota_limit: 10
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    cnpj: '',
    logo_url: ''
  });

  const [studentSearch, setStudentSearch] = useState('');

  // B2B Products Management States
  const [academyProducts, setAcademyProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    affiliate_url: '',
    category: 'suplementos',
    is_active: true
  });

  // Helper to show custom toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkAuth = async () => {
    const stored = localStorage.getItem('vollonfit_academy');
    if (!stored) {
      navigate('/', { replace: true });
      return;
    }
    const admin = JSON.parse(stored);
    setAdminData(admin);
    setChecking(false);
    await fetchData(admin.academy_id);
  };

  const fetchData = async (academyId) => {
    setLoadingData(true);
    try {
      // 1. Fetch Academy Details
      const { data: academyData, error: academyErr } = await supabase
        .from('gym_academies')
        .select('*')
        .eq('id', academyId)
        .single();
      
      if (academyErr) throw academyErr;
      setAcademy(academyData);
      setProfileForm({
        name: academyData.name || '',
        cnpj: academyData.cnpj || '',
        logo_url: academyData.logo_url || ''
      });

      // 2. Fetch Teachers belonging to this Academy
      const { data: teachersData, error: teachersErr } = await supabase
        .from('gym_teachers')
        .select('*')
        .eq('academy_id', academyId)
        .order('name');
      
      if (teachersErr) throw teachersErr;

      // 3. Fetch Students for those Teachers
      if (teachersData && teachersData.length > 0) {
        const teacherIds = teachersData.map(t => t.id);
        const { data: studentsData, error: studentsErr } = await supabase
          .from('gym_students')
          .select('*, teacher:gym_teachers(name)')
          .in('teacher_id', teacherIds)
          .order('name');
        
        if (studentsErr) throw studentsErr;
        
        // Map student count to each teacher
        const enrichedTeachers = teachersData.map(t => ({
          ...t,
          studentCount: studentsData ? studentsData.filter(s => s.teacher_id === t.id).length : 0
        }));
        
        setTeachers(enrichedTeachers);
        setStudents(studentsData || []);
      } else {
        setTeachers([]);
        setStudents([]);
      }

      // 4. Fetch Academy Marketplace Products
      const { data: productsData, error: productsErr } = await supabase
        .from('gym_marketplace_products')
        .select('*')
        .eq('academy_id', academyId)
        .order('created_at', { ascending: false });
      
      if (!productsErr) {
        setAcademyProducts(productsData || []);
      }

    } catch (err) {
      showToast('Erro ao carregar dados: ' + err.message, 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vollonfit_academy');
    navigate('/');
  };

  // Manage Academy Products Methods
  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      affiliate_url: '',
      category: 'suplementos',
      is_active: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price || '',
      image_url: prod.image_url || '',
      affiliate_url: prod.affiliate_url || '',
      category: prod.category || 'suplementos',
      is_active: prod.is_active
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Nome e preço são obrigatórios', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const prodData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        image_url: productForm.image_url.trim(),
        affiliate_url: productForm.affiliate_url.trim(),
        category: productForm.category,
        is_active: productForm.is_active,
        academy_id: adminData.academy_id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .update(prodData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        showToast('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .insert([prodData]);

        if (error) throw error;
        showToast('Produto cadastrado com sucesso!');
      }
      setIsProductModalOpen(false);
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao salvar produto: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const { error } = await supabase
        .from('gym_marketplace_products')
        .delete()
        .eq('id', prodId);

      if (error) throw error;
      showToast('Produto removido com sucesso!');
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao deletar produto: ' + err.message, 'error');
    }
  };

  // Manage Teacher Methods
  const openNewTeacher = () => {
    if (teachers.length >= (academy?.max_teachers || 10)) {
      showToast('Limite de professores atingido! Faça upgrade do plano corporativo.', 'error');
      return;
    }
    setEditingTeacher(null);
    setTeacherForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      quota_limit: 10
    });
    setIsTeacherModalOpen(true);
  };

  const openEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      name: teacher.name,
      email: teacher.email,
      password: '', // Leave blank for edit unless they want to change
      phone: teacher.phone || '',
      quota_limit: teacher.quota_limit || 10
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.name || !teacherForm.email) {
      showToast('Nome e e-mail são obrigatórios', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTeacher) {
        // Edit Teacher logic
        const updateData = {
          name: teacherForm.name,
          email: teacherForm.email.trim().toLowerCase(),
          phone: teacherForm.phone,
          quota_limit: parseInt(teacherForm.quota_limit)
        };
        if (teacherForm.password) {
          updateData.password = teacherForm.password;
        }

        const { error } = await supabase
          .from('gym_teachers')
          .update(updateData)
          .eq('id', editingTeacher.id);

        if (error) throw error;
        showToast('Professor atualizado com sucesso!');
      } else {
        // Create Teacher logic
        if (!teacherForm.password) {
          showToast('Senha é obrigatória para novos professores', 'error');
          setIsSaving(false);
          return;
        }

        const { error } = await supabase
          .from('gym_teachers')
          .insert([{
            academy_id: adminData.academy_id,
            name: teacherForm.name,
            email: teacherForm.email.trim().toLowerCase(),
            password: teacherForm.password,
            phone: teacherForm.phone,
            quota_limit: parseInt(teacherForm.quota_limit),
            plan_type: 'premium', // Enterprise teachers are implicitly premium
            status: 'active'
          }]);

        if (error) throw error;
        showToast('Professor cadastrado com sucesso!');
      }

      setIsTeacherModalOpen(false);
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao salvar professor: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTeacherStatus = async (teacher) => {
    const newStatus = teacher.status === 'blocked' ? 'active' : 'blocked';
    try {
      const { error } = await supabase
        .from('gym_teachers')
        .update({ status: newStatus })
        .eq('id', teacher.id);
      
      if (error) throw error;
      showToast(`Professor ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'}!`);
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao atualizar status: ' + err.message, 'error');
    }
  };

  const handleDeleteTeacher = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await supabase
        .from('gym_teachers')
        .delete()
        .eq('id', confirmDeleteId);
      
      if (error) throw error;
      showToast('Professor removido com sucesso!');
      setConfirmDeleteId(null);
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao excluir professor: ' + err.message, 'error');
    }
  };

  // Manage Profile methods
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name) {
      showToast('O nome da academia é obrigatório', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('gym_academies')
        .update({
          name: profileForm.name,
          cnpj: profileForm.cnpj,
          logo_url: profileForm.logo_url
        })
        .eq('id', adminData.academy_id);

      if (error) throw error;
      showToast('Dados da academia atualizados com sucesso!');
      await fetchData(adminData.academy_id);
    } catch (err) {
      showToast('Erro ao salvar configurações: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students based on search string
  const filteredStudents = students.filter(s => {
    const search = studentSearch.toLowerCase().trim();
    if (!search) return true;
    return (
      s.name?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search) ||
      s.teacher?.name?.toLowerCase().includes(search)
    );
  });

  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-primary-container animate-spin mb-4">sync</span>
        <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-[0.3em]">Autenticando Gestor...</p>
      </div>
    );
  }

  const teacherQuotaPct = academy ? Math.min(100, Math.round((teachers.length / academy.max_teachers) * 100)) : 0;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans flex flex-col pb-12 relative overflow-x-hidden">
      
      {/* Toast Alert Component */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' 
            ? 'bg-error/10 border-error/30 text-error' 
            : 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
        }`}>
          <span className="material-symbols-outlined text-[20px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          <span className="font-headline-sm text-sm">{toast.message}</span>
        </div>
      )}

      {/* Corporate Dashboard Header */}
      <header className="border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border border-outline-variant/30 bg-surface-container overflow-hidden flex items-center justify-center relative">
              {academy?.logo_url ? (
                <img src={academy.logo_url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-primary-container">domain</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display-md text-on-surface tracking-tight leading-none">{academy?.name || 'Academia B2B'}</h1>
                <span className="bg-primary-container/10 text-primary-container border border-primary-container/20 text-[8px] font-label-caps uppercase px-2 py-0.5 rounded-full tracking-widest">Enterprise</span>
              </div>
              <p className="text-[10px] font-label-caps text-on-surface-variant mt-1 uppercase tracking-wider">Painel do Gestor Corporativo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-headline-sm text-on-surface leading-tight">{adminData?.name || 'Gestor Principal'}</p>
              <p className="text-[10px] text-on-surface-variant font-body-md">{adminData?.email}</p>
            </div>
            <button onClick={handleLogout} className="bg-surface-container hover:bg-error/10 hover:text-error text-on-surface-variant p-3 rounded-2xl border border-outline-variant/30 transition-all active:scale-95 flex items-center justify-center" title="Sair do Portal">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 mt-8 flex-1 w-full space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1.5 glass-panel border border-outline-variant/30 rounded-2xl max-w-fit overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-6 py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-primary-container text-on-primary-container neon-glow' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span> Visão Geral
          </button>
          
          <button 
            onClick={() => setActiveTab('teachers')} 
            className={`px-6 py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'teachers' ? 'bg-primary-container text-on-primary-container neon-glow' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span> Professores
          </button>

          <button 
            onClick={() => setActiveTab('students')} 
            className={`px-6 py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'students' ? 'bg-primary-container text-on-primary-container neon-glow' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield</span> Alunos
          </button>

          <button 
            onClick={() => setActiveTab('marketplace')} 
            className={`px-6 py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'marketplace' ? 'bg-primary-container text-on-primary-container neon-glow' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span> Marketplace
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-6 py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-primary-container text-on-primary-container neon-glow' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span> Configurações
          </button>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] glass-panel rounded-3xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-[40px] text-primary-container animate-spin mb-4">sync</span>
            <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">Sincronizando dados...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* KPI Metrics Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Metric: Teacher Quota limit */}
                  <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 relative overflow-hidden group hover:border-primary-container/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">Cota de Professores</p>
                          <h3 className="text-3xl font-display-lg text-on-surface">{teachers.length} <span className="font-body-md text-xs text-on-surface-variant">/ {academy?.max_teachers || 10}</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container">
                          <span className="material-symbols-outlined text-[20px]">group</span>
                        </div>
                      </div>
                      
                      {/* Interactive Progress Bar */}
                      <div className="mt-6">
                        <div className="flex justify-between font-label-caps text-[9px] uppercase text-on-surface-variant mb-1.5">
                          <span>Uso de Licenças</span>
                          <span>{teacherQuotaPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              teacherQuotaPct >= 90 ? 'bg-error shadow-[0_0_10px_rgba(255,84,73,0.2)]' : 
                              teacherQuotaPct >= 70 ? 'bg-warning shadow-[0_0_10px_rgba(253,184,39,0.2)]' : 
                              'bg-primary-container shadow-[0_0_10px_rgba(223,255,94,0.2)] neon-glow'
                            }`} 
                            style={{ width: `${teacherQuotaPct}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider mt-4">
                      {teachers.length >= (academy?.max_teachers || 10) 
                        ? '🚫 Limite atingido. Contate o suporte para liberar licenças.' 
                        : `✅ Mais ${ (academy?.max_teachers || 10) - teachers.length } licenças de professores disponíveis.`}
                    </p>
                  </div>

                  {/* Metric: Total Active Students */}
                  <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 hover:border-primary-container/30 transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">Total de Alunos</p>
                        <h3 className="text-3xl font-display-lg text-on-surface">{students.length}</h3>
                        <p className="font-body-md text-[10px] text-on-surface-variant mt-1">Matriculados na rede corporativa</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-secondary-container/10 border border-secondary-container/20 flex items-center justify-center text-secondary-container">
                        <span className="material-symbols-outlined text-[20px]">shield</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-headline-sm text-xs text-primary-container mt-6">
                      <span className="material-symbols-outlined text-[16px]">workspace_premium</span> Licenças Premium Ilimitadas inclusas
                    </div>
                  </div>

                  {/* Metric: Monthly Subscription Fixed Fee */}
                  <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 hover:border-primary-container/30 transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">Faturamento Fixo B2B</p>
                        <h3 className="text-3xl font-display-lg text-on-surface">R$ {academy?.monthly_fee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '899,00'}</h3>
                        <p className="font-body-md text-[10px] text-on-surface-variant mt-1">Cobrança Mensalidade Recorrente</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-center justify-center text-tertiary-container">
                        <span className="material-symbols-outlined text-[20px]">attach_money</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-label-caps text-[9px] uppercase text-tertiary-container tracking-wider mt-6">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span> Assinatura Ativa & Saudável
                    </div>
                  </div>

                </div>

                {/* Academy Profile & Corporate Info Panel */}
                <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30">
                  <h3 className="text-lg font-display-md text-on-surface mb-6">Informações e Dados Corporativos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30">
                      <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Razão Social / Nome</p>
                      <p className="font-headline-sm text-sm text-on-surface">{academy?.name}</p>
                    </div>
                    <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30">
                      <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">CNPJ de Faturamento</p>
                      <p className="font-headline-sm text-sm text-on-surface">{academy?.cnpj || 'Não cadastrado'}</p>
                    </div>
                    <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30">
                      <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Data de Ingresso</p>
                      <p className="font-headline-sm text-sm text-on-surface">{academy?.created_at ? new Date(academy.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</p>
                    </div>
                    <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30">
                      <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Suporte Integrado</p>
                      <p className="font-headline-sm text-xs text-primary-container">suporte@vollonfit.com.br</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: TEACHERS */}
            {activeTab === 'teachers' && (
              <div className="space-y-6">
                
                {/* Search / Action bar */}
                <div className="flex justify-between items-center glass-panel p-6 rounded-3xl border border-outline-variant/30">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface">Corpo Docente da Rede</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">Gerencie a cota e o acesso de seus professores associados</p>
                  </div>
                  <button 
                    onClick={openNewTeacher} 
                    className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-6 py-3 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center gap-2 transition-all neon-glow active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span> Cadastrar Professor
                  </button>
                </div>

                {/* Teachers Grid */}
                {teachers.length === 0 ? (
                  <div className="text-center py-16 glass-panel rounded-3xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mx-auto mb-4">group</span>
                    <p className="font-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Nenhum professor cadastrado ainda.</p>
                    <button onClick={openNewTeacher} className="mt-4 text-xs font-label-caps text-primary-container uppercase tracking-widest hover:underline">Adicione o primeiro agora</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map(t => (
                      <div key={t.id} className="glass-panel p-6 rounded-3xl border border-outline-variant/30 hover:border-primary-container/30 transition-all flex flex-col justify-between group">
                        
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-sm">
                                {t.name?.[0]}
                              </div>
                              <div>
                                <h4 className="font-headline-sm text-on-surface text-sm leading-none">{t.name}</h4>
                                <p className="font-body-md text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">mail</span> {t.email}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-label-caps uppercase px-2.5 py-0.5 rounded-full ${
                              t.status === 'active' ? 'bg-tertiary-container/10 text-tertiary-container' : 'bg-error/10 text-error'
                            }`}>
                              {t.status === 'active' ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </div>

                          <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30 space-y-3 mb-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-label-caps text-on-surface-variant uppercase text-[10px] tracking-wider">Alunos Vinculados</span>
                              <span className="font-headline-sm text-on-surface">{t.studentCount} / {t.quota_limit}</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary-container" 
                                style={{ width: `${Math.min(100, Math.round((t.studentCount / (t.quota_limit || 10)) * 100))}%` }} 
                              />
                            </div>
                            {t.phone && (
                              <p className="font-body-md text-[10px] text-on-surface-variant flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px]">phone</span> {t.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-outline-variant/30">
                          <button 
                            onClick={() => openEditTeacher(t)} 
                            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-label-caps uppercase tracking-wider text-on-surface-variant bg-surface-container hover:bg-surface-container/80 rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span> Editar
                          </button>
                          
                          <button 
                            onClick={() => toggleTeacherStatus(t)} 
                            title={t.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} 
                            className={`py-2 px-3 rounded-md transition-colors ${
                              t.status === 'blocked' 
                                ? 'text-tertiary-container bg-tertiary-container/10 hover:bg-tertiary-container/20' 
                                : 'text-warning bg-warning/10 hover:bg-warning/20'
                            }`}
                          >
                            {t.status === 'blocked' ? <span className="material-symbols-outlined text-[16px]">lock_open</span> : <span className="material-symbols-outlined text-[16px]">lock</span>}
                          </button>

                          <button 
                            onClick={() => setConfirmDeleteId(t.id)} 
                            className="py-2 px-3 text-error bg-error/10 hover:bg-error/20 rounded-md transition-colors"
                            title="Remover Professor"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB: STUDENTS */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                
                {/* Search and Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-3xl border border-outline-variant/30">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface">Alunos Corporativos</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">Monitoramento unificado de todos os matriculados na academia</p>
                  </div>
                  
                  <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2">search</span>
                    <input 
                      type="text" 
                      placeholder="Pesquisar por aluno ou professor..." 
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                    />
                  </div>
                </div>

                {/* Students Table */}
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-16 glass-panel rounded-3xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mx-auto mb-4">group</span>
                    <p className="font-label-caps text-on-surface-variant uppercase tracking-wider text-xs">Nenhum aluno cadastrado na rede corporativa.</p>
                  </div>
                ) : (
                  <div className="glass-panel rounded-3xl border border-outline-variant/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant/30 bg-surface-container/50 font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
                            <th className="px-6 py-4">Nome do Aluno</th>
                            <th className="px-6 py-4">Professor Responsável</th>
                            <th className="px-6 py-4">E-mail</th>
                            <th className="px-6 py-4">Telefone</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {filteredStudents.map(s => (
                            <tr key={s.id} className="hover:bg-surface-container/50 transition-colors duration-150 text-sm">
                              <td className="px-6 py-4 font-headline-sm text-on-surface flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-on-surface-variant">
                                  {s.name?.[0]}
                                </div>
                                {s.name}
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant font-body-md">
                                {s.teacher?.name || 'Não atribuído'}
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant text-xs font-body-md">{s.email}</td>
                              <td className="px-6 py-4 text-on-surface-variant text-xs font-body-md font-semibold">{s.phone || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`font-label-caps text-[9px] uppercase px-2 py-0.5 rounded-full ${
                                  s.status === 'active' ? 'bg-tertiary-container/10 text-tertiary-container' : 'bg-surface-container text-on-surface-variant'
                                }`}>
                                  {s.status === 'active' ? 'Ativo' : 'Dormindo'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: PROFILE/SETTINGS */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form configuration block */}
                <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface">Dados da Academia</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">Configure o perfil público e identidade visual da sua marca corporativa</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                      <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Razão Social / Nome da Academia</label>
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container/50" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">CNPJ Corporativo</label>
                      <input 
                        type="text" 
                        value={profileForm.cnpj} 
                        onChange={(e) => setProfileForm({ ...profileForm, cnpj: e.target.value })}
                        placeholder="Ex: 00.000.000/0001-00"
                        className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" 
                      />
                    </div>

                    <div>
                      <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">URL da Logomarca (PNG/JPG)</label>
                      <input 
                        type="url" 
                        value={profileForm.logo_url} 
                        onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                        placeholder="Insira a URL de hospedagem da sua imagem de logo"
                        className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 disabled:opacity-50 px-8 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all neon-glow active:scale-95"
                    >
                      {isSaving ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : 'Salvar Alterações'}
                    </button>
                  </form>
                </div>

                {/* BLOC: Link de Convite para Professores */}
                <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 lg:col-span-2 space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary-container">key</span> Link de Convite para Professores
                    </h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">
                      Compartilhe este link exclusivo para que os professores da sua academia se cadastrem de forma autônoma
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      Ao abrir este link, os professores poderão criar suas próprias contas no VollonFit e serão **automaticamente vinculados à sua academia corporativa**, consumindo sua cota ativa de licenças de forma transparente e imediata.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        readOnly
                        value={`${window.location.origin}/login?academy=${adminData?.academy_id || ''}`}
                        className="flex-1 bg-surface-container border border-outline-variant/30 rounded-2xl px-5 py-4 text-xs font-headline-sm text-primary-container select-all focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/login?academy=${adminData?.academy_id || ''}`)
                          showToast('Link de convite do professor copiado com sucesso!')
                        }}
                        className="px-6 py-4 bg-surface-container border border-outline-variant/30 hover:bg-surface-container/80 hover:border-outline-variant/50 text-on-surface rounded-2xl text-xs font-label-caps uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Copiar Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar summary info block */}
                <div className="glass-panel p-8 rounded-3xl border border-outline-variant/30 space-y-6">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface">Resumo do Plano</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">Sua modalidade de parceria ativa</p>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-6 space-y-5">
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label-caps text-on-surface-variant uppercase tracking-wider text-[10px]">Cota de Professores</span>
                      <span className="font-headline-sm text-on-surface text-sm">{academy?.max_teachers || 10}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label-caps text-on-surface-variant uppercase tracking-wider text-[10px]">Mensalidade Recorrente</span>
                      <span className="font-headline-sm text-primary-container text-sm">R$ {academy?.monthly_fee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '899,00'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label-caps text-on-surface-variant uppercase tracking-wider text-[10px]">Alunos Permitidos</span>
                      <span className="font-headline-sm text-tertiary-container text-sm uppercase tracking-wider">Ilimitados</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label-caps text-on-surface-variant uppercase tracking-wider text-[10px]">Módulo White Label</span>
                      <span className="font-headline-sm text-primary-container text-sm uppercase tracking-wider">Ativo</span>
                    </div>

                    {academy?.logo_url && (
                      <div className="border-t border-outline-variant/30 pt-6 text-center">
                        <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-3">Prévia do Logo</p>
                        <div className="w-24 h-24 rounded-3xl border border-outline-variant/30 bg-surface-container/60 mx-auto overflow-hidden flex items-center justify-center">
                          <img src={academy.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* TAB: MARKETPLACE MANAGEMENT */}
            {activeTab === 'marketplace' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Header block */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-3xl border border-outline-variant/30">
                  <div>
                    <h3 className="text-lg font-display-md text-on-surface">Produtos & Marketplace</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">Gerencie os suplementos, vestuários e planos extras que seus alunos visualizam no app</p>
                  </div>
                  
                  <button 
                    onClick={openNewProduct}
                    className="bg-primary-container hover:bg-primary-container/90 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center gap-2 transition-all neon-glow active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> Novo Produto
                  </button>
                </div>

                {/* Products Grid */}
                {academyProducts.length === 0 ? (
                  <div className="text-center py-20 glass-panel rounded-3xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mx-auto mb-4">shopping_bag</span>
                    <p className="font-label-caps text-on-surface-variant uppercase tracking-wider text-xs mb-2">Nenhum produto cadastrado pela academia.</p>
                    <p className="font-body-md text-[11px] text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                      Seus alunos verão uma vitrine vazia. Clique em "Novo Produto" para adicionar suplementos, vestuários ou acessórios personalizados!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {academyProducts.map(prod => (
                      <div key={prod.id} className="glass-panel rounded-3xl border border-outline-variant/30 overflow-hidden flex flex-col group transition-all hover:border-primary-container/30">
                        {/* Image Preview */}
                        <div className="aspect-[16/10] relative overflow-hidden bg-surface-container/40 border-b border-outline-variant/30">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50">
                              <span className="material-symbols-outlined text-[48px]">shopping_bag</span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="bg-surface/85 backdrop-blur-md font-label-caps text-[8px] text-primary-container px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary-container/20">
                              {prod.category}
                            </span>
                          </div>
                          {!prod.is_active && (
                            <div className="absolute top-4 right-4">
                              <span className="bg-error/90 text-on-error font-label-caps text-[8px] uppercase px-2.5 py-1 rounded-full tracking-widest">
                                Inativo
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info Block */}
                        <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h4 className="font-headline-sm text-sm text-on-surface leading-tight line-clamp-2">{prod.name}</h4>
                            <p className="font-body-md text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">{prod.description || 'Sem descrição cadastrada.'}</p>
                          </div>

                          <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                            <div>
                              <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest leading-none mb-1">Preço</p>
                              <p className="font-display-md text-base text-primary-container">R$ {parseFloat(prod.price).toFixed(2)}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openEditProduct(prod)}
                                className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all"
                                title="Editar Produto"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="w-8 h-8 rounded-xl bg-error/10 hover:bg-error text-error hover:text-on-error flex items-center justify-center transition-all"
                                title="Excluir Produto"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL: TEACHER FORM (NEW & EDIT) */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-outline-variant/30 rounded-[40px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsTeacherModalOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-display-md text-on-surface flex items-center gap-2">
                {editingTeacher ? <span className="material-symbols-outlined text-[20px] text-primary-container">edit</span> : <span className="material-symbols-outlined text-[20px] text-primary-container">add</span>}
                {editingTeacher ? 'Editar Professor' : 'Cadastrar Professor'}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Preencha as informações do profissional de educação física</p>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="Nome do profissional"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">E-mail (Login de Acesso)</label>
                <input 
                  type="email" 
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">
                  {editingTeacher ? 'Senha (Deixe em branco para manter)' : 'Senha de Acesso'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2">key</span>
                  <input 
                    type="password" 
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    placeholder={editingTeacher ? '••••••••' : 'Defina a senha'}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                    required={!editingTeacher}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Limite de Alunos</label>
                  <input 
                    type="number" 
                    value={teacherForm.quota_limit}
                    onChange={(e) => setTeacherForm({ ...teacherForm, quota_limit: e.target.value })}
                    min="1"
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container/50"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl border border-outline-variant/30 font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all text-on-surface-variant"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-primary-container text-on-primary-container rounded-xl font-label-caps text-xs uppercase tracking-widest hover:bg-primary-container/90 transition-all flex items-center justify-center gap-2 neon-glow"
                >
                  {isSaving ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : 'Salvar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-error/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <span className="material-symbols-outlined text-[48px] text-error mx-auto mb-4">error</span>
            <h4 className="text-md font-display-md text-on-surface mb-2">Excluir Professor?</h4>
            <p className="font-body-md text-xs text-on-surface-variant mb-6">Esta ação é irreversível. Todos os alunos associados a este professor perderão a conexão e dados.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 font-label-caps text-[10px] uppercase tracking-widest hover:bg-surface-container text-on-surface-variant"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteTeacher}
                className="flex-1 py-2.5 bg-error hover:bg-error/90 text-on-error rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT FORM (NEW & EDIT) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-outline-variant/30 rounded-[40px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsProductModalOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-display-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary-container">shopping_bag</span>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Preencha as informações do produto ou serviço ofertado</p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Nome do Produto</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Creatina Pura 300g"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Descrição Curta</label>
                <input 
                  type="text" 
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ex: Auxilia no ganho de força e volume muscular."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="99.90"
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container/50"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Categoria</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container/50"
                  >
                    <option value="suplementos">Suplementos</option>
                    <option value="equipamentos">Equipamentos</option>
                    <option value="acessorios">Acessórios</option>
                    <option value="servicos">Serviços</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">URL da Imagem do Produto</label>
                <input 
                  type="url" 
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem-produto.png"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">Link de Compra / Afiliado (Stripe/WhatsApp)</label>
                <input 
                  type="url" 
                  value={productForm.affiliate_url}
                  onChange={(e) => setProductForm({ ...productForm, affiliate_url: e.target.value })}
                  placeholder="https://wa.me/..."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="prod_active"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-surface-container border-outline-variant/30 text-primary-container focus:ring-primary-container/50"
                />
                <label htmlFor="prod_active" className="font-headline-sm text-xs text-on-surface cursor-pointer">
                  Disponível para venda (Ativo)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl border border-outline-variant/30 font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all text-on-surface-variant"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-primary-container text-on-primary-container rounded-xl font-label-caps text-xs uppercase tracking-widest hover:bg-primary-container/90 transition-all flex items-center justify-center gap-2 neon-glow"
                >
                  {isSaving ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : 'Salvar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
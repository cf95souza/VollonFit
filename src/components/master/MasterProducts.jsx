import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function MasterProducts({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    affiliate_url: '',
    category: 'suplementos',
    is_active: true
  })

  const categories = ['Todos', 'suplementos', 'equipamentos', 'acessorios', 'servicos', 'outros']

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gym_marketplace_products')
        .select('*')
        .is('academy_id', null) // Apenas produtos globais do Master Admin
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
    } catch (err) {
      showToast('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      affiliate_url: '',
      category: 'suplementos',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (prod) => {
    setEditingId(prod.id)
    setForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price || '',
      image_url: prod.image_url || '',
      affiliate_url: prod.affiliate_url || '',
      category: prod.category || 'suplementos',
      is_active: prod.is_active
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      showToast('Nome e preço são obrigatórios', 'error')
      return
    }

    setIsSaving(true)
    try {
      const prodData = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        image_url: form.image_url.trim(),
        affiliate_url: form.affiliate_url.trim(),
        category: form.category,
        is_active: form.is_active,
        academy_id: null // Explicitamente nulo para indicar produto global do Master ADM
      }

      if (editingId) {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .update(prodData)
          .eq('id', editingId)

        if (error) throw error
        showToast('Produto atualizado!')
      } else {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .insert([prodData])

        if (error) throw error
        showToast('Produto criado com sucesso!')
      }
      setIsModalOpen(false)
      fetchProducts()
    } catch (err) {
      showToast('Erro ao salvar produto: ' + err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente deletar este produto global?')) return
    try {
      const { error } = await supabase
        .from('gym_marketplace_products')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast('Produto deletado!')
      fetchProducts()
    } catch (err) {
      showToast('Erro ao deletar produto: ' + err.message, 'error')
    }
  }

  const filtered = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'Todos' || prod.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center glass-panel p-6 rounded-[32px] border border-outline-variant/30 shadow-2xl">
        <div>
          <h2 className="text-3xl font-display-lg text-on-surface uppercase tracking-tight">Marketplace Global (ADM)</h2>
          <p className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-widest mt-1">Gerencie os anúncios globais de produtos mostrados aos alunos independentes</p>
        </div>
        
        <button 
          onClick={handleOpenNew}
          className="bg-primary-container hover:brightness-110 text-on-primary-container px-6 py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95 neon-glow w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span> Novo Produto ADM
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <span className="material-symbols-outlined w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-container transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou descrição..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md" 
          />
        </div>
        
        <div>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md appearance-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-surface">
                {cat === 'Todos' ? 'Todas as Categorias' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined w-10 h-10 text-primary-container animate-spin mb-4 text-4xl">sync</span>
          <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">Sincronizando Marketplace...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mx-auto mb-4 block">shopping_bag</span>
          <p className="text-on-surface-variant font-label-caps uppercase tracking-widest text-xs">Nenhum produto global cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(prod => (
            <div key={prod.id} className="glass-panel rounded-3xl border border-outline-variant/30 overflow-hidden flex flex-col group transition-all hover:border-primary-container/30">
              {/* Product Image */}
              <div className="aspect-[16/10] relative overflow-hidden bg-surface-container border-b border-outline-variant/30">
                {prod.image_url ? (
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl">shopping_bag</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-surface/80 backdrop-blur-md text-[8px] font-label-caps text-primary-container px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary-container/20">
                    {prod.category}
                  </span>
                </div>
                {!prod.is_active && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-error/90 text-on-error text-[8px] font-label-caps uppercase px-2.5 py-1 rounded-full tracking-widest">
                      Inativo
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-sm font-headline-sm text-on-surface leading-tight line-clamp-2">{prod.name}</h4>
                  <p className="text-xs text-on-surface-variant font-body-md mt-1 line-clamp-2 leading-relaxed">{prod.description || 'Sem descrição cadastrada.'}</p>
                </div>

                <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-widest leading-none mb-1">Preço Sugerido</p>
                    <p className="text-base font-display-sm text-primary-container">R$ {parseFloat(prod.price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(prod)}
                      className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all"
                      title="Editar Produto"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(prod.id)}
                      className="w-10 h-10 rounded-xl bg-error/10 hover:bg-error text-error hover:text-on-error flex items-center justify-center transition-all"
                      title="Excluir Produto"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-outline-variant/30 rounded-[40px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-8 border-b border-outline-variant/30 pb-6">
              <h3 className="text-xl font-display-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">shopping_bag</span>
                {editingId ? 'Editar Produto ADM' : 'Cadastrar Novo Produto ADM'}
              </h3>
              <p className="text-xs font-body-md text-on-surface-variant mt-2">Este produto estará visível para todos os alunos de coaches independentes</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Creatina Pura 300g"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-all font-body-md"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Descrição Curta</label>
                <input 
                  type="text" 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Auxilia no ganho de força e volume muscular."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-all font-body-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="99.90"
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-all font-body-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Categoria</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:outline-none focus:border-primary-container transition-all font-body-md appearance-none"
                  >
                    <option value="suplementos" className="bg-surface">Suplementos</option>
                    <option value="equipamentos" className="bg-surface">Equipamentos</option>
                    <option value="acessorios" className="bg-surface">Acessórios</option>
                    <option value="servicos" className="bg-surface">Serviços</option>
                    <option value="outros" className="bg-surface">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">URL da Imagem do Produto</label>
                <input 
                  type="url" 
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem-produto.png"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-all font-body-md"
                />
              </div>

              <div>
                <label className="block text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Link de Compra / Afiliado</label>
                <input 
                  type="url" 
                  value={form.affiliate_url}
                  onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                  placeholder="https://wa.me/..."
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container transition-all font-body-md"
                />
              </div>

              <div className="flex items-center gap-3 py-4 border-t border-outline-variant/30 mt-6">
                <input 
                  type="checkbox" 
                  id="master_prod_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-outline-variant/30 bg-surface-container text-primary-container focus:ring-primary-container/50"
                />
                <label htmlFor="master_prod_active" className="text-sm font-body-md text-on-surface cursor-pointer">
                  Disponível para venda (Ativo)
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl border border-outline-variant/30 text-[10px] font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all text-on-surface-variant"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-4 bg-primary-container text-on-primary-container rounded-2xl text-[10px] font-label-caps uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 neon-glow shadow-lg shadow-primary-container/20 disabled:opacity-50"
                >
                  {isSaving ? <span className="material-symbols-outlined w-4 h-4 animate-spin">sync</span> : 'Salvar Produto'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

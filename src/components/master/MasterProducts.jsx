import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { ShoppingBag, Plus, X, Search, Edit3, Trash2, Loader2, Sparkles } from 'lucide-react'

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
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-[#0F172A] p-6 rounded-2xl border border-white/5 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Marketplace Global (ADM)</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gerencie os anúncios globais de produtos mostrados aos alunos independentes</p>
        </div>
        
        <button 
          onClick={handleOpenNew}
          className="bg-primary hover:bg-primary-dark text-black px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 animate-pulse"
        >
          <Plus className="w-4 h-4" /> Novo Produto ADM
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group md:col-span-2">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou descrição..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-bold" 
          />
        </div>
        
        <div>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#0F172A] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'Todos' ? 'Todas as Categorias' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0F172A] rounded-2xl border border-white/5">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Sincronizando Marketplace...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#0F172A] rounded-2xl border border-white/5">
          <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Nenhum produto global cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(prod => (
            <div key={prod.id} className="bg-[#0F172A] rounded-3xl border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-primary/20">
              {/* Product Image */}
              <div className="aspect-[16/10] relative overflow-hidden bg-black/40 border-b border-white/5">
                {prod.image_url ? (
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-black/80 backdrop-blur-md text-[8px] font-black text-primary px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                    {prod.category}
                  </span>
                </div>
                {!prod.is_active && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-rose-500/90 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest">
                      Inativo
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white leading-tight line-clamp-2">{prod.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1 line-clamp-2 leading-relaxed">{prod.description || 'Sem descrição cadastrada.'}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Preço Sugerido</p>
                    <p className="text-base font-black text-primary font-display">R$ {parseFloat(prod.price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(prod)}
                      className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-black transition-all"
                      title="Editar Produto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(prod.id)}
                      className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white flex items-center justify-center transition-all"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/5 rounded-[40px] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-white font-display flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {editingId ? 'Editar Produto ADM' : 'Cadastrar Novo Produto ADM'}
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Este produto estará visível para todos os alunos de coaches independentes</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nome do Produto</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Creatina Pura 300g"
                  className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Descrição Curta</label>
                <input 
                  type="text" 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Auxilia no ganho de força e volume muscular."
                  className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="99.90"
                    className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Categoria</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
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
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">URL da Imagem do Produto</label>
                <input 
                  type="url" 
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem-produto.png"
                  className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Link de Compra / Afiliado (Stripe/WhatsApp)</label>
                <input 
                  type="url" 
                  value={form.affiliate_url}
                  onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                  placeholder="https://wa.me/..."
                  className="w-full px-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="master_prod_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-black border-white/5 text-primary focus:ring-primary/50"
                />
                <label htmlFor="master_prod_active" className="text-xs font-bold text-slate-350 cursor-pointer">
                  Disponível para venda (Ativo)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-slate-400"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

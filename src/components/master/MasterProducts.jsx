import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  X, 
  Loader2, 
  Tag, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function MasterProducts({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  
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
        .is('academy_id', null)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
    } catch (err) {
      showToast('Erro ao carregar produtos: ' + err.message, 'error')
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
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image_url: form.image_url,
        affiliate_url: form.affiliate_url,
        category: form.category,
        is_active: form.is_active,
        academy_id: null
      }

      if (editingId) {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        showToast('Produto atualizado!')
      } else {
        const { error } = await supabase
          .from('gym_marketplace_products')
          .insert([payload])
        if (error) throw error
        showToast('Produto adicionado ao Marketplace!')
      }

      setIsModalOpen(false)
      fetchProducts()
    } catch (err) {
      showToast('Erro ao salvar produto: ' + err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatus = async (prod) => {
    try {
      const { error } = await supabase
        .from('gym_marketplace_products')
        .update({ is_active: !prod.is_active })
        .eq('id', prod.id)
      
      if (error) throw error
      showToast(prod.is_active ? 'Produto ocultado do app' : 'Produto ativado no app!')
      fetchProducts()
    } catch (err) {
      showToast('Erro ao alterar status', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('gym_marketplace_products')
        .delete()
        .eq('id', id)
      if (error) throw error
      showToast('Produto removido')
      setConfirmDelete(null)
      fetchProducts()
    } catch (err) {
      showToast('Erro ao deletar', 'error')
    }
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header Card */}
      <div className="vollon-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase text-white tracking-tight">
            Marketplace Global
          </h2>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1">
            Gestão de produtos, suplementos e links de afiliados exibidos para todos os alunos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input 
              type="text" 
              placeholder="Buscar no marketplace..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#E11D2E] transition-colors" 
            />
          </div>
          <button 
            onClick={handleOpenNew}
            className="vollon-btn-primary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_6px_20px_rgba(255,59,74,0.3)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Pills de Categoria */}
      <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#E11D2E]/15 text-[#FF3B4A] border border-[#E11D2E]/40'
                : 'bg-[#141414] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF3B4A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center vollon-card rounded-3xl">
            <ShoppingBag className="w-12 h-12 text-[#A3A3A3] mx-auto mb-3 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
              Nenhum produto cadastrado no acervo global.
            </p>
          </div>
        ) : (
          filtered.map(prod => (
            <div 
              key={prod.id} 
              className="vollon-card rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-[#E11D2E]/60 transition-colors shadow-lg"
            >
              <div>
                {/* Imagem do Produto */}
                <div className="w-full h-44 bg-[#1A1A1A] relative overflow-hidden flex items-center justify-center border-b border-[#2A2A2A]">
                  {prod.image_url ? (
                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-[#52525B]" />
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A0A0A]/85 backdrop-blur-md border border-[#2A2A2A] text-[9px] font-bold text-white uppercase tracking-wider">
                    {prod.category}
                  </span>
                  {!prod.is_active && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#E11D2E]/90 text-white text-[9px] font-bold uppercase tracking-wider">
                      Inativo
                    </span>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-sm text-white truncate" title={prod.name}>
                    {prod.name}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
                    {prod.description || 'Sem descrição cadastrada.'}
                  </p>
                  <p className="font-display text-2xl font-black text-white pt-1">
                    R$ {Number(prod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Ações no Rodapé do Card */}
              <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => toggleStatus(prod)}
                    title={prod.is_active ? 'Ocultar do app' : 'Exibir no app'}
                    className="p-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                  >
                    {prod.is_active ? <Eye className="w-3.5 h-3.5 text-[#FF3B4A]" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {prod.affiliate_url && (
                    <a 
                      href={prod.affiliate_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition-colors"
                      title="Abrir Link Afiliado"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                    title="Editar Produto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(prod.id)}
                    className="p-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#FF3B4A] transition-colors cursor-pointer"
                    title="Remover Produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal Criar / Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSave}
            className="vollon-card w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-[#2A2A2A] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight">
                  {editingId ? 'Editar Produto' : 'Novo Produto Global'}
                </h2>
                <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest mt-0.5">
                  Marketplace e Afiliados VollonFit
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Nome do Produto *
                </label>
                <input 
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="Ex: Whey Protein Isolado 900g"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Preço (R$) *
                  </label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                    placeholder="159.90"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors cursor-pointer"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c} className="bg-[#141414] text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  URL da Imagem
                </label>
                <input 
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm({...form, image_url: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="https://exemplo.com/imagem-produto.jpg"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Link de Afiliado ou Compra
                </label>
                <input 
                  type="url"
                  value={form.affiliate_url}
                  onChange={e => setForm({...form, affiliate_url: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors"
                  placeholder="https://growthsupplements.com.br/afiliado?ref=vollon"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                  Descrição do Produto
                </label>
                <textarea 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E11D2E] transition-colors h-24 resize-none"
                  placeholder="Benefícios, sabor, dosagem recomendada..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2A2A2A]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="vollon-btn-secondary flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="vollon-btn-primary flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(255,59,74,0.35)]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="vollon-card w-full max-w-sm rounded-3xl p-6 text-center border border-[#2A2A2A] space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#E11D2E]/20 text-[#FF3B4A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-white">Remover Produto?</h3>
              <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">
                Este item será removido definitivamente do marketplace para todos os alunos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="vollon-btn-secondary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(confirmDelete)}
                className="vollon-btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

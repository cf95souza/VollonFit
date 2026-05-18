import { useState, useEffect } from 'react'
import { ShoppingBag, ExternalLink, Tag, Sparkles, Filter } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function MarketplaceTab({ showToast, teacherAcademyId }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todos')

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        let query = supabase
          .from('gym_marketplace_products')
          .select('*')
          .eq('is_active', true)

        if (teacherAcademyId) {
          // Aluno corporativo: vê apenas produtos da respectiva academia
          query = query.eq('academy_id', teacherAcademyId)
        } else {
          // Aluno de personal independente: vê apenas os produtos globais cadastrados pelo Master ADM
          query = query.is('academy_id', null)
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (!error) setProducts(data || [])
      } catch (err) {
        console.error("Erro ao carregar produtos do marketplace:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [teacherAcademyId])

  const categories = ['Todos', ...new Set(products.map(p => p.category))]
  const filteredProducts = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory)

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 py-6 space-y-8 pb-32">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 border border-primary/20">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Marketplace</h2>
        <p className="text-slate-400 font-medium text-sm px-4">
          {teacherAcademyId 
            ? "Produtos e ofertas exclusivas oferecidas pela sua academia! 🏢🔥"
            : "Suplementos e acessórios selecionados pelo seu Coach. 🔥"
          }
        </p>
      </div>

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeCategory === cat 
              ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
              : 'bg-[#1A1A1A] text-slate-500 border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-[#1A1A1A] rounded-[32px] border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-primary/30">
            <div className="aspect-[16/10] sm:aspect-square relative overflow-hidden bg-black/40">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <ShoppingBag className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-black/60 backdrop-blur-md text-[8px] font-black text-primary px-2 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-black text-white leading-tight line-clamp-2">{product.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-1">{product.description}</p>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Preço Sugerido</p>
                  <p className="text-lg font-black text-primary font-display">R$ {parseFloat(product.price).toFixed(2)}</p>
                </div>
                <a 
                  href={product.affiliate_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all active:scale-90 border border-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner de Indicação */}
      <div className="bg-primary p-8 rounded-[40px] relative overflow-hidden group shadow-2xl shadow-primary/20">
        <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-black/5 rotate-12 transition-transform group-hover:rotate-45 duration-1000" />
        <div className="relative z-10">
          <h3 className="text-xl font-black text-black font-display uppercase leading-tight mb-2">Quer indicar produtos?</h3>
          <p className="text-black/60 text-sm font-bold mb-6 pr-10">Torne-se um embaixador VollonFit e ganhe comissão por cada venda!</p>
          <button className="bg-black text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
            Saber Mais
          </button>
        </div>
      </div>
    </div>
  )
}

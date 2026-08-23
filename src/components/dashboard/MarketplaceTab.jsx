import { useState, useEffect } from 'react'
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
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-primary-container border-t-transparent animate-spin"></div></div>
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 py-md space-y-lg pb-32">
      <div className="text-center space-y-sm">
        <div className="w-20 h-20 bg-primary-container/10 text-primary-container rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(195,244,0,0.2)] border border-primary-container/20">
          <span className="material-symbols-outlined text-4xl">shopping_bag</span>
        </div>
        <h2 className="font-display-xl text-3xl text-primary uppercase tracking-tight">Marketplace</h2>
        <p className="font-body-md text-sm text-on-surface-variant px-4">
          {teacherAcademyId 
            ? "Produtos e ofertas exclusivas oferecidas pela sua academia! 🏢🔥"
            : "Suplementos e acessórios selecionados pelo seu Coach. 🔥"
          }
        </p>
      </div>

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-xl font-label-caps text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeCategory === cat 
              ? 'bg-primary-container text-on-primary-container border-primary-container shadow-[0_0_10px_rgba(195,244,0,0.2)]' 
              : 'glass-panel text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-panel rounded-3xl border border-outline-variant/30 overflow-hidden flex flex-col group transition-all hover:border-primary-container/50">
            <div className="aspect-[16/10] sm:aspect-square relative overflow-hidden bg-surface-container-highest">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl opacity-30">shopping_bag</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-surface/80 backdrop-blur-md font-label-caps text-[8px] text-primary-container px-3 py-1 rounded-full uppercase tracking-widest border border-primary-container/20">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3">
              <div>
                <h4 className="font-headline-md text-sm text-on-surface leading-tight line-clamp-2">{product.name}</h4>
                <p className="font-body-md text-[10px] text-on-surface-variant mt-1 line-clamp-1">{product.description}</p>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest leading-none mb-1">Preço Sugerido</p>
                  <p className="font-display-lg text-lg text-primary">R$ {parseFloat(product.price).toFixed(2)}</p>
                </div>
                <a 
                  href={product.affiliate_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-90 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner de Indicação */}
      <div className="bg-primary-container p-8 rounded-3xl relative overflow-hidden group shadow-[0_0_30px_rgba(195,244,0,0.15)] neon-glow mt-8">
        <span className="material-symbols-outlined absolute -right-4 -top-4 text-9xl text-on-primary-container/5 rotate-12 transition-transform group-hover:rotate-45 duration-1000">auto_awesome</span>
        <div className="relative z-10">
          <h3 className="font-display-lg text-xl text-on-primary-container uppercase leading-tight mb-2">Quer indicar produtos?</h3>
          <p className="font-body-md text-sm text-on-primary-container/80 mb-6 pr-10">Torne-se um embaixador VollonFit e ganhe comissão por cada venda!</p>
          <button className="bg-surface text-on-surface px-6 py-3 rounded-xl font-label-caps text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
            Saber Mais
          </button>
        </div>
      </div>
    </div>
  )
}

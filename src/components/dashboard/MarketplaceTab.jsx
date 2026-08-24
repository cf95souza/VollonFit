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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-md pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel { background: rgba(44, 48, 54, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .neon-glow { box-shadow: 0 0 15px rgba(195,244,0,0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {/* Hero Section */}
      <section className="relative w-full h-[200px] rounded-xl overflow-hidden glass-panel flex flex-col justify-end p-4">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzrxwe2173m0MurWFseK20TZulILs_zLRbYc832XRbWJQoM-fKscR_M16n7ZpmRn1hHsaLbF-KcvumhOZAm6YksnS0s9haTuTuxhZ8hsfVPl6FHaXbqjOHZBaQm_S_dRycBvPb6CSTVQ18syIARCbkOpRLj1KKnNtwOlSF4Xn2zWBkVvm8l1LxSHdDaIXv0xSMOsl4THQuZ4o-ZnNOcEadRKYP0kaSAibzYFIUtdKkmhR7EsEBrFhr" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101417] to-transparent"></div>
        </div>
        <div className="relative z-10 space-y-1">
          <span className="inline-block px-2 py-1 bg-primary/20 text-primary font-sans text-[10px] font-bold rounded-sm border border-primary/30 uppercase tracking-widest">
            {teacherAcademyId ? "Exclusivo Alunos" : "STRENGTH HUB"}
          </span>
          <h2 className="font-sans text-2xl text-white font-bold">Impulsione seu Progresso</h2>
          <p className="font-sans text-sm text-[#c4c9ac] opacity-80">Essenciais para alta performance.</p>
        </div>
      </section>

      {/* Categorias (Horizontal Scroll) */}
      <section className="w-full overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
        <div className="flex space-x-3 w-max">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-sans text-[10px] px-4 py-2 rounded-full uppercase tracking-wider font-bold transition-colors ${
                activeCategory === cat 
                ? 'bg-primary text-[#161e00] neon-glow' 
                : 'glass-panel text-white hover:border-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid (Bento Style) */}
      <section className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product, index) => {
          // O primeiro produto que renderiza se tiver imagem recebe destaque (col-span-2)
          const isFeatured = index === 0;
          
          return (
            <article 
              key={product.id} 
              className={`${isFeatured ? 'col-span-2' : 'col-span-1'} glass-panel rounded-xl overflow-hidden relative group active:scale-[0.98] transition-transform duration-200 flex flex-col`}
            >
              <div className="absolute top-2 right-2 z-10 bg-[#101417]/80 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center space-x-1 border border-white/5">
                <span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                <span className="font-mono text-white text-xs">5.0</span>
              </div>
              <div className={`${isFeatured ? 'h-[180px]' : 'h-[140px]'} w-full bg-[#1c2024] relative`}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#c4c9ac]">
                    <span className="material-symbols-outlined text-4xl opacity-30">shopping_bag</span>
                  </div>
                )}
                {isFeatured && <div className="absolute inset-0 bg-gradient-to-t from-[#272a2e] to-transparent opacity-80"></div>}
              </div>

              <div className="p-3 flex flex-col flex-grow justify-between bg-[#323539]/50">
                <div className="mb-2">
                  <h3 className={`font-sans font-bold text-white leading-tight ${isFeatured ? 'text-xl' : 'text-sm'}`}>{product.name}</h3>
                  <p className={`font-sans text-[#c4c9ac] opacity-70 mt-1 line-clamp-1 ${isFeatured ? 'text-sm' : 'text-[10px] uppercase tracking-widest'}`}>
                    {product.description || product.category}
                  </p>
                </div>
                
                {isFeatured ? (
                  <div className="flex justify-between items-center pt-2">
                    <div className="font-mono text-primary text-lg">R$ {parseFloat(product.price).toFixed(2)}</div>
                    <a 
                      href={product.affiliate_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-[#161e00] font-sans text-[10px] px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-[#abd600] transition-colors shadow-[0_0_10px_rgba(195,244,0,0.2)]"
                    >
                      Comprar
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 mt-auto">
                    <div className="font-mono text-primary">R$ {parseFloat(product.price).toFixed(2)}</div>
                    <a 
                      href={product.affiliate_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-transparent border text-center border-primary text-primary font-sans text-[10px] py-1.5 rounded uppercase hover:bg-primary/10 transition-colors font-bold tracking-widest"
                    >
                      Ver
                    </a>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </section>
      
      {filteredProducts.length === 0 && (
         <div className="glass-panel p-10 rounded-xl text-center col-span-2">
            <span className="material-symbols-outlined text-[#c4c9ac] text-4xl mb-2">production_quantity_limits</span>
            <p className="text-sm text-[#c4c9ac] font-sans">Nenhum produto encontrado nesta categoria.</p>
         </div>
      )}
    </div>
  )
}

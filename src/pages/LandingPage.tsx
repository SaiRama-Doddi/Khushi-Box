import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { PRODUCTS, CATEGORIES } from '../constants';

const LandingPage: React.FC = () => {
  // Select featured products
  const bestSellers = PRODUCTS.slice(0, 4);
  const newArrivals = PRODUCTS.slice(4, 12);
  const magnetsHighlight = PRODUCTS.filter(p => p.category === 'magnets').slice(0, 4);

  return (
    <div className="flex flex-col bg-background-cream overflow-hidden">
      
      {/* 1. Premium Hero Unit */}
      <section className="relative h-[calc(100vh-140px)] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover brightness-95" 
            src="/images/hero.png" 
            alt="Premium Gift"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
        </div>

        <div className="content-container relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <p className="text-white text-[11px] font-bold uppercase tracking-[0.4em] mb-4 animate-in slide-in-from-bottom duration-1000">
              The Bespoke Collection
            </p>
            <h1 className="text-5xl md:text-[6rem] font-medium leading-[0.85] text-white mb-6">
              The Art of<br/>
              <span className="italic font-light">Gifting</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg font-light mb-8 max-w-lg leading-relaxed">
              Curating unforgettable moments with our hand-selected collection of personalised treasures and essentials.
            </p>
            <div className="flex gap-6">
              <Link to="/products" className="premium-btn bg-white text-text-dark border border-white hover:bg-transparent hover:text-white transition-all duration-500">
                Explore Shop
              </Link>
              <Link to="/about" className="premium-btn border border-white text-white hover:bg-white hover:text-text-dark transition-all duration-500">
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
           <span className="text-white/50 text-[9px] uppercase tracking-[0.3em] font-bold">Scroll</span>
           <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
        </div>
      </section>

      {/* 2. Tier 1: Curated Best Sellers */}
      <section className="section-padding bg-background-cream">
        <div className="content-container">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Most Coveted</p>
              <h2 className="text-4xl md:text-5xl font-medium">Bestsellers of the Season</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-text-dark border-b border-text-dark pb-1">
              Shop All Selection
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Editorial Section: Lifestyle Banner */}
      <section className="relative h-[600px] flex items-center overflow-hidden bg-background-tan">
        <div className="absolute inset-0 flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-full order-2 md:order-1 flex items-center justify-center bg-background-cream p-12 md:p-24">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="max-w-md text-center md:text-left"
            >
              <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-6">Unforgettable</p>
              <h2 className="text-4xl md:text-5xl font-medium mb-8 leading-tight">Anniversary<br/><span className="italic font-light">Masterpieces</span></h2>
              <p className="text-text-muted font-light leading-relaxed mb-10">
                Celebrate the beauty of time and shared memories with our curated sets designed to capture the essence of your journey together.
              </p>
              <Link to="/products?category=personalised-gifts" className="premium-btn premium-btn-outline inline-block">
                Shop Collections
              </Link>
            </motion.div>
          </div>
          <div className="w-full md:w-1/2 h-full order-1 md:order-2">
            <img 
              src="/images/anniversary.png" 
              className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
              alt="Anniversary Gift"
            />
          </div>
        </div>
      </section>

      {/* 4. Category Grid: Modern Circles/Squares */}
      <section className="section-padding bg-background-cream">
        <div className="content-container">
          <div className="text-center mb-20">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Explore our universe</p>
            <h2 className="text-4xl md:text-5xl font-medium">Collections of Choice</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {CATEGORIES.map((cat, idx) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
              >
                <Link to={`/products?category=${cat.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-background-tan">
                  <img 
                    src={cat.image || "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2115&auto=format&fit=crop"} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.85] group-hover:brightness-100"
                    alt={cat.name}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                  <div className="absolute inset-x-8 bottom-8 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{cat.children?.length} Subsets</p>
                    <h3 className="text-3xl font-medium mb-4">{cat.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      Explore Shop <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Dark Accent Section: Iconic Piece Highlight */}
      <section className="bg-background-tan py-24 md:py-40 text-text-dark relative overflow-hidden border-y border-primary/10">
        {/* Subtle noise pattern or gradient */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="content-container relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
                className="relative aspect-square md:aspect-[4/5] bg-background-cream border border-primary/10 group overflow-hidden"
              >
                <img 
                  src="/images/iconic.png" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000"
                  alt="Iconic Piece"
                />
                <div className="absolute inset-0 border-[30px] border-background-tan/50 pointer-events-none"></div>
              </motion.div>
            </div>
            
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.4em] mb-6">Iconic Design</p>
              <h2 className="text-5xl md:text-7xl font-medium mb-8 leading-tight">The Funky<br/><span className="italic font-light">Expression</span></h2>
              <p className="text-text-muted font-light text-lg mb-12 leading-relaxed">
                Discover our signature collection of funky magnets that turn everyday spaces into canvases of personality. Each piece is a statement of wit and style.
              </p>
              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-px bg-primary"></div>
                   <p className="text-[11px] font-bold uppercase tracking-widest text-text-dark/70">Meticulously Crafted</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-px bg-primary/30"></div>
                   <p className="text-[11px] font-bold uppercase tracking-widest text-text-dark/70">Durable High-Definition Print</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-px bg-primary/30"></div>
                   <p className="text-[11px] font-bold uppercase tracking-widest text-text-dark/70">Unique Sarcastic Wit</p>
                </div>
              </div>
              <Link to="/products?category=magnets" className="premium-btn bg-background-cream text-text-dark border border-background-cream hover:bg-transparent hover:text-white transition-all duration-500">
                Shop Magnet Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Tier 2: New Arrivals Lifestyle Grid */}
      <section className="section-padding bg-background-cream">
        <div className="content-container">
          <div className="text-center mb-20">
             <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Just Arrived</p>
             <h2 className="text-4xl md:text-5xl font-medium mb-6">Gifts for Everyone</h2>
             <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-20 text-center">
             <Link to="/products" className="premium-btn premium-btn-outline inline-block">
               View All Arrivals
             </Link>
          </div>
        </div>
      </section>

      {/* 7. Fine Features Section */}
      <section className="py-20 bg-background-cream border-t border-background-tan">
        <div className="content-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:divide-x divide-background-tan">
              <div className="text-center px-4">
                 <p className="text-2xl font-serif italic text-secondary mb-6">✧</p>
                 <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Elegant Presentation</h4>
                 <p className="text-[13px] font-light text-text-muted leading-relaxed">Every gift is arrived in our signature luxury packaging, ready to enchant.</p>
              </div>
              <div className="text-center px-4">
                 <p className="text-2xl font-serif italic text-secondary mb-6">✧</p>
                 <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Curated Quality</h4>
                 <p className="text-[13px] font-light text-text-muted leading-relaxed">We source only the finest materials to ensure each piece lasts a lifetime.</p>
              </div>
              <div className="text-center px-4">
                 <p className="text-2xl font-serif italic text-secondary mb-6">✧</p>
                 <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Concierge Service</h4>
                 <p className="text-[13px] font-light text-text-muted leading-relaxed">Our styling experts are here to help you select the perfect gift for every occasion.</p>
              </div>
           </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

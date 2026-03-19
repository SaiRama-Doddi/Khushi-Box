import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Hammer, Zap, Award, Loader2, Star, Quote } from 'lucide-react';
import { REVIEWS } from '../constants';

const LandingPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catSnap = await getDocs(query(collection(db, 'categories'), limit(6)));
        const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8)));
        
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        console.error("Error fetching landing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background-light">
      
      {/* Premium Hero Section */}
      <section className="relative h-[550px] md:h-[650px] flex items-center overflow-hidden bg-[#F9F6F0]">
        <div className="absolute inset-0 flex">
          {/* Left side text background */}
          <div className="w-1/2 h-full bg-gradient-to-r from-[#e8dcc4] to-[#f4ecd8] hidden md:block"></div>
          {/* Right side image */}
          <div className="w-full md:w-1/2 h-full relative">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzAHSBM2tvUomz9i0jzOGT27wln5lqKnxE43STSwKgGbVqsZB-9iWB4iT_ni2Ek09C64fFWUgtwEuhkiYsqCs3PVnCvPrlu-vO679M26lWWteAE3c9YnefNMSPIKQcoktJAdLAv5i3IurPpnIHMoM08x_x-vFIKJgH8_mpjkdTLX2g-GOt4wKazErBgn3PLpkbzT8b3TPcsqx0RzfaRLtRmR6ok72YLPtDBfttHnG9FVi0R2tAAy_pfIYs60wmbxHd3ZzdiUrFK4I" 
              alt="Hero Background"
              referrerPolicy="no-referrer"
            />
            {/* Mobile gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent block md:hidden"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl md:w-1/2 md:pr-12"
          >
            <p className="inline-block text-primary-dark text-[11px] font-bold uppercase tracking-[0.3em] mb-4 md:text-primary-dark text-white/90">
              The Art of Gifting
            </p>
            <h2 className="text-5xl md:text-[5rem] font-medium leading-[1.1] mb-6 text-white md:text-slate-900 tracking-tight">
              The magic of <br/><span className="italic font-light">Elegance</span>
            </h2>
            <p className="text-white/90 md:text-slate-600 text-[15px] md:text-base mb-10 max-w-md leading-relaxed font-light">
              Discover our premium collection of bespoke gifts crafted with love, precision, and an unforgettable touch of luxury.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link to="/products" className="px-10 py-4 bg-slate-900 hover:bg-black text-white text-[11px] uppercase tracking-widest font-bold transition-all duration-300">
                Explore Collection
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid (Shop by Occasion) */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h3 className="text-3xl md:text-4xl font-medium mb-4 text-slate-900">Curated Categories</h3>
            <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 lg:gap-12">
            {categories.map((cat, idx) => (
              <motion.div 
                key={cat.id}
                className="w-[42vw] sm:w-40 md:w-48 lg:w-52 xl:w-56"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Link to={`/products?category=${cat.slug}`} className="group flex flex-col items-center gap-4">
                  <div className="w-full aspect-[4/5] overflow-hidden bg-slate-100">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      src={cat.image} 
                      alt={cat.name} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className="text-[13px] font-bold uppercase tracking-widest text-slate-900 group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-12 md:py-24 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-8 md:mb-16 gap-4 md:gap-6 border-b border-slate-200 pb-4 md:pb-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-medium text-slate-900 mb-2">Trending Now</h3>
              <p className="text-slate-500 text-sm font-light">The most coveted pieces of the season</p>
            </div>
            <Link to="/products" className="text-[11px] font-bold uppercase tracking-widest text-slate-900 hover:text-primary transition-colors flex items-center gap-2 group">
              View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.length > 0 ? (
              products.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white border border-slate-100">
                <p className="text-slate-400 font-medium italic">New treasures arriving soon...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Signature Collection Display */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h3 className="text-3xl md:text-4xl font-medium mb-4 text-slate-900">Our Signature Collection</h3>
            <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Hardcoded illustrative signature collection boxes */}
            <div className="group relative aspect-[3/4] overflow-hidden bg-slate-100 flex items-center justify-center">
               <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" alt="Home Decor" />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
               <div className="relative z-10 text-center text-white border border-white/50 p-8 m-6 backdrop-blur-sm bg-black/10">
                 <h4 className="font-display text-2xl mb-2">Home Decor</h4>
                 <p className="text-[10px] uppercase tracking-[0.2em] mb-4">Timeless Elegance</p>
                 <Link to="/products" className="text-[11px] uppercase tracking-widest border-b border-white pb-1 hover:text-primary hover:border-primary transition-colors">Shop Now</Link>
               </div>
            </div>
            <div className="group relative aspect-[3/4] overflow-hidden bg-slate-100 flex items-center justify-center">
               <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" alt="Gifting" />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
               <div className="relative z-10 text-center text-white border border-white/50 p-8 m-6 backdrop-blur-sm bg-black/10">
                 <h4 className="font-display text-2xl mb-2">Corporate Gifting</h4>
                 <p className="text-[10px] uppercase tracking-[0.2em] mb-4">Impress with the best</p>
                 <Link to="/products" className="text-[11px] uppercase tracking-widest border-b border-white pb-1 hover:text-primary hover:border-primary transition-colors">Shop Now</Link>
               </div>
            </div>
            <div className="group relative aspect-[3/4] overflow-hidden bg-slate-100 flex items-center justify-center">
               <img src="https://images.unsplash.com/photo-1577083046162-8e7ac61eb3aa?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" alt="Festive" />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
               <div className="relative z-10 text-center text-white border border-white/50 p-8 m-6 backdrop-blur-sm bg-black/10">
                 <h4 className="font-display text-2xl mb-2">Festive Specials</h4>
                 <p className="text-[10px] uppercase tracking-[0.2em] mb-4">Celebrate with Joy</p>
                 <Link to="/products" className="text-[11px] uppercase tracking-widest border-b border-white pb-1 hover:text-primary hover:border-primary transition-colors">Shop Now</Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals (Rest of products) */}
      {products.length > 4 && (
        <section className="py-12 md:py-24 bg-background-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-16">
              <h3 className="text-3xl md:text-4xl font-medium mb-4 text-slate-900">New Arrivals</h3>
              <div className="h-0.5 w-16 bg-primary mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {products.slice(4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 md:mt-16 text-center">
               <Link to="/products" className="inline-block px-10 py-4 border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-all duration-300">
                 View All Products
               </Link>
            </div>
          </div>
        </section>
      )}

      {/* Elegant Promo Banner */}
      <section className="bg-slate-900 text-white py-16 md:py-24 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <p className="text-primary text-[11px] uppercase tracking-[0.2em] font-bold mb-4">Exclusive Member Perks</p>
            <h2 className="text-4xl md:text-5xl font-medium mb-6 font-display">Join the Khushi Club</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-8 max-w-md">
              Unlock early access to our limited-edition releases, receive a complimentary gift on your birthday, and enjoy effortless concierge service tailored to your styling and gifting needs.
            </p>
            <button className="px-10 py-4 bg-primary text-white text-[11px] uppercase tracking-widest font-bold hover:bg-primary-dark transition-colors border border-transparent hover:border-primary-dark">
              Register Now
            </button>
          </div>
          <div className="w-full md:w-1/2 aspect-video bg-white/5 relative overflow-hidden">
             <img src="https://images.unsplash.com/photo-1579548480749-9fd90c885e3b?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" alt="Club" />
             <div className="absolute inset-0 border border-white/20 m-6 flex items-center justify-center">
               <span className="text-white text-3xl font-display italic">Khushi<br/>Experiences</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-4">
              <span className="block text-primary text-xl mb-4">✧</span>
              <h5 className="text-[12px] uppercase tracking-widest font-bold text-slate-900 mb-2">Bespoke Design</h5>
              <p className="text-[13px] text-slate-500 font-light">Meticulously crafted with rare materials.</p>
            </div>
            <div className="p-4 pt-8 md:pt-4">
              <span className="block text-primary text-xl mb-4">✧</span>
              <h5 className="text-[12px] uppercase tracking-widest font-bold text-slate-900 mb-2">Complimentary Shipping</h5>
              <p className="text-[13px] text-slate-500 font-light">On all orders spanning over ₹1999.</p>
            </div>
            <div className="p-4 pt-8 md:pt-4">
              <span className="block text-primary text-xl mb-4">✧</span>
              <h5 className="text-[12px] uppercase tracking-widest font-bold text-slate-900 mb-2">The Perfect Gift</h5>
              <p className="text-[13px] text-slate-500 font-light">Signature packaging included.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

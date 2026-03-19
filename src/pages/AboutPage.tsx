import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#fdfcf8] min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#1a2f2a]">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop" 
            alt="Craftsmanship" 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop';
            }}
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] uppercase tracking-[0.5em] text-white/60 mb-6 block"
          >
            Our Story
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display italic text-white leading-tight"
          >
            The Art of <br /> Curated Gifting
          </motion.h1>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-px h-20 bg-white/20"></div>
      </section>

      {/* Ethos Section */}
      <section className="py-32 px-4 max-w-5xl mx-auto text-center">
        <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 mb-12 block">Our Ethos</span>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display leading-tight text-slate-900 mb-12">
          We believe that a gift should be as <span className="text-[#a63d33] italic">unique</span> as the relationship it celebrates. Every 'Hisaab' piece is expertly crafted to balance refined luxury with a <span className="text-[#a63d33] italic">playful spirit</span>.
        </h2>
        <div className="w-12 h-px bg-slate-200 mx-auto mb-12"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Designed in Mumbai — Cherished Everywhere</p>
      </section>

      {/* Responsive Image Gallery Section */}
      <section className="px-4 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1495121605193-b116b5b09a36?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1598300052746-6640589658dd?q=80&w=1000&auto=format&fit=crop'
          ].map((src, idx) => (
            <div key={idx} className="h-60 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg">
              <img
                src={src}
                alt={`Studio view ${idx + 1}`}
                className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="h-[60vh] lg:h-auto overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1506806732259-39c2d4468673?q=80&w=2070&auto=format&fit=crop" 
            alt="Studio" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="bg-[#1a2f2a] text-white p-12 md:p-24 flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 mb-8 block">The Studio</span>
          <h3 className="text-3xl md:text-4xl font-display italic mb-8">Where Wit Meets Elegance</h3>
          <p className="text-lg text-white/70 font-light leading-relaxed mb-12 max-w-md">
            Born in the vibrant heart of Mumbai, Hisaab Studio was founded on the idea that gifting shouldn't just be a transaction, but a conversation. We blend traditional craftsmanship with contemporary humor to create pieces that resonate.
          </p>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#1a2f2a] transition-all">
                <ChevronRight size={16} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Explore Collections</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="text-center">
            <span className="text-4xl font-display italic text-primary mb-6 block">01</span>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Quality First</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-light">We source only the finest materials, from premium ceramics to high-grade magnets, ensuring every piece lasts a lifetime.</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-display italic text-primary mb-6 block">02</span>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Witty Design</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-light">Our design philosophy is simple: make them smile. We infuse every product with a touch of clever, relatable humor.</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-display italic text-primary mb-6 block">03</span>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Personal Touch</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-light">Gifts are personal. We offer bespoke services to ensure your gift perfectly captures the sentiment you intend.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

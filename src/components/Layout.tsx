import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, X, ChevronDown, Home, LayoutGrid, Heart, BookOpen, Phone, Instagram, Twitter, Facebook } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CATEGORIES } from '../constants';

export const Header: React.FC = () => {
  const { totalItems } = useCart();
  const { wishlistItems } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We use CATEGORIES from constants now as per user request
    // But keeping search logic for live products if they exist
    const fetchAllProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), limit(100)));
        if (!snap.empty) {
          setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        }
      } catch (err) {
        console.error("Error fetching products for search:", err);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6);
      setRecommendations(filtered);
      setShowRecommendations(true);
    } else {
      setRecommendations([]);
      setShowRecommendations(false);
    }
  }, [searchQuery, allProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowRecommendations(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowRecommendations(false);
    }
  };

  const handleRecommendationClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setShowRecommendations(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background-cream/80 backdrop-blur-md border-b border-background-tan transition-all duration-300">
      {/* Elegant Anniversary/Announcement Bar */}
      <div className="bg-primary text-background-cream py-2 px-4 text-center">
        <p className="text-[7.5px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.3em] uppercase whitespace-nowrap">
          Complimentary shipping on all orders over ₹1999
        </p>
      </div>

      <div className="content-container py-1 md:py-2">
        <div className="flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <img
                src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
                alt="KhushiBox"
                className="h-12 md:h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <span className="ml-2 font-display italic text-xl md:text-3xl font-medium tracking-tight text-primary">
                KhushiBox
              </span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
              <Link to="/products" className="text-[11px] font-bold uppercase tracking-widest text-black hover:text-primary transition-colors">Shop All</Link>
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="relative group/menu" onMouseEnter={() => setActiveDropdown(cat.id)} onMouseLeave={() => setActiveDropdown(null)}>
                  <Link 
                    to={`/products?category=${cat.slug}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-black hover:text-primary transition-colors py-4"
                  >
                    {cat.name}
                    {cat.children && <ChevronDown size={12} className="group-hover/menu:rotate-180 transition-transform duration-300" />}
                  </Link>

                {cat.children && cat.children.length > 0 && activeDropdown === cat.id && (
                  <div className="absolute top-full left-0 w-64 bg-background-cream shadow-2xl border border-background-tan p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 gap-2">
                      {cat.children.map(child => (
                        <Link 
                          key={child.id}
                          to={`/products?category=${cat.slug}&subcategory=${child.slug}`}
                          className="text-[12px] font-medium text-black hover:text-primary py-2 px-3 hover:bg-background-tan transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              ))}
              <Link to="/about" className="text-[11px] font-bold uppercase tracking-widest text-black hover:text-primary transition-colors">Our Story</Link>
              <Link to="/contact" className="text-[11px] font-bold uppercase tracking-widest text-black hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            <div ref={searchRef} className="relative hidden md:block">
               <button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="text-text-muted hover:text-primary transition-colors"
               >
                 <Search size={18} strokeWidth={1.5} />
               </button>
               
               {showRecommendations && (
                 <div className="absolute top-full right-0 w-[400px] bg-background-cream shadow-2xl border border-background-tan p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <form onSubmit={handleSearch} className="flex border-b border-background-tan pb-2 mb-4">
                      <input 
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What are you looking for?"
                        className="w-full bg-transparent border-none text-[14px] focus:ring-0 outline-none placeholder-black/50 font-medium text-black"
                      />
                      <Search size={18} className="text-black" strokeWidth={1.5} />
                    </form>
                    
                    {recommendations.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Suggestions</p>
                        {recommendations.map(prod => (
                          <div 
                            key={prod.id} 
                            onClick={() => handleRecommendationClick(prod.id)}
                            className="flex items-center gap-4 cursor-pointer group/item"
                          >
                            <div className="w-12 h-12 bg-background-tan overflow-hidden">
                              <img src={prod.image} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-black group-hover/item:text-primary transition-colors">{prod.name}</p>
                              <p className="text-[10px] text-black/60 uppercase tracking-widest">{prod.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               )}
            </div>

            <Link to="/wishlist" className="relative group text-black hover:text-primary transition-colors">
              <Heart size={18} strokeWidth={1.5} className={wishlistItems.length > 0 ? 'fill-primary text-primary' : ''} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link to="/checkout" className="relative group text-black hover:text-primary transition-colors">
              <ShoppingBag size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-background-tan text-text-dark section-padding border-t border-primary/10">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-text-dark/10 pb-12 md:pb-20">
          
          {/* Brand Column */}
          <div className="md:col-span-1">
             <Link to="/" className="flex items-center mb-8 group">
               <img
                  src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
                  alt="KhushiBox"
                  className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <span className="ml-2 font-display italic text-2xl md:text-3xl font-medium tracking-tight text-primary">
                  KhushiBox
                </span>
             </Link>
              <p className="text-[14px] font-light leading-relaxed text-black mb-8 max-w-xs">
                Crafting moments of pure joy with our bespoke collection of personalised gifts and premium essentials.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-primary hover:text-white transition-all duration-300">
                  <Instagram size={16} />
                </a>
                <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-primary hover:text-white transition-all duration-300">
                  <Twitter size={16} />
                </a>
                <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-primary hover:text-white transition-all duration-300">
                  <Facebook size={16} />
                </a>
              </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-8 text-primary">Collections</h5>
            <ul className="space-y-4">
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.slug}`} className="text-[13px] font-light text-black hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-8 text-primary">Assistance</h5>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[13px] font-light text-black hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="text-[13px] font-light text-black hover:text-primary transition-colors">Contact Us</Link></li>
              <li><a href="#" className="text-[13px] font-light text-black hover:text-primary transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-[13px] font-light text-black hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-8 text-primary">Newsletter</h5>
            <p className="text-[13px] font-light text-black mb-6">Join the Khushi Club for early access and seasonal updates.</p>
            <form className="flex border-b border-black/20 pb-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-transparent border-none text-[13px] focus:ring-0 outline-none placeholder-black/50 text-black"
              />
              <button className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-primary transition-colors">Join</button>
            </form>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-black">
            © {new Date().getFullYear()} KhushiBox. All rights reserved.
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-black">
            Designed with <span className="text-secondary mx-1">✧</span> in mind
          </p>
        </div>
      </div>
    </footer>
  );
};

export const MobileNav: React.FC = () => {
  const { totalItems } = useCart();
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-cream/90 backdrop-blur-md border-t border-background-tan z-50 py-3 pb-safe px-6">
      <div className="flex items-center justify-between">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-text-muted'}`}>
          <Home size={20} strokeWidth={location.pathname === '/' ? 2.5 : 1.5} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Home</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center gap-1 ${location.pathname === '/products' ? 'text-primary' : 'text-text-muted'}`}>
          <LayoutGrid size={20} strokeWidth={location.pathname === '/products' ? 2.5 : 1.5} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Shop</span>
        </Link>
        <Link to="/checkout" className={`relative flex flex-col items-center gap-1 ${location.pathname === '/checkout' ? 'text-primary' : 'text-text-muted'}`}>
          <ShoppingBag size={20} strokeWidth={location.pathname === '/checkout' ? 2.5 : 1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Bag</span>
        </Link>
        <Link to="/about" className={`flex flex-col items-center gap-1 ${location.pathname === '/about' ? 'text-primary' : 'text-text-muted'}`}>
          <BookOpen size={20} strokeWidth={location.pathname === '/about' ? 2.5 : 1.5} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Story</span>
        </Link>
        <Link to="/contact" className={`flex flex-col items-center gap-1 ${location.pathname === '/contact' ? 'text-primary' : 'text-text-muted'}`}>
          <Phone size={20} strokeWidth={location.pathname === '/contact' ? 2.5 : 1.5} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Call</span>
        </Link>
      </div>
    </div>
  );
};

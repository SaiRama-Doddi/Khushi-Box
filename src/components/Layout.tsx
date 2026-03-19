import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Sparkles, X, Loader2, ChevronDown, Home, LayoutGrid, Heart, BookOpen, Phone } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const Header: React.FC = () => {
  const { totalItems } = useCart();
  const { wishlistItems } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), limit(100)));
        setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-primary text-white py-2 px-4 text-center text-xs font-bold tracking-[0.2em] uppercase">
        FREE SHIPPING ON ORDERS OVER ₹1999
      </div>

      {/* Main Navigation */}
      <div className="mx-auto max-w-7xl px-4 py-3 md:py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between relative w-full">

          {/* Left: Logo */}
          <div className="flex items-center shrink-0 z-10">
            <Link to="/" className="flex items-center group transition-opacity hover:opacity-80">
              <img
                src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
                alt="Khushi"
                className="h-12 sm:h-14 md:h-20 lg:h-24 w-auto object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>

          {/* Middle: Mobile Text Name */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:hidden flex items-center justify-center pointer-events-none z-0">
            <span className="font-display italic text-[22px] sm:text-2xl font-bold tracking-widest text-[#931c19] pt-1">
              Khushi Box
            </span>
          </div>

          {/* Center: Links */}
          <nav className="hidden lg:flex items-center justify-center gap-4 lg:gap-6 xl:gap-8 flex-1 whitespace-nowrap ml-4 xl:ml-8">
            <Link
              to="/products"
              className={`text-[11px] xl:text-[12px] font-bold tracking-widest uppercase transition-colors py-4 border-b-2 ${location.pathname === '/products' && !location.search.includes('category=') ? 'text-primary border-primary' : 'text-slate-800 border-transparent hover:text-primary'}`}
            >
              Shop
            </Link>
            {categories.map(cat => {
              const isActive = location.pathname === '/products' && location.search.includes(`category=${cat.slug}`);
              return (
                <div
                  key={cat.id}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(cat.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className={`flex items-center gap-1 text-[11px] xl:text-[12px] font-bold tracking-widest uppercase transition-colors py-4 border-b-2 ${isActive ? 'text-primary border-primary' : 'text-slate-800 border-transparent hover:text-primary'}`}
                  >
                    {cat.name}
                    {cat.children?.length > 0 && <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === cat.id ? 'rotate-180' : 'opacity-50'}`} />}
                  </Link>

                  {cat.children?.length > 0 && activeDropdown === cat.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-white shadow-2xl border border-slate-100 rounded-xl overflow-hidden z-50">
                      <div className="py-2">
                        {cat.children.map((sub: any) => {
                          const isSubActive = location.pathname === '/products' && location.search.includes(`subcategory=${sub.slug}`);
                          return (
                            <Link
                              key={sub.id}
                              to={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                              className={`block px-6 py-3 text-[13px] font-bold tracking-wide transition-colors ${isSubActive ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`}
                            >
                              {sub.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <Link
              to="/about"
              className={`text-[11px] xl:text-[12px] font-bold tracking-widest uppercase transition-colors py-4 border-b-2 ${location.pathname === '/about' ? 'text-primary border-primary' : 'text-slate-800 border-transparent hover:text-primary'}`}
            >
              Our Story
            </Link>
            <Link
              to="/contact"
              className={`text-[11px] xl:text-[12px] font-bold tracking-widest uppercase transition-colors py-4 border-b-2 ${location.pathname === '/contact' ? 'text-primary border-primary' : 'text-slate-800 border-transparent hover:text-primary'}`}
            >
              Contact
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex justify-end gap-5 items-center shrink-0">
            <div ref={searchRef} className="relative hidden lg:block mr-2">
              <form
                onSubmit={handleSearch}
                className="flex items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-200 transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-md w-48 xl:w-64 overflow-hidden relative"
              >
                <button type="submit" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center shrink-0">
                  <Search size={16} strokeWidth={2} />
                </button>
                <input
                  id="search-input"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 1 && setShowRecommendations(true)}
                  className="w-full bg-transparent border-none text-[12px] font-semibold tracking-wide text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 px-3"
                  placeholder="Search products..."
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setShowRecommendations(false); document.getElementById('search-input')?.focus(); }}
                    className="text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}
              </form>

              {/* Recommendations Dropdown */}
              {showRecommendations && recommendations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Suggestions</p>
                    {recommendations.map(prod => (
                      <button
                        type="button"
                        key={prod.id}
                        onClick={() => handleRecommendationClick(prod.id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                      >
                        <div className="size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <img src={prod.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[13px] font-bold text-slate-900 truncate">{prod.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest truncate">{prod.category}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="w-full mt-2 p-3 text-center text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl transition-colors border-t border-slate-50"
                    >
                      View all results
                    </button>
                  </div>
                </div>
              )}
            </div>



            <Link to="/wishlist" className="hidden lg:flex text-slate-800 hover:text-rose-500 transition-colors relative items-center justify-center z-10 mr-2">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 min-w-4 rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link to="/checkout" className="text-slate-800 hover:text-primary transition-colors relative flex items-center justify-center z-10">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold h-4 w-4 min-w-4 rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="block lg:hidden mt-2 mb-2 pb-2">
          <div className="relative">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-200 transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-md w-full overflow-hidden relative"
            >
              <button type="submit" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center shrink-0">
                <Search size={16} strokeWidth={2} />
              </button>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length > 1 && setShowRecommendations(true)}
                className="w-full bg-transparent border-none text-[12px] font-semibold tracking-wide text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 px-3"
                placeholder="Search products..."
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowRecommendations(false); }}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </form>

            {/* Mobile Recommendations Dropdown */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Suggestions</p>
                  {recommendations.map(prod => (
                    <button
                      type="button"
                      key={`mob-${prod.id}`}
                      onClick={() => handleRecommendationClick(prod.id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <div className="size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        <img src={prod.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[13px] font-bold text-slate-900 truncate">{prod.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest truncate">{prod.category}</span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full mt-2 p-3 text-center text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl transition-colors border-t border-slate-50"
                  >
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-12 md:py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-16">
          <div className="col-span-1 md:col-span-4 lg:col-span-5 pr-0 lg:pr-12">
            <Link to="/" className="inline-block mb-8 transition-opacity hover:opacity-80">
              <img
                src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
                alt="Khushi"
                className="h-12 sm:h-14 md:h-20 lg:h-24 w-auto object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </Link>
            <p className="text-[15px] leading-relaxed mb-6 font-light text-slate-400">
              Transforming moments into memories with thoughtfully curated, elegantly crafted gifts. Experience the magic of giving with Khushi.
            </p>
          </div>
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h6 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-[11px]">Boutique</h6>
            <ul className="space-y-4 text-[13px] text-slate-400">
              <li><Link to="/about" className="hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">All Collections</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Corporate Gifting</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Gift Cards</a></li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h6 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-[11px]">Assist</h6>
            <ul className="space-y-4 text-[13px] text-slate-400">
              <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Shipping & Returns</a></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <h6 className="text-white font-bold mb-6 uppercase tracking-[0.2em] text-[11px]">Join Our List</h6>
            <p className="text-[13px] mb-4 text-slate-400">Privileged access to new collections and exclusive events.</p>
            <div className="flex border-b border-slate-700 pb-2 focus-within:border-primary transition-colors">
              <input
                className="w-full bg-transparent border-none px-0 text-[13px] text-white focus:ring-0 outline-none placeholder-slate-600"
                placeholder="Email Address"
                type="email"
              />
              <button className="text-[11px] uppercase tracking-widest font-bold text-white hover:text-primary transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] uppercase tracking-widest text-slate-500">
          <p>© {new Date().getFullYear()} Khushi. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Pinterest</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const MobileNav: React.FC = () => {
  const { totalItems } = useCart();
  const { wishlistItems } = useWishlist();
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 px-2 sm:px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] pb-safe overflow-x-auto gap-2">
      <Link to="/" className={`flex flex-col items-center gap-1.5 transition-colors min-w-[40px] ${location.pathname === '/' ? 'text-primary' : 'text-slate-400 hover:text-slate-900'}`}>
        <Home size={20} strokeWidth={location.pathname === '/' ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Home</span>
      </Link>
      
      <Link to="/products" className={`flex flex-col items-center gap-1.5 transition-colors min-w-[40px] ${location.pathname === '/products' || location.pathname.startsWith('/product/') ? 'text-primary' : 'text-slate-400 hover:text-slate-900'}`}>
        <LayoutGrid size={20} strokeWidth={location.pathname === '/products' || location.pathname.startsWith('/product/') ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Shop</span>
      </Link>

      <Link to="/about" className={`flex flex-col items-center gap-1.5 transition-colors min-w-[40px] ${location.pathname === '/about' ? 'text-primary' : 'text-slate-400 hover:text-slate-900'}`}>
        <BookOpen size={20} strokeWidth={location.pathname === '/about' ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Story</span>
      </Link>

      <Link to="/wishlist" className={`flex flex-col items-center gap-1.5 transition-colors relative min-w-[40px] ${location.pathname === '/wishlist' ? 'text-rose-500' : 'text-slate-400 hover:text-slate-900'}`}>
        <div className="relative">
          <Heart size={20} className={location.pathname === '/wishlist' ? 'fill-rose-500 text-rose-500' : ''} strokeWidth={location.pathname === '/wishlist' ? 2.5 : 1.5} />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold h-3.5 w-3.5 min-w-[14px] rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
              {wishlistItems.length}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Saved</span>
      </Link>

      <Link to="/checkout" className={`flex flex-col items-center gap-1.5 transition-colors relative min-w-[40px] ${location.pathname === '/checkout' ? 'text-primary' : 'text-slate-400 hover:text-slate-900'}`}>
        <div className="relative">
          <ShoppingBag size={20} strokeWidth={location.pathname === '/checkout' ? 2.5 : 1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold h-3.5 w-3.5 min-w-[14px] rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
              {totalItems}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Bag</span>
      </Link>

      <Link to="/contact" className={`flex flex-col items-center gap-1.5 transition-colors min-w-[40px] ${location.pathname === '/contact' ? 'text-primary' : 'text-slate-400 hover:text-slate-900'}`}>
        <Phone size={20} strokeWidth={location.pathname === '/contact' ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold tracking-widest uppercase truncate max-w-full">Contact</span>
      </Link>
    </div>
  );
};


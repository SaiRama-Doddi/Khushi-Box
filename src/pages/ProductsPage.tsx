import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'all';
  const initialSubcategory = queryParams.get('subcategory') || 'all';
  const initialSearch = queryParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('Latest');

  useEffect(() => {
    const categoryFromUrl = queryParams.get('category') || 'all';
    const subcategoryFromUrl = queryParams.get('subcategory') || 'all';
    const searchFromUrl = queryParams.get('search') || '';
    setSelectedCategory(categoryFromUrl);
    setSelectedSubcategory(subcategoryFromUrl);
    setSearchQuery(searchFromUrl);
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || 
      p.childCategory === selectedSubcategory || 
      p.subcategory === selectedSubcategory;
    
    const currentPrice = p.offerPrice ?? p.price ?? 0;
    const matchesPrice = currentPrice <= priceRange;
    
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.childCategory && p.childCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSubcategory && matchesPrice && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') {
      const priceA = a.offerPrice ?? a.price ?? 0;
      const priceB = b.offerPrice ?? b.price ?? 0;
      return priceA - priceB;
    }
    if (sortBy === 'Price: High to Low') {
      const priceA = a.offerPrice ?? a.price ?? 0;
      const priceB = b.offerPrice ?? b.price ?? 0;
      return priceB - priceA;
    }
    // Default: Latest (by createdAt)
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });

  const activeCategory = categories.find(c => c.slug === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-display text-slate-900 mb-4">
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory.name : 'All Collections'}
          </h1>
          <p className="text-slate-500 font-light max-w-2xl mx-auto">
            Explore our curated selection of premium pieces designed to add elegance and joy to your everyday life.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0 space-y-10">
            <div>
              <div className="flex flex-col gap-8">
                {/* Categories */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-6 border-b border-slate-200 pb-2">Collections</h4>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      className={`text-left text-[13px] py-2 transition-colors ${selectedCategory === 'all' ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      All Collections
                    </button>
                    {categories.map(cat => (
                      <div key={cat.id} className="space-y-1">
                        <button 
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setSelectedSubcategory('all');
                          }}
                          className={`w-full text-left text-[13px] py-1 transition-colors ${selectedCategory === cat.slug ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                          {cat.name}
                        </button>
                        
                        {selectedCategory === cat.slug && cat.children && cat.children.length > 0 && (
                          <div className="pl-4 flex flex-col gap-1 mt-2 mb-2">
                            <button
                              onClick={() => setSelectedSubcategory('all')}
                              className={`text-left text-[12px] py-1 transition-colors ${selectedSubcategory === 'all' ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              All {cat.name}
                            </button>
                            {cat.children.map((sub: any) => (
                              <button
                                key={sub.id}
                                onClick={() => setSelectedSubcategory(sub.slug)}
                                className={`text-left text-[12px] py-1 transition-colors ${selectedSubcategory === sub.slug ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-6 border-b border-slate-200 pb-2">Price Range</h4>
                  <div className="pt-2 px-1">
                    <input 
                      type="range" 
                      min="0" 
                      max="10000" 
                      step="100"
                      value={priceRange}
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest text-slate-500">
                      <span>₹0</span>
                      <span>₹{priceRange}+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-200">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">
                Showing {filteredProducts.length} items
              </p>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">Sort By:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[11px] uppercase tracking-widest font-bold text-slate-900 border-none focus:ring-0 cursor-pointer"
                >
                  <option>Latest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white border border-slate-100">
                <p className="text-slate-400 font-light text-lg">No treasures found matching your criteria.</p>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-6 text-[11px] uppercase tracking-widest font-bold text-primary hover:text-slate-900 transition-colors border-b border-primary hover:border-slate-900 pb-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

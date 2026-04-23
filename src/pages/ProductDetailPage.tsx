import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { REVIEWS, WEARABLE_SIZES } from '../constants';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Process product to include sizes if it's a wearable
  const effectiveProduct = React.useMemo(() => {
    if (!product) return null;
    if (product.category === 'wearables' && (!product.sizes || product.sizes.length === 0)) {
      return { ...product, sizes: WEARABLE_SIZES };
    }
    return product;
  }, [product]);

  const isWishlisted = effectiveProduct ? isInWishlist(effectiveProduct.id) : false;

  const handleWishlistToggle = () => {
    if (!effectiveProduct) return;
    if (isWishlisted) {
      removeFromWishlist(effectiveProduct.id);
    } else {
      addToWishlist(effectiveProduct);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Try Firestore
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setActiveImage(data.image);
        } else {
          // 2. Try Static Products fallback
          const { PRODUCTS } = await import('../constants');
          const staticProd = PRODUCTS.find(p => p.id === id);
          if (staticProd) {
            setProduct(staticProd);
            setActiveImage(staticProd.image);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        // Fallback for offline/error
        const { PRODUCTS } = await import('../constants');
        const staticProd = PRODUCTS.find(p => p.id === id);
        if (staticProd) {
          setProduct(staticProd);
          setActiveImage(staticProd.image);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-cream">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-cream">
        <h2 className="text-2xl font-display mb-4 text-text-dark">Product Not Found</h2>
        <Link to="/products" className="text-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:text-text-dark border-b border-primary pb-1">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="bg-background-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Breadcrumbs */}
        <nav className="mb-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <Link to="/" className="hover:text-text-dark transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-text-dark transition-colors">{effectiveProduct.category || 'Shop'}</Link>
          <ChevronRight size={12} />
          <span className="text-text-dark truncate max-w-[200px]">{effectiveProduct.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[4/5] overflow-hidden bg-background-tan group"
            >
              <img 
                src={activeImage} 
                alt={effectiveProduct.name} 
                className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={handleWishlistToggle}
                className={`absolute top-6 right-6 p-3 transition-colors bg-background-cream/50 backdrop-blur rounded-full z-10 duration-300 ${isWishlisted ? 'text-primary opacity-100' : 'text-text-muted hover:text-primary opacity-100 lg:opacity-0 group-hover:opacity-100'}`}
              >
                <Heart size={20} strokeWidth={isWishlisted ? 2.5 : 1.5} className={isWishlisted ? 'fill-primary' : ''} />
              </button>
            </motion.div>
            
            <div className="grid grid-cols-5 gap-4">
              <button 
                onClick={() => setActiveImage(effectiveProduct.image)}
                className={`aspect-[4/5] overflow-hidden transition-all ${activeImage === effectiveProduct.image ? 'border border-primary' : 'border border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={effectiveProduct.image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </button>
              {effectiveProduct.images?.slice(0, 4).map((img: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[4/5] overflow-hidden transition-all ${activeImage === img ? 'border border-primary' : 'border border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="border-b border-background-tan pb-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <span className={`inline-flex items-center border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${effectiveProduct.inStock !== false ? 'border-background-tan text-text-muted' : 'border-rose-200 text-rose-500'}`}>
                  {effectiveProduct.inStock !== false ? 'Available' : 'Out of Stock'}
                </span>
                {effectiveProduct.subcategory || effectiveProduct.childCategory ? (
                  <span className="inline-flex items-center border border-background-tan px-3 py-1 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {effectiveProduct.subcategory || effectiveProduct.childCategory}
                  </span>
                ) : null}
              </div>

              <h1 className="text-3xl md:text-5xl font-display text-text-dark mb-6 leading-tight tracking-tight">
                {effectiveProduct.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(effectiveProduct.rating || 5) ? "fill-current" : ""} />
                  ))}
                  <span className="ml-2 text-[11px] font-medium text-text-muted">{effectiveProduct.rating || '5.0'} / 5.0</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-medium text-text-dark">₹{effectiveProduct.price || effectiveProduct.offerPrice}</span>
                {(effectiveProduct.originalPrice || effectiveProduct.actualPrice) && (effectiveProduct.originalPrice || effectiveProduct.actualPrice) > (effectiveProduct.price || effectiveProduct.offerPrice) && (
                  <span className="text-sm text-text-muted/50 line-through font-light">₹{effectiveProduct.originalPrice || effectiveProduct.actualPrice}</span>
                )}
              </div>
            </div>

            <p className="text-[15px] leading-relaxed text-text-muted font-light mb-12">
              {effectiveProduct.description}
            </p>

            {effectiveProduct.sizes && effectiveProduct.sizes.length > 0 && (
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dark">Select Variation</h3>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-dark border-b border-transparent hover:border-text-dark pb-0.5 transition-colors">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {effectiveProduct.sizes.map((size: string) => (
                    <button 
                      key={size} 
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 px-6 border flex items-center justify-center font-medium text-[13px] transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-background-tan text-text-muted hover:border-primary hover:text-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="flex items-center border border-background-tan h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-5 h-full text-text-muted hover:text-text-dark transition-colors flex items-center justify-center"
                >
                  <span className="text-lg font-light">-</span>
                </button>
                <input 
                  className="w-12 h-full border-none bg-transparent text-center font-medium text-[13px] text-text-dark focus:ring-0" 
                  type="text" 
                  value={quantity}
                  readOnly
                />
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-5 h-full text-text-muted hover:text-text-dark transition-colors flex items-center justify-center"
                >
                  <span className="text-lg font-light">+</span>
                </button>
              </div>
              
              <button 
                onClick={() => {
                  if (effectiveProduct.sizes && effectiveProduct.sizes.length > 0 && !selectedSize) {
                    showToast('Please select a variation', 'error');
                    return;
                  }
                  addToCart(effectiveProduct, quantity, selectedSize);
                  showToast(`${effectiveProduct.name} added to bag!`);
                }}
                className="flex-1 h-14 bg-primary text-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary-dark transition-colors flex items-center justify-center gap-3"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                Add to Bag
              </button>
            </div>

            {/* Accordions for Features and Details */}
            <div className="border-t border-background-tan divide-y divide-background-tan">
              {effectiveProduct.keyFeatures && effectiveProduct.keyFeatures.length > 0 && (
                <div className="py-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-dark mb-4">The Details</h3>
                  <ul className="space-y-3">
                    {effectiveProduct.keyFeatures.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] text-text-muted font-light">
                        <span className="text-primary mt-1 text-[10px]">✦</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {effectiveProduct.details && (
                <div className="py-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-dark mb-4">Specifications</h3>
                  <div className="text-[13px] text-text-muted font-light whitespace-pre-line">
                    {typeof effectiveProduct.details === 'string' 
                      ? effectiveProduct.details 
                      : Object.entries(effectiveProduct.details).map(([key, value]) => `${key}: ${value}`).join('\n')
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-8 pt-8 border-t border-background-tan text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted/60">
              <div className="flex items-center gap-3">
                <Truck size={14} strokeWidth={1.5} className="text-text-dark" />
                Complimentary Shipping on all orders over ₹1999
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={14} strokeWidth={1.5} className="text-text-dark" />
                Authenticity Guaranteed & Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

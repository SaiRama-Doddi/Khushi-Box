import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.sizes && product.sizes.length > 0) {
      showToast('Please select a variation first');
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart(product);
    showToast(`${product.name} added to bag!`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col bg-transparent"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-50 rounded-sm mb-4">
        <img 
          src={product.image} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isSale && (
            <span className="bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">Sale</span>
          )}
          {product.isNew && (
            <span className="bg-white text-slate-900 text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest border border-slate-200">New</span>
          )}
        </div>
        <button 
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 transition-colors z-10 duration-300 ${isWishlisted ? 'text-rose-500 opacity-100' : 'text-slate-400 hover:text-rose-500 opacity-100 lg:opacity-0 group-hover:opacity-100'}`}
        >
          <Heart size={18} strokeWidth={isWishlisted ? 2.5 : 1.5} className={isWishlisted ? 'fill-rose-500' : ''} />
        </button>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 backdrop-blur-sm text-slate-900 font-bold uppercase tracking-widest text-[10px] py-3 px-8 shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-slate-900 hover:text-white">
            Quick View
          </span>
        </div>
      </Link>
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.category}</p>
        <Link to={`/product/${product.id}`} className="text-slate-900 font-medium text-[14px] leading-snug hover:text-primary transition-colors line-clamp-2 mt-1">
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <Star size={10} className="fill-slate-900 text-slate-900" />
          <span className="text-[11px] text-slate-500">{product.rating || '5.0'} ({product.reviews || '0'})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-slate-900">₹{product.price || product.offerPrice}</span>
            {(product.originalPrice || product.actualPrice) && (product.originalPrice || product.actualPrice) > (product.price || product.offerPrice) && (
              <span className="text-slate-400 text-xs line-through font-light">₹{product.originalPrice || product.actualPrice}</span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            className="p-2 border border-slate-200 rounded-full text-slate-600 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all focus:outline-none"
          >
            <ShoppingBag size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};


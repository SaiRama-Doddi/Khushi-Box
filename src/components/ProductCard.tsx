import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star } from 'lucide-react';
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
      className="group flex flex-col bg-background-cream"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-background-tan mb-6">
        <img 
          src={product.image} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Wishlist Button - Minimal */}
        <button 
          onClick={handleWishlistToggle}
          className={`absolute top-4 right-4 p-2.5 bg-background-cream/80 backdrop-blur-sm rounded-full transition-all duration-300 shadow-sm ${isWishlisted ? 'text-primary scale-110' : 'text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}
        >
          <Heart size={16} strokeWidth={isWishlisted ? 2.5 : 1.5} className={isWishlisted ? 'fill-primary' : ''} />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
           <button 
            onClick={handleAddToCart}
            className="w-full bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold py-4 shadow-xl hover:bg-primary-dark transition-colors"
           >
             Quick Add +
           </button>
        </div>
      </Link>

      <div className="flex flex-col text-center px-2">
        <p className="text-[9px] font-bold text-primary uppercase tracking-[0.3em] mb-2">{product.childCategory || product.category}</p>
        <Link to={`/product/${product.id}`} className="text-text-dark font-display text-[18px] md:text-[20px] font-medium leading-snug hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </Link>
        
        <div className="flex items-center justify-center gap-1 mt-2 mb-3">
           {[...Array(5)].map((_, i) => (
             <Star key={i} size={8} className={`${i < Math.floor(product.rating || 5) ? 'fill-primary text-primary' : 'text-background-tan'}`} />
           ))}
           <span className="text-[10px] text-text-muted ml-1">({product.rating || '5.0'})</span>
        </div>

        <div className="mb-4">
          <span className="text-[15px] font-bold text-text-dark tracking-wider">₹{product.price}</span>
        </div>
      </div>
    </motion.div>
  );
};

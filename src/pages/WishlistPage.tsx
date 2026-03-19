import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { HeartCrack } from 'lucide-react';

const WishlistPage: React.FC = () => {
  const { wishlistItems } = useWishlist();

  return (
    <div className="bg-background-light min-h-screen pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-display mb-8 text-slate-900">Your Wishlist</h1>
        
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl">
            <HeartCrack size={64} className="text-slate-200 mb-6" />
            <h2 className="text-xl font-medium text-slate-900 mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-center">
              Curate your favorite items by clicking the heart icon on products you love.
            </p>
            <Link 
              to="/products"
              className="px-8 py-3 bg-slate-900 text-white text-[11px] font-bold tracking-widest uppercase hover:bg-black transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {wishlistItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;

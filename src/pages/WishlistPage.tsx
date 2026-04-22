import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { HeartCrack } from 'lucide-react';

const WishlistPage: React.FC = () => {
  const { wishlistItems } = useWishlist();

  return (
    <div className="bg-background-cream min-h-screen pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-display mb-8 text-text-dark">Your Wishlist</h1>
        
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-tan/10 border border-background-tan rounded-3xl">
            <HeartCrack size={64} className="text-background-tan mb-6" />
            <h2 className="text-xl font-medium text-text-dark mb-2">Your wishlist is empty</h2>
            <p className="text-text-muted mb-8 max-w-sm text-center">
              Curate your favorite items by clicking the heart icon on products you love.
            </p>
            <Link 
              to="/products"
              className="px-8 py-3 bg-primary text-white text-[11px] font-bold tracking-widest uppercase hover:bg-primary-dark transition-colors"
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

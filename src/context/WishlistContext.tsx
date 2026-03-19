import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('khushi_wishlist');
    if (stored) {
      try {
        setWishlistItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse wishlist from local storage');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('khushi_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = (product: Product) => {
    setWishlistItems(prev => {
      if (!prev.find(p => p.id === product.id)) {
        showToast('Added to wishlist');
        return [...prev, product];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
    showToast('Removed from wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(p => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

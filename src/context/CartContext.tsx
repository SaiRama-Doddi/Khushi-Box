import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  updateSize: (productId: string, oldSize: string | undefined, newSize: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('khushi_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('khushi_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1, size?: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && item.selectedSize === size);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.selectedSize === size ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const updateSize = (productId: string, oldSize: string | undefined, newSize: string) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId && item.selectedSize === oldSize);
      if (!itemToUpdate) return prevCart;

      // Check if an item with the NEW size already exists
      const existingNewSizeItem = prevCart.find(item => item.id === productId && item.selectedSize === newSize);

      if (existingNewSizeItem) {
        // Merge them: remove the old one, and update the quantity of the new one
        return prevCart
          .filter(item => !(item.id === productId && item.selectedSize === oldSize))
          .map(item =>
            item.id === productId && item.selectedSize === newSize
              ? { ...item, quantity: item.quantity + itemToUpdate.quantity }
              : item
          );
      } else {
        // Just update the size
        return prevCart.map(item =>
          item.id === productId && item.selectedSize === oldSize
            ? { ...item, selectedSize: newSize }
            : item
        );
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price || item.offerPrice || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      updateSize,
      clearCart, 
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

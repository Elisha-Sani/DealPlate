'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Deal } from '@/types';

interface CartContextType {
  cartDeal: Deal | null;
  setCartDeal: (deal: Deal | null) => void;
  mpesaPhone: string;
  setMpesaPhone: (phone: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartDeal, setCartDeal] = useState<Deal | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');

  const clearCart = useCallback(() => {
    setCartDeal(null);
  }, []);

  return (
    <CartContext.Provider
      value={{ cartDeal, setCartDeal, mpesaPhone, setMpesaPhone, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

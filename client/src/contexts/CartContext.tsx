import React, { createContext, useContext, useState, useReducer, ReactNode } from 'react';
import { Product, CartItem, Cart } from '../types';

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_CART' };

// Cart reducer
const cartReducer = (state: Cart, action: CartAction): Cart => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      } else {
        // Add new item
        const newItems = [...state.items, { product, quantity }];
        
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems)
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const { productId } = action.payload;
      const updatedItems = state.items.filter(item => item.product.id !== productId);
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // If quantity is 0 or negative, remove the item
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } });
      }
      
      const updatedItems = state.items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0
      };
      
    default:
      return state;
  }
};

// Helper function to calculate total
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
};

// Cart context type
interface CartContextType {
  cart: Cart;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  const addItem = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 
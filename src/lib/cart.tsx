import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { CartItem, Product } from './types';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  cartId: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: string, qty?: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureCart = useCallback(async (userId: string) => {
    const { data: existing } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }, []);

  const refresh = useCallback(async () => {
    if (!user || !cartId) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*, category:categories(*), brand:brands(*), product_images(*))')
      .eq('cart_id', cartId);
    setItems((data as CartItem[]) || []);
    setLoading(false);
  }, [user, cartId]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setCartId(null);
      return;
    }
    (async () => {
      try {
        const id = await ensureCart(user.id);
        setCartId(id);
      } catch (e) {
        console.error('cart ensure error', e);
      }
    })();
  }, [user, ensureCart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: string, qty = 1) => {
    if (!cartId) return;
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: productId, quantity: qty });
    }
    await refresh();
  };

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', itemId);
    await refresh();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    await refresh();
  };

  const clear = async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await refresh();
  };

  const subtotal = items.reduce((s, it) => {
    const price = it.product?.discount_price ?? 0;
    return s + price * it.quantity;
  }, 0);
  const count = items.reduce((s, it) => s + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, loading, cartId, refresh, addItem, updateQty, removeItem, clear, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

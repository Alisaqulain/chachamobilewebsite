"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "chacha-mobile-cart";

/** Stable empty cart — getServerSnapshot / empty reads must reuse this reference. */
const EMPTY_CART = [];

let cachedRaw = null;
let cachedList = EMPTY_CART;

function getSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedRaw) {
    return cachedList;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedList = EMPTY_CART;
    return cachedList;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedList = Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY_CART;
    return cachedList;
  } catch {
    cachedList = EMPTY_CART;
    return cachedList;
  }
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function writeCart(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — cart still updates in memory until refresh if we only dispatched */
  }
  cachedRaw = null;
  window.dispatchEvent(new Event("chacha-cart"));
}

function readCart() {
  return getSnapshot();
}

function subscribe(cb) {
  window.addEventListener("storage", cb);
  window.addEventListener("chacha-cart", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("chacha-cart", cb);
  };
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setItems = useCallback((next) => {
    const list = typeof next === "function" ? next(readCart()) : next;
    writeCart(list);
  }, []);

  const addItem = useCallback(
    (product, qty = 1) => {
      const raw = product?._id ?? product?.id;
      const id = raw != null && raw !== "" ? String(raw) : "";
      if (!id || !product?.name) return;

      setItems((prev) => {
        const idx = prev.findIndex((x) => String(x.productId) === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
          return copy;
        }
        return [
          ...prev,
          {
            productId: id,
            name: product.name,
            price: Number(product.price) || 0,
            qty,
            image: product.images?.[0] || "",
            model: product.model || "",
            quality: product.quality || "",
          },
        ];
      });
    },
    [setItems]
  );

  const updateQty = useCallback(
    (productId, qty) => {
      const key = String(productId);
      setItems((prev) =>
        prev
          .map((x) => (String(x.productId) === key ? { ...x, qty: Math.max(1, qty) } : x))
          .filter((x) => x.qty > 0)
      );
    },
    [setItems]
  );

  const removeItem = useCallback(
    (productId) => {
      const key = String(productId);
      setItems((prev) => prev.filter((x) => String(x.productId) !== key));
    },
    [setItems]
  );

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  const totalQty = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      totalQty,
      subtotal,
    }),
    [items, addItem, updateQty, removeItem, clearCart, totalQty, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

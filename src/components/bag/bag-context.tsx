"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addToCart, type CartLine } from "@/lib/shop/cart";

interface BagApi {
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Adds to the bag and slides the drawer in. Returns false when out of stock. */
  add: (line: Omit<CartLine, "qty">, qty?: number) => boolean;
  /** Line key of the newest addition, so the drawer can animate it in. */
  fresh: string | null;
}

const BagContext = createContext<BagApi | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    const ok = addToCart(line, qty);
    if (ok) {
      setFresh(`${line.slug}|${line.color}|${line.size}|${Date.now()}`);
      setOpen(true);
    }
    return ok;
  }, []);
  const api = useMemo(() => ({ open, setOpen, add, fresh }), [open, add, fresh]);
  return <BagContext.Provider value={api}>{children}</BagContext.Provider>;
}

export function useBag(): BagApi {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside BagProvider");
  return ctx;
}

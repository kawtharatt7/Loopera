"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addToCart, type CartLine } from "@/lib/shop/cart";
import { flyToBag, sourceImage } from "@/lib/shop/fly";

interface BagApi {
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Adds to the bag; the piece flies into the bag icon. Returns false when out of stock. */
  add: (line: Omit<CartLine, "qty">, qty?: number) => boolean;
  /** Line key of the newest addition, so the drawer can animate it in. */
  fresh: string | null;
}

const BagContext = createContext<BagApi | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  // The last thing pressed, so the piece next to it can fly into the bag (Safari does not focus buttons).
  const pressed = useRef<Element | null>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => (pressed.current = e.target as Element);
    document.addEventListener("pointerdown", on, true);
    return () => document.removeEventListener("pointerdown", on, true);
  }, []);
  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    const ok = addToCart(line, qty);
    if (ok) {
      setFresh(`${line.slug}|${line.color}|${line.size}|${Date.now()}`);
      const from = document.activeElement && document.activeElement !== document.body ? document.activeElement : pressed.current;
      flyToBag(sourceImage(from));
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

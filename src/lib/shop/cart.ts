"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { getProduct, stockFor } from "./catalog";

// The bag lives in this browser until accounts arrive; then it moves to the database.
// Prices are always re-read from the catalog, never trusted from storage.

const KEY = "loopera-bag-v2";
const ORDERS_KEY = "loopera-orders-v2";

const LineSchema = z.object({
  slug: z.string().min(1).max(80),
  color: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  qty: z.number().int().min(1).max(20),
});
export type CartLine = z.infer<typeof LineSchema>;

const OrderSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  status: z.enum(["pending", "paid", "in_progress", "shipped", "delivered", "cancelled"]),
  testPayment: z.boolean(),
  cardLast4: z.string().length(4),
  cardBrand: z.string(),
  name: z.string(),
  city: z.string(),
  lines: z.array(LineSchema.extend({ unitPrice: z.number() })),
  total: z.number(),
});
export type Order = z.infer<typeof OrderSchema>;

function read<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the bag still works for this visit.
  }
  emit();
}

const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
let ordersCache: Order[] | null = null;
const EMPTY: CartLine[] = [];
const NO_ORDERS: Order[] = [];

function emit() {
  cache = null;
  ordersCache = null;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === ORDERS_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function getCart(): CartLine[] {
  if (cache === null) cache = read(KEY, z.array(LineSchema), EMPTY);
  return cache;
}
function getOrders(): Order[] {
  if (ordersCache === null) ordersCache = read(ORDERS_KEY, z.array(OrderSchema), NO_ORDERS);
  return ordersCache;
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, getCart, () => EMPTY);
}

export function useOrders(): Order[] {
  return useSyncExternalStore(subscribe, getOrders, () => NO_ORDERS);
}

export function priceOf(line: CartLine): number {
  return getProduct(line.slug)?.sizes.find((s) => s.id === line.size)?.price ?? 0;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + priceOf(l) * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((a, l) => a + l.qty, 0);
}

/** Adds pieces. Returns false when that color and size has no stock left. */
export function addToCart(line: Omit<CartLine, "qty">, qty = 1): boolean {
  const p = getProduct(line.slug);
  if (!p) return false;
  const left = stockFor(p, line.color, line.size);
  const lines = [...getCart()];
  const i = lines.findIndex((l) => l.slug === line.slug && l.color === line.color && l.size === line.size);
  const current = i >= 0 ? lines[i].qty : 0;
  if (current + qty > left) return false;
  if (i >= 0) lines[i] = { ...lines[i], qty: current + qty };
  else lines.push({ ...line, qty });
  write(KEY, lines);
  return true;
}

export function setQty(index: number, qty: number) {
  const lines = [...getCart()];
  const line = lines[index];
  if (!line) return;
  const p = getProduct(line.slug);
  const max = p ? stockFor(p, line.color, line.size) : 0;
  if (qty <= 0) lines.splice(index, 1);
  else lines[index] = { ...line, qty: Math.min(qty, Math.max(1, max)) };
  write(KEY, lines);
}

export function clearCart() {
  write(KEY, []);
}

/** Records a test-mode order. Card details never reach this function, only the last 4 digits and network. */
export function placeTestOrder(input: { name: string; city: string; cardLast4: string; cardBrand: string }): Order | null {
  const lines = getCart();
  if (lines.length === 0) return null;
  const detailed = lines.filter((l) => getProduct(l.slug)).map((l) => ({ ...l, unitPrice: priceOf(l) }));
  const order: Order = {
    id: `LP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "paid",
    testPayment: true,
    cardLast4: input.cardLast4,
    cardBrand: input.cardBrand,
    name: input.name.slice(0, 80),
    city: input.city.slice(0, 80),
    lines: detailed,
    total: detailed.reduce((s, l) => s + l.unitPrice * l.qty, 0),
  };
  write(ORDERS_KEY, [order, ...getOrders()].slice(0, 50));
  clearCart();
  return order;
}

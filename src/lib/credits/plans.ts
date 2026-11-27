// Plans for the Crochet Creator: how many AI designs each plan gets a month, and what it costs.
// Until accounts exist, the chosen plan and the month's count live in this browser.
import { useSyncExternalStore } from "react";
import { DAILY_RESET_TIME_ZONE } from "./constants";

export type PlanId = "free" | "pro" | "max";
export type Cycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  /** AI designs per month. */
  designs: number;
  /** Price in SAR per month, and for a whole year (two months free). */
  monthly: number;
  yearly: number;
}

export const PLANS: Plan[] = [
  { id: "free", designs: 10, monthly: 0, yearly: 0 },
  { id: "pro", designs: 150, monthly: 29, yearly: 290 },
  { id: "max", designs: 600, monthly: 79, yearly: 790 },
];

export const planOf = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0];

const PLAN_KEY = "loopera-plan-v1";
const USE_KEY = "loopera-usage-v1";

/** This month in Riyadh, e.g. "2026-11". The allowance resets when it changes. */
export function riyadhMonth(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_RESET_TIME_ZONE, year: "numeric", month: "2-digit" }).format(now).slice(0, 7);
}

export interface Subscription {
  plan: PlanId;
  cycle: Cycle;
  since: string;
}

const FREE: Subscription = { plan: "free", cycle: "monthly", since: "" };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => (e.key === PLAN_KEY || e.key === USE_KEY) && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

let subCache: { raw: string | null; v: Subscription } = { raw: null, v: FREE };
export function getSubscription(): Subscription {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PLAN_KEY);
  } catch {
    return FREE;
  }
  if (raw === subCache.raw) return subCache.v;
  let v = FREE;
  try {
    const s = JSON.parse(raw ?? "null") as Subscription | null;
    if (s && PLANS.some((p) => p.id === s.plan) && (s.cycle === "monthly" || s.cycle === "yearly")) v = s;
  } catch {
    // keep free
  }
  subCache = { raw, v };
  return v;
}

export function setSubscription(plan: PlanId, cycle: Cycle): void {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify({ plan, cycle, since: new Date().toISOString() }));
  } catch {
    // storage blocked
  }
  emit();
}

function usedThisMonth(now = new Date()): number {
  try {
    const u = JSON.parse(localStorage.getItem(USE_KEY) ?? "null") as { month: string; used: number } | null;
    if (u && u.month === riyadhMonth(now) && Number.isInteger(u.used) && u.used >= 0) return u.used;
  } catch {
    // fresh month
  }
  return 0;
}

export function designsLeft(now = new Date()): number {
  return Math.max(0, planOf(getSubscription().plan).designs - usedThisMonth(now));
}

/** Uses one design. Returns false when the month's designs are used up. */
export function spendDesign(now = new Date()): boolean {
  const used = usedThisMonth(now);
  if (used >= planOf(getSubscription().plan).designs) return false;
  try {
    localStorage.setItem(USE_KEY, JSON.stringify({ month: riyadhMonth(now), used: used + 1 }));
  } catch {
    // storage blocked: allow this one
  }
  emit();
  return true;
}

/** Gives back a design that could not be made (the AI failed). */
export function refundDesign(now = new Date()): void {
  const used = usedThisMonth(now);
  if (used <= 0) return;
  try {
    localStorage.setItem(USE_KEY, JSON.stringify({ month: riyadhMonth(now), used: used - 1 }));
  } catch {
    // storage blocked
  }
  emit();
}

export function useSubscription(): Subscription {
  return useSyncExternalStore(subscribe, getSubscription, () => FREE);
}

/** Designs left this month (null on the server, before the browser count is known). */
export function useDesignsLeft(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => designsLeft(),
    () => null,
  );
}

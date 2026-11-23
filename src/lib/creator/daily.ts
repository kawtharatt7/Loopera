// Free designs per day. Until accounts exist the count lives in this browser; with accounts it
// moves to the database (credit ledger) so it cannot be reset by clearing storage.
import { DAILY_FREE_DESIGNS, DAILY_RESET_TIME_ZONE } from "@/lib/credits/constants";

const KEY = "loopera-daily-v1";

/** Today's date in Riyadh, e.g. "2026-11-23". The allowance resets when this changes. */
export function riyadhDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_RESET_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

interface Daily {
  day: string;
  used: number;
}

function read(now: Date): Daily {
  const day = riyadhDay(now);
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Daily | null;
    if (v && v.day === day && Number.isInteger(v.used) && v.used >= 0) return v;
  } catch {
    // fall through to a fresh day
  }
  return { day, used: 0 };
}

export function designsLeft(now = new Date()): number {
  return Math.max(0, DAILY_FREE_DESIGNS - read(now).used);
}

/** Uses one free design. Returns false when none are left today. */
export function spendOneDesign(now = new Date()): boolean {
  const d = read(now);
  if (d.used >= DAILY_FREE_DESIGNS) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: d.day, used: d.used + 1 }));
  } catch {
    // storage blocked: allow this one
  }
  return true;
}

// Every credit number lives here. Change a value once and the whole app follows.

/** Free designs every user gets each day. They refill at midnight and do not pile up. */
export const DAILY_FREE_DESIGNS = 5;

/** Time zone that decides when "today" starts for the daily allowance. */
export const DAILY_RESET_TIME_ZONE = "Asia/Riyadh";

/** One-time bonus credits on sign-up (paid credits, they never expire). */
export const SIGNUP_BONUS_CREDITS = 5;

/** Cost in credits once the daily free designs are used up. */
export const CREDIT_COSTS = {
  imageAnalysis: 3,
  textAnalysis: 2,
  pdfExport: 1,
  edit: 0,
} as const;

/** Credit packs offered on /studio/credits. Prices in SAR. */
export const CREDIT_PACKS = [
  { id: "pack_20", credits: 20, priceSar: 19 },
  { id: "pack_60", credits: 60, priceSar: 49 },
  { id: "pack_150", credits: 150, priceSar: 99 },
] as const;

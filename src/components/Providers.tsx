"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Makes every Framer Motion animation respect the visitor's
// "reduce motion" system setting (transform animations are skipped).
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

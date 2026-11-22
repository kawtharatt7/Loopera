"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  active: boolean;
  duration?: number;
  className?: string;
}

// Counts from 0 up to `to` whenever `active` becomes true.
export function CountUp({ to, active, duration = 1.1, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [active, to, duration, reduce]);

  return <span className={className}>{value}</span>;
}

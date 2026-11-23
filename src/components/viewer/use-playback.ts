"use client";

import { useCallback, useEffect, useState } from "react";

export const SPEEDS = [0.5, 1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

/** Seconds per round at 1x. */
const BASE_SECONDS = 0.7;

/** Round playback: play, pause, scrub and speed. `round` is 0-based. */
export function usePlayback(totalRounds: number) {
  const [round, setRoundState] = useState(Math.max(0, totalRounds - 1));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  // Keep the round inside range when the pattern changes (live edits).
  useEffect(() => {
    setRoundState((r) => Math.min(r, Math.max(0, totalRounds - 1)));
  }, [totalRounds]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setRoundState((r) => {
        if (r >= totalRounds - 1) {
          setPlaying(false);
          return r;
        }
        return r + 1;
      });
    }, (BASE_SECONDS * 1000) / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, totalRounds]);

  const setRound = useCallback(
    (r: number) => setRoundState(Math.max(0, Math.min(totalRounds - 1, Math.round(r)))),
    [totalRounds],
  );

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p) setRoundState((r) => (r >= totalRounds - 1 ? 0 : r));
      return !p;
    });
  }, [totalRounds]);

  return { round, setRound, playing, setPlaying, toggle, speed, setSpeed };
}

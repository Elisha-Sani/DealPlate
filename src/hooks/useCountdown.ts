'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownReturn {
  seconds: number;
  formatted: string;
  isExpired: boolean;
  reset: (newSeconds: number) => void;
}

export function useCountdown(initialSeconds: number, onExpire?: () => void): UseCountdownReturn {
  const [currentInitial, setCurrentInitial] = useState(initialSeconds);
  const [seconds, setSeconds] = useState(currentInitial);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setCurrentInitial(initialSeconds);
  }, [initialSeconds]);

  // A single interval ticking for the lifetime of a countdown, instead of
  // being torn down and recreated every second (which drifts under tab
  // throttling since each recreation restarts the 1000ms timer from zero).
  useEffect(() => {
    setSeconds(currentInitial);

    if (currentInitial <= 0) {
      onExpireRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (prev > 0) onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentInitial]);

  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const reset = useCallback((newSeconds: number) => {
    setCurrentInitial(newSeconds);
  }, []);

  return {
    seconds,
    formatted: formatTime(Math.max(0, seconds)),
    isExpired: seconds <= 0,
    reset,
  };
}

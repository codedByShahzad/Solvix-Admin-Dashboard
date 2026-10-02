"use client";

import { useCallback, useRef, useState, type BaseSyntheticEvent } from "react";

/**
 * Prevents duplicate submissions. The ref is checked synchronously, so rapid
 * double/triple clicks are ignored even before React re-renders the button
 * as disabled (react-hook-form validation is async, which leaves a gap).
 *
 *   const { locked, lock } = useSubmitLock();
 *   <form onSubmit={lock(handleSubmit(onSubmit))}>
 *   <Button loading={locked} />
 */
export function useSubmitLock() {
  const inFlight = useRef(false);
  const [locked, setLocked] = useState(false);

  const lock = useCallback(
    <E extends BaseSyntheticEvent | undefined>(fn: (e?: E) => Promise<unknown> | unknown) =>
      async (e?: E) => {
        e?.preventDefault?.();
        if (inFlight.current) return;
        inFlight.current = true;
        setLocked(true);
        try {
          await fn(e);
        } finally {
          inFlight.current = false;
          setLocked(false);
        }
      },
    [],
  );

  return { locked, lock };
}

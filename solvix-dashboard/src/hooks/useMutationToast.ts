"use client";
import { useCallback } from "react";
import { toast } from "sonner";
import { getErrorMessage, isUnconfirmed } from "@/lib/api/errors";

/**
 * Wrap a mutation `.unwrap()` promise with consistent toasts.
 * Returns the result, or undefined if it failed.
 */
export function useMutationToast() {
  return useCallback(async <T,>(promise: Promise<T>, success: string, fallbackError?: string): Promise<T | undefined> => {
    try {
      const result = await promise;
      toast.success(success);
      return result;
    } catch (e) {
      if (isUnconfirmed(e)) {
        toast.warning("Backend route not connected yet", {
          description: `"${e.endpoint}" needs backend route confirmation in src/lib/api/endpoints.ts.`,
        });
      } else {
        toast.error(getErrorMessage(e, fallbackError));
      }
      return undefined;
    }
  }, []);
}

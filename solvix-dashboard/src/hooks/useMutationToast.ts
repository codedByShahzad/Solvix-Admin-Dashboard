"use client";
import { useCallback } from "react";
import { toast } from "sonner";
import { getErrorMessage, isApiError } from "@/lib/api/errors";

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
      const details = isApiError(e) && e.details && e.details.length > 1 ? e.details.slice(1).join(" ") : undefined;
      toast.error(getErrorMessage(e, fallbackError), details ? { description: details } : undefined);
      return undefined;
    }
  }, []);
}

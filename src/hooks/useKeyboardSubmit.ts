"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook that listens for Cmd+Enter (Mac) or Ctrl+Enter (Win/Linux)
 * within a scoped container and calls the provided callback.
 *
 * Returns a ref to attach to the container element.
 */
export function useKeyboardSubmit(
  callback: () => void,
  deps: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref fresh without re-attaching listeners
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        callbackRef.current();
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("keydown", handler);
      return () => el.removeEventListener("keydown", handler);
    }
  }, []);

  return containerRef;
}

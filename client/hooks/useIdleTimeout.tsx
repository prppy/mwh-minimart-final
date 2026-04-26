import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseIdleTimeoutOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  onActive?: () => void;
}

export function useIdleTimeout({
  timeout,
  onIdle,
  onActive,
}: UseIdleTimeoutOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isIdle) {
      setIsIdle(false);
      onActive?.();
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, timeout);
  }, [isIdle, timeout, onIdle, onActive]);

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground, reset timer
          resetTimer();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.remove();
    };
  }, [resetTimer]);

  return { isIdle, resetTimer };
}

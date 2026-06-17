import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 2500;

export function useToast(durationMs = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState({ visible: false, message: "" });
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast((current) => ({ ...current, visible: false }));
  }, []);

  const showToast = useCallback(
    (message) => {
      if (!message) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ visible: true, message });
      timerRef.current = setTimeout(hideToast, durationMs);
    },
    [durationMs, hideToast],
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return { toast, showToast, hideToast };
}

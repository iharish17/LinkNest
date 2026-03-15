import { useLayoutEffect, useState, type ReactNode } from "react";

type AnimatedPresenceProps = {
  show: boolean;
  duration?: number;
  onExited?: () => void;
  children: (state: "enter" | "exit") => ReactNode;
};

export function AnimatedPresence({
  show,
  duration = 240,
  onExited,
  children,
}: AnimatedPresenceProps) {
  const [isMounted, setIsMounted] = useState(show);

  useLayoutEffect(() => {
    let timeoutId: number | undefined;

    if (show) {
      setIsMounted(true);
    } else if (isMounted) {
      timeoutId = window.setTimeout(() => {
        setIsMounted(false);
        onExited?.();
      }, duration);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [duration, isMounted, onExited, show]);

  if (!isMounted) {
    return null;
  }

  return <>{children(show ? "enter" : "exit")}</>;
}

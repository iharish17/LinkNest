import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { AnchoredPopupPosition } from "../lib/anchoredPopup";
import { AnimatedPresence } from "./AnimatedPresence";

type AnchoredPopupProps = {
  children: ReactNode;
  open: boolean;
  onDismiss: () => void;
  onExited?: () => void;
  position: AnchoredPopupPosition;
  dismissDisabled?: boolean;
  popupClassName?: string;
};

export function AnchoredPopup({
  children,
  open,
  onDismiss,
  onExited,
  position,
  dismissDisabled = false,
  popupClassName = "",
}: AnchoredPopupProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatedPresence show={open} duration={220} onExited={onExited}>
      {(state) => (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120]"
        >
          <div
            className={`absolute inset-0 ${
              state === "enter"
                ? "motion-overlay-enter"
                : "motion-overlay-exit"
            }`}
            onClick={() => {
              if (!dismissDisabled) {
                onDismiss();
              }
            }}
          />

          <div
            className={`fixed z-[121] ${
              state === "enter"
                ? "motion-anchored-enter"
                : "motion-anchored-exit"
            } ${popupClassName}`.trim()}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {children}
          </div>
        </div>
      )}
    </AnimatedPresence>,
    document.body
  );
}

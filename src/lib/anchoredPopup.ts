export type AnchoredPopupPosition = {
  top: number;
  left: number;
};

export function getAnchoredPopupPosition(
  rect: DOMRect,
  popupWidth = 320,
  popupHeight = 180,
  gap = 8
): AnchoredPopupPosition {
  const margin = 16;
  const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
  const left = Math.min(
    Math.max(margin, centeredLeft),
    window.innerWidth - popupWidth - margin
  );

  const fitsBelow = rect.bottom + gap + popupHeight <= window.innerHeight - margin;
  const aboveTop = rect.top - popupHeight - gap;
  const top = fitsBelow
    ? rect.bottom + gap
    : Math.max(margin, aboveTop);

  return { top, left };
}

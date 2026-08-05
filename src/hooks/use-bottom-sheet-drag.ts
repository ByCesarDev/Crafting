import { useRef, useState } from "react";

export type SheetSnapState = "collapsed" | "expanded" | "full";

interface UseBottomSheetDragOptions {
  snapState: SheetSnapState;
  onSnapChange: (nextState: SheetSnapState) => void;
}

export function useBottomSheetDrag({ snapState, onSnapChange }: UseBottomSheetDragOptions) {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number | null>(null);

  const handleDragStart = (clientY: number) => {
    startYRef.current = clientY;
    currentYRef.current = clientY;
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (startYRef.current === null) return;
    currentYRef.current = clientY;
    const deltaY = clientY - startYRef.current;

    // Add resistance when pulling past bounds
    if ((snapState === "full" && deltaY < 0) || (snapState === "collapsed" && deltaY > 0)) {
      setDragOffsetY(deltaY * 0.25);
    } else {
      setDragOffsetY(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (startYRef.current === null || currentYRef.current === null) {
      setIsDragging(false);
      setDragOffsetY(0);
      return;
    }

    const deltaY = currentYRef.current - startYRef.current;
    const dragDistance = Math.abs(deltaY);

    if (dragDistance < 10) {
      // Tap / Click toggle logic
      if (snapState === "collapsed") {
        onSnapChange("expanded");
      } else if (snapState === "expanded") {
        onSnapChange("collapsed");
      } else {
        onSnapChange("expanded");
      }
    } else if (deltaY > 60) {
      // Swiped down
      if (snapState === "full") {
        onSnapChange("expanded");
      } else {
        onSnapChange("collapsed");
      }
    } else if (deltaY < -60) {
      // Swiped up
      if (snapState === "collapsed") {
        onSnapChange("expanded");
      } else {
        onSnapChange("full");
      }
    }

    setIsDragging(false);
    setDragOffsetY(0);
    startYRef.current = null;
    currentYRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleDragStart(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleDragMove(e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    handleDragEnd();
  };

  return {
    dragOffsetY,
    isDragging,
    dragProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: handleDragEnd,
    },
  };
}

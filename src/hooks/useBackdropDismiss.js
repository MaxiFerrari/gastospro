import { useRef, useCallback } from "react";

/**
 * Evita cerrar el modal si el usuario selecciona texto en un input y suelta
 * el mouse fuera del panel (mousedown dentro, mouseup en el backdrop).
 *
 * @param {() => void} onClose
 */
export function useBackdropDismiss(onClose) {
  const pressedOnBackdrop = useRef(false);

  const onPointerDown = useCallback((e) => {
    pressedOnBackdrop.current = e.target === e.currentTarget;
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (pressedOnBackdrop.current && e.target === e.currentTarget) {
        onClose();
      }
      pressedOnBackdrop.current = false;
    },
    [onClose],
  );

  const onPointerCancel = useCallback(() => {
    pressedOnBackdrop.current = false;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}

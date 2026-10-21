"use client";

import { type RefObject, useEffect, useRef } from "react";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export const useDialogFocus = (dialogRef: RefObject<HTMLElement | null>, initialFocusRef: RefObject<HTMLElement | null>, onClose: () => void, isOpen = true) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const focusInitialElement = () => (initialFocusRef.current ?? focusables()[0] ?? dialog).focus();
    const frame = window.requestAnimationFrame(focusInitialElement);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab") return;
      if (!dialog.contains(document.activeElement)) return;
      const elements = focusables();
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeyDown); previouslyFocused?.focus(); };
  }, [dialogRef, initialFocusRef, isOpen]);
};

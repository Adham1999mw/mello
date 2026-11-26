import { useSyncExternalStore } from "react";

// A tiny toast store. Call `toast.success({ title, message })` from anywhere (a form, a hook, a
// Redux listener); <Toaster /> in _app.tsx shows it. Toasts survive page changes, so a form can
// show one and then router.push() to the next page.
//
// Pass strings that are already translated (t(...)).

export type ToastTone = "success" | "info";

export type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Milliseconds on screen. Paused while hovered, focused or the tab is hidden. */
  duration: number;
};

type ToastInput = { title: string; message?: string; duration?: number };

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function show(tone: ToastTone, { title, message, duration = DEFAULT_DURATION }: ToastInput) {
  const id = nextId++;
  // Newest first. The same title twice in a row (a double submit) replaces the old one.
  toasts = [{ id, tone, title, message, duration }, ...toasts.filter((t) => t.title !== title)].slice(0, MAX_VISIBLE);
  emit();
  return id;
}

export const toast = {
  success: (input: ToastInput) => show("success", input),
  info: (input: ToastInput) => show("info", input),
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: Toast[] = [];

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
}

/** Survives a full-page redirect (Google sign-in): remember a toast now, show it on return. */
const PENDING_KEY = "needle:pending-toast";

export function setPendingToast(kind: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, kind);
  } catch {
    // Private mode: no toast after the redirect, nothing else breaks.
  }
}

export function takePendingToast(): string | null {
  try {
    const kind = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return kind;
  } catch {
    return null;
  }
}

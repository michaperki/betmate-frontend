export type BusNotification = {
  type: 'success' | 'error' | 'info' | 'win' | 'loss';
  title: string;
  message?: string;
  icon?: string; // emoji or text
};

type Handler = (n: BusNotification) => void;

const listeners = new Set<Handler>();

export function emit(n: BusNotification) {
  for (const h of Array.from(listeners)) {
    try { h(n); } catch {}
  }
}

export function subscribe(h: Handler) {
  listeners.add(h);
  return () => { listeners.delete(h); };
}

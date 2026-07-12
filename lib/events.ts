type Listener = () => void;

const listeners = new Set<Listener>();

export function emitTasksChanged(): void {
  listeners.forEach((listener) => listener());
}

export function onTasksChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

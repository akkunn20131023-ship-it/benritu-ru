/** 依存を増やさないための最小の型付きイベントエミッタ */
export class Emitter<Events> {
  private listeners = new Map<keyof Events, Set<(payload: never) => void>>();

  on<K extends keyof Events>(event: K, cb: (payload: Events[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as (payload: never) => void);
    return () => set!.delete(cb as (payload: never) => void);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of [...set]) (cb as (p: Events[K]) => void)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}

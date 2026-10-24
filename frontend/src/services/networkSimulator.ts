export type NetworkMode = 'online' | '2g_flaky' | 'offline';

type Listener = (mode: NetworkMode, isOnline: boolean) => void;

class NetworkSimulatorService {
  private mode: NetworkMode = 'online';
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNativeChange());
      window.addEventListener('offline', () => this.handleNativeChange());
      // Check real status initially
      if (!window.navigator.onLine) {
        this.mode = 'offline';
      }
    }
  }

  getMode(): NetworkMode {
    return this.mode;
  }

  isEffectivelyOnline(): boolean {
    if (this.mode === 'offline') return false;
    if (typeof window !== 'undefined' && !window.navigator.onLine) return false;
    return true;
  }

  isFlaky2G(): boolean {
    return this.mode === '2g_flaky';
  }

  setMode(mode: NetworkMode): void {
    this.mode = mode;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.mode, this.isEffectivelyOnline());
    return () => this.listeners.delete(listener);
  }

  private handleNativeChange(): void {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      this.mode = 'offline';
    } else if (this.mode === 'offline') {
      this.mode = 'online';
    }
    this.notify();
  }

  private notify(): void {
    const isOnline = this.isEffectivelyOnline();
    this.listeners.forEach(cb => cb(this.mode, isOnline));
  }
}

export const networkSimulator = new NetworkSimulatorService();

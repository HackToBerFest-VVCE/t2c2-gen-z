export interface ResourceStatus {
  batteryLevel: number; // 0.0 - 1.0
  isCharging: boolean;
  lowPowerMode: boolean;
  batteryThreshold: number; // e.g. 0.20 (20%)
  storageUsedBytes: number;
  storageTotalBytes: number;
  memoryUsedMb?: number;
  memoryLimitMb?: number;
}

type ResourceListener = (status: ResourceStatus) => void;

class ResourceManagerService {
  private status: ResourceStatus = {
    batteryLevel: 0.85, // Default 85% battery
    isCharging: false,
    lowPowerMode: false,
    batteryThreshold: 0.20,
    storageUsedBytes: 1024 * 1024 * 4, // 4MB IndexedDB
    storageTotalBytes: 1024 * 1024 * 500, // 500MB quota
    memoryUsedMb: 42,
    memoryLimitMb: 512
  };

  private listeners: Set<ResourceListener> = new Set();

  constructor() {
    this.initHardwareApis();
  }

  private async initHardwareApis() {
    // 1. Battery Status API if supported by browser
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        this.status.batteryLevel = battery.level;
        this.status.isCharging = battery.charging;

        battery.addEventListener('levelchange', () => {
          this.status.batteryLevel = battery.level;
          this.checkLowPowerRules();
          this.notify();
        });

        battery.addEventListener('chargingchange', () => {
          this.status.isCharging = battery.charging;
          this.checkLowPowerRules();
          this.notify();
        });
      } catch (e) {
        // Fallback to simulated defaults
      }
    }

    // 2. Storage Estimation API
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) this.status.storageUsedBytes = estimate.usage;
        if (estimate.quota) this.status.storageTotalBytes = estimate.quota;
      } catch (e) {
        // Fallback
      }
    }

    // 3. Performance Memory API
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.status.memoryUsedMb = Math.round(mem.usedJSHeapSize / (1024 * 1024));
      this.status.memoryLimitMb = Math.round(mem.jsHeapSizeLimit / (1024 * 1024));
    }

    this.checkLowPowerRules();
    this.notify();
  }

  getStatus(): ResourceStatus {
    return { ...this.status };
  }

  setSimulatedBattery(level: number, isCharging: boolean = false): void {
    this.status.batteryLevel = Math.max(0, Math.min(1, level));
    this.status.isCharging = isCharging;
    this.checkLowPowerRules();
    this.notify();
  }

  setBatteryThreshold(threshold: number): void {
    this.status.batteryThreshold = threshold;
    this.checkLowPowerRules();
    this.notify();
  }

  setLowPowerMode(enabled: boolean): void {
    this.status.lowPowerMode = enabled;
    this.notify();
  }

  private checkLowPowerRules(): void {
    // Auto-enable low power mode if battery < threshold and not charging
    if (this.status.batteryLevel <= this.status.batteryThreshold && !this.status.isCharging) {
      this.status.lowPowerMode = true;
    }
  }

  shouldThrottleExecution(): boolean {
    return this.status.lowPowerMode;
  }

  subscribe(listener: ResourceListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const s = this.getStatus();
    this.listeners.forEach(cb => cb(s));
  }
}

export const resourceManager = new ResourceManagerService();

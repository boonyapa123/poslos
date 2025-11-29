import hotkeys from 'hotkeys-js';

type HotkeyCallback = (event: KeyboardEvent) => void;

class HotkeyManager {
  private static instance: HotkeyManager;
  private registeredKeys: Map<string, HotkeyCallback> = new Map();
  private enabled: boolean = true;

  private constructor() {
    // Configure hotkeys
    hotkeys.filter = () => {
      return this.enabled;
    };
  }

  public static getInstance(): HotkeyManager {
    if (!HotkeyManager.instance) {
      HotkeyManager.instance = new HotkeyManager();
    }
    return HotkeyManager.instance;
  }

  public registerHotkey(key: string, callback: HotkeyCallback, description?: string): void {
    if (this.registeredKeys.has(key)) {
      console.warn(`Hotkey ${key} is already registered`);
      return;
    }

    hotkeys(key, (event) => {
      event.preventDefault();
      if (this.enabled) {
        callback(event);
      }
    });

    this.registeredKeys.set(key, callback);
    console.log(`Registered hotkey: ${key}${description ? ` - ${description}` : ''}`);
  }

  public unregisterHotkey(key: string): void {
    if (!this.registeredKeys.has(key)) {
      console.warn(`Hotkey ${key} is not registered`);
      return;
    }

    hotkeys.unbind(key);
    this.registeredKeys.delete(key);
    console.log(`Unregistered hotkey: ${key}`);
  }

  public enableHotkeys(): void {
    this.enabled = true;
    console.log('Hotkeys enabled');
  }

  public disableHotkeys(): void {
    this.enabled = false;
    console.log('Hotkeys disabled');
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getRegisteredKeys(): string[] {
    return Array.from(this.registeredKeys.keys());
  }

  public unregisterAll(): void {
    this.registeredKeys.forEach((_, key) => {
      hotkeys.unbind(key);
    });
    this.registeredKeys.clear();
    console.log('All hotkeys unregistered');
  }
}

export default HotkeyManager;

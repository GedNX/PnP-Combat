import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly storageKey = 'pnp-combat-theme';
  private readonly currentMode = signal<Theme>('dark');
  readonly mode = this.currentMode.asReadonly();

  constructor() {
    let stored: string | null = null;
    try {
      stored = this.window?.localStorage.getItem(this.storageKey) ?? null;
    } catch {
      // The theme still works when browser storage is unavailable.
    }
    this.apply(stored);
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.storageKey || event.key === null) {
        this.apply(event.newValue);
      }
    };
    this.window?.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() =>
      this.window?.removeEventListener('storage', onStorage),
    );
  }

  toggle(): void {
    const next = this.mode() === 'dark' ? 'light' : 'dark';
    this.apply(next);
    try {
      this.window?.localStorage.setItem(this.storageKey, next);
    } catch {
      // Keep the selection for this window even without persistence.
    }
  }

  private apply(value: string | null): void {
    const mode: Theme = value === 'light' ? 'light' : 'dark';
    this.currentMode.set(mode);
    this.document.documentElement.dataset['theme'] = mode;
  }
}

import { app, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const DEFAULT_STATE: WindowState = {
  width: 900,
  height: 670,
  isMaximized: false
};

// Track maximized state separately since isMaximized() returns false when window is hidden
let trackedIsMaximized = false;
let trackedBounds: { x: number; y: number; width: number; height: number } | null = null;

function getStateFilePath(): string {
  return join(app.getPath('userData'), 'window-state.json');
}

function loadState(): WindowState {
  try {
    if (existsSync(getStateFilePath())) {
      const data = readFileSync(getStateFilePath(), 'utf-8');
      const state = JSON.parse(data) as WindowState;

      // Validate that the window is still on a visible display
      if (state.x !== undefined && state.y !== undefined) {
        const displays = screen.getAllDisplays();
        const isVisible = displays.some((display) => {
          const { x, y, width, height } = display.bounds;
          return (
            state.x! >= x &&
            state.x! < x + width &&
            state.y! >= y &&
            state.y! < y + height
          );
        });

        if (!isVisible) {
          // Window would be off-screen, reset position
          delete state.x;
          delete state.y;
        }
      }

      return { ...DEFAULT_STATE, ...state };
    }
  } catch {
    // Ignore errors, return default state
  }
  return { ...DEFAULT_STATE };
}

function saveState(state: WindowState): void {
  try {
    writeFileSync(getStateFilePath(), JSON.stringify(state, null, 2));
  } catch {
    // Ignore write errors
  }
}

export function getWindowState(): WindowState {
  return loadState();
}

export function saveWindowState(window: BrowserWindow): void {
  if (window.isDestroyed()) return;

  // Use tracked state since window.isMaximized() returns false when hidden
  const bounds = trackedBounds || window.getBounds();

  const state: WindowState = {
    isMaximized: trackedIsMaximized,
    ...bounds
  };

  saveState(state);
}

export function trackWindowState(window: BrowserWindow): void {
  let saveTimeout: NodeJS.Timeout | null = null;

  // Initialize tracked state from saved state
  const savedState = loadState();
  trackedIsMaximized = window.isMaximized();
  if (trackedIsMaximized) {
    // Use saved bounds so unmaximizing restores to correct size
    trackedBounds = {
      x: savedState.x ?? 100,
      y: savedState.y ?? 100,
      width: savedState.width,
      height: savedState.height
    };
  } else {
    trackedBounds = window.getBounds();
  }

  const save = (): void => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounce saves to avoid excessive disk writes
    saveTimeout = setTimeout(() => {
      if (window.isDestroyed()) return;

      const state: WindowState = {
        isMaximized: trackedIsMaximized,
        ...(trackedBounds || window.getBounds())
      };

      saveState(state);
    }, 500);
  };

  window.on('resize', () => {
    if (!window.isMaximized()) {
      trackedBounds = window.getBounds();
    }
    save();
  });

  window.on('move', () => {
    if (!window.isMaximized()) {
      trackedBounds = window.getBounds();
    }
    save();
  });

  window.on('maximize', () => {
    trackedIsMaximized = true;
    save();
  });

  window.on('unmaximize', () => {
    trackedIsMaximized = false;
    trackedBounds = window.getBounds();
    save();
  });

  window.on('close', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    // Save immediately on close
    if (!window.isDestroyed()) {
      const state: WindowState = {
        isMaximized: trackedIsMaximized,
        ...(trackedBounds || window.getBounds())
      };

      saveState(state);
    }
  });
}

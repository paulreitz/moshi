import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import { join } from 'path';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let schedulerRunning = false;
let nextMessageAt: Date | null = null;

export function createTray(window: BrowserWindow): Tray {
  mainWindow = window;

  // Load tray icon
  const iconPath = join(__dirname, '../../resources/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  // Resize for tray (typically 16x16 or 22x22 depending on OS)
  const trayIcon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('Moshi - Japanese Practice');

  // Handle tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  updateTrayMenu();

  return tray;
}

export function updateTrayMenu(): void {
  if (!tray) return;

  const menuItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: mainWindow?.isVisible() ? 'Hide Moshi' : 'Show Moshi',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: schedulerRunning ? 'Stop Scheduler' : 'Start Scheduler',
      click: async () => {
        // This will be handled via IPC in the renderer
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    }
  ];

  if (schedulerRunning && nextMessageAt) {
    menuItems.push({
      label: `Next: ${nextMessageAt.toLocaleTimeString()}`,
      enabled: false
    });
  }

  menuItems.push(
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  );

  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

export function setSchedulerStatus(running: boolean, nextAt?: Date | null): void {
  schedulerRunning = running;
  nextMessageAt = nextAt ?? null;

  if (tray) {
    const status = running
      ? nextAt
        ? `Running - Next: ${nextAt.toLocaleTimeString()}`
        : 'Running'
      : 'Stopped';
    tray.setToolTip(`Moshi - ${status}`);
    updateTrayMenu();
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

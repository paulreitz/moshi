import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { initDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createTray, destroyTray, updateTrayMenu } from './services/tray';
import { getWindowState, trackWindowState, saveWindowState } from './services/windowState';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

function createWindow(): void {
  const windowState = getWindowState();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  // Track window state changes
  trackWindowState(mainWindow);

  mainWindow.on('ready-to-show', () => {
    if (windowState.isMaximized) {
      mainWindow?.maximize();
    }
    mainWindow?.show();
  });

  // Hide window instead of closing (minimize to tray)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      if (mainWindow) {
        saveWindowState(mainWindow);
      }
      mainWindow?.hide();
      updateTrayMenu();
    }
  });

  mainWindow.on('show', () => {
    updateTrayMenu();
  });

  mainWindow.on('hide', () => {
    updateTrayMenu();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Create system tray
  createTray(mainWindow);
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.moshi');

  // Initialize database and run migrations
  initDatabase();

  // Register IPC handlers
  registerIpcHandlers();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
});

// Set quitting flag before app quits
app.on('before-quit', () => {
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    saveWindowState(mainWindow);
  }
});

// On macOS, quit when all windows are closed (we have tray to keep app alive)
// On other platforms, don't quit - let tray keep the app alive
app.on('window-all-closed', () => {
  // Don't quit on window close - tray keeps app alive
  // App will quit when user clicks "Quit" from tray menu
});

// Cleanup tray on quit
app.on('will-quit', () => {
  destroyTray();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

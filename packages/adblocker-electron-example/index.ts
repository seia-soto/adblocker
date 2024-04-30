import fetch from 'cross-fetch';
import { app, BrowserWindow } from 'electron';
import { readFileSync, writeFileSync } from 'fs';

import { CosmeticFilter, ElectronBlocker, fullLists, Request } from '@cliqz/adblocker-electron';
import { EngineEventContext } from '@cliqz/adblocker/src/engine/engine';

function getUrlToLoad(): string {
  let url = 'https://google.com';
  if (process.argv[process.argv.length - 1].endsWith('.js') === false) {
    url = process.argv[process.argv.length - 1];
  }

  return url;
}

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
    },
    height: 600,
    width: 800,
  });

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  );

  blocker.enableBlockingInSession(mainWindow.webContents.session);

  blocker.on('request-allowed', (request: Request) => {
    console.log('allow', request.tabId, request.url);
  });

  blocker.on('request-blocked', (request: Request) => {
    console.log('blocked', request.tabId, request.url);
  });

  blocker.on('request-redirected', (request: Request) => {
    console.log('redirected', request.tabId, request.url);
  });

  blocker.on('request-whitelisted', (request: Request) => {
    console.log('whitelisted', request.tabId, request.url);
  });

  blocker.on('csp-injected', (csps: string, request: Request) => {
    console.log('csp', csps, request.url);
  });

  blocker.on('script-injected', (script: string, url: string, context: EngineEventContext) => {
    console.log('script', script.length, url, context);
  });

  blocker.on('style-injected', (style: string, url: string, context: EngineEventContext) => {
    console.log('style', style.length, url, context);
  });

  blocker.on('scriptlet-matched', (rule: CosmeticFilter, context: EngineEventContext) => {
    console.log('script-matched', rule, context);
  });

  blocker.on('extended-rule-matched', (rule: CosmeticFilter, context: EngineEventContext) => {
    console.log('extended-rule-matched', rule, context);
  });

  blocker.on('style-rule-matched', (rule: CosmeticFilter, context: EngineEventContext) => {
    console.log('style-matched', rule, context);
  });

  mainWindow.loadURL(getUrlToLoad());
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

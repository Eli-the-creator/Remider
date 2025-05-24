// import { app, shell, BrowserWindow } from "electron";
// import { join } from "path";
// import { electronApp, optimizer, is } from "@electron-toolkit/utils";
// import icon from "../../resources/icon.png?asset";

// function createWindow(): void {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 900,
//     height: 670,
//     show: false,
//     resizable: false,
//     autoHideMenuBar: true,
//     ...(process.platform === "linux" ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, "../preload/index.js"),
//       sandbox: false,
//     },
//     backgroundColor: "#0000000",
//   });

//   mainWindow.on("ready-to-show", () => {
//     mainWindow.show();
//   });

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url);
//     return { action: "deny" };
//   });

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
//     mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
//   } else {
//     mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
//   }
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId("com.electron");

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on("browser-window-created", (_, window) => {
//     optimizer.watchWindowShortcuts(window);
//   });

//   createWindow();

//   app.on("activate", function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });

// // In this file you can include the rest of your app"s specific main process
// // code. You can also put them in separate files and require them here.

import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Notification,
  dialog,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import * as fs from "fs/promises";
import * as path from "path";

let mainWindow: BrowserWindow;
let notificationWindow: BrowserWindow | null = null;
let quotesData: Quote[] = [];
let settings: AppSettings = {
  interval: 30,
  autoStart: false,
  theme: "light",
  position: "top-right",
};

interface Quote {
  id: string;
  text: string;
  author?: string;
}

interface AppSettings {
  interval: number; // minutes
  autoStart: boolean;
  theme: "light" | "dark";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    resizable: true,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    backgroundColor: "#ffffff",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#000000",
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function createNotificationWindow(quote: Quote): void {
  if (notificationWindow) {
    notificationWindow.close();
    notificationWindow = null;
  }

  const { width, height } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 400;
  const windowHeight = 200;

  let x: number, y: number;

  switch (settings.position) {
    case "top-left":
      x = 20;
      y = 20;
      break;
    case "top-right":
      x = width - windowWidth - 20;
      y = 20;
      break;
    case "bottom-left":
      x = 20;
      y = height - windowHeight - 20;
      break;
    case "bottom-right":
      x = width - windowWidth - 20;
      y = height - windowHeight - 20;
      break;
    default:
      x = width - windowWidth - 20;
      y = 20;
  }

  notificationWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  const notificationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: transparent;
          padding: 20px;
          animation: slideIn 0.5s ease-out;
        }
        
        .notification {
          background: ${settings.theme === "dark" ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)"};
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid ${settings.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
          position: relative;
          overflow: hidden;
        }
        
        .notification::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .quote-text {
          font-size: 16px;
          line-height: 1.5;
          color: ${settings.theme === "dark" ? "#ffffff" : "#333333"};
          margin-bottom: 12px;
          font-weight: 400;
        }
        
        .quote-author {
          font-size: 14px;
          color: ${settings.theme === "dark" ? "#a0a0a0" : "#666666"};
          font-style: italic;
          text-align: right;
        }
        
        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 18px;
          color: ${settings.theme === "dark" ? "#a0a0a0" : "#666666"};
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .close-btn:hover {
          opacity: 1;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(${settings.position.includes("right") ? "100%" : "-100%"});
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    </head>
    <body>
      <div class="notification">
        <button class="close-btn" onclick="window.electronAPI.closeNotification()">×</button>
        <div class="quote-text">"${quote.text}"</div>
        ${quote.author ? `<div class="quote-author">— ${quote.author}</div>` : ""}
      </div>
      
      <script>
        setTimeout(() => {
          window.electronAPI.closeNotification();
        }, 8000);
      </script>
    </body>
    </html>
  `;

  notificationWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(notificationHtml)}`,
  );

  setTimeout(() => {
    if (notificationWindow && !notificationWindow.isDestroyed()) {
      notificationWindow.close();
      notificationWindow = null;
    }
  }, 8000);
}

let quoteInterval: NodeJS.Timeout | null = null;

function startQuoteNotifications(): void {
  if (quoteInterval) clearInterval(quoteInterval);

  if (quotesData.length === 0) return;

  quoteInterval = setInterval(
    () => {
      const randomQuote =
        quotesData[Math.floor(Math.random() * quotesData.length)];
      createNotificationWindow(randomQuote);
    },
    settings.interval * 60 * 1000,
  );
}

function stopQuoteNotifications(): void {
  if (quoteInterval) {
    clearInterval(quoteInterval);
    quoteInterval = null;
  }
}

// IPC Handlers
ipcMain.handle("get-quotes", () => quotesData);

ipcMain.handle("set-quotes", (_, quotes: Quote[]) => {
  quotesData = quotes;
  if (quotesData.length > 0) {
    startQuoteNotifications();
  }
  return true;
});

ipcMain.handle("get-settings", () => settings);

ipcMain.handle("set-settings", (_, newSettings: AppSettings) => {
  settings = { ...settings, ...newSettings };

  if (settings.autoStart) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath("exe"),
    });
  } else {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
  }

  stopQuoteNotifications();
  if (quotesData.length > 0) {
    startQuoteNotifications();
  }

  return true;
});

ipcMain.handle("show-quote-preview", (_, quote: Quote) => {
  createNotificationWindow(quote);
  return true;
});

ipcMain.handle("close-notification", () => {
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    notificationWindow.close();
    notificationWindow = null;
  }
  return true;
});

ipcMain.handle("parse-markdown-quotes", (_, markdown: string) => {
  const quotes: Quote[] = [];
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse different markdown quote formats
    if (line.startsWith("> ")) {
      // Blockquote format
      const text = line.substring(2).trim();
      const nextLine = lines[i + 1]?.trim();
      let author = "";

      if (
        nextLine &&
        (nextLine.startsWith("— ") || nextLine.startsWith("- "))
      ) {
        author = nextLine.substring(2).trim();
        i++; // Skip next line
      }

      if (text) {
        quotes.push({
          id: Date.now() + Math.random().toString(),
          text: text.replace(/^[""]|[""]$/g, ""), // Remove quotes if present
          author,
        });
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // List format
      const content = line.substring(2).trim();
      const parts = content.split(" — ");

      if (parts.length >= 2) {
        quotes.push({
          id: Date.now() + Math.random().toString(),
          text: parts[0].replace(/^[""]|[""]$/g, ""),
          author: parts[1],
        });
      } else if (content) {
        quotes.push({
          id: Date.now() + Math.random().toString(),
          text: content.replace(/^[""]|[""]$/g, ""),
          author: "",
        });
      }
    }
  }

  return quotes;
});

ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Markdown Files", extensions: ["md"] },
      { name: "Text Files", extensions: ["txt"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const content = await fs.readFile(result.filePaths[0], "utf-8");
      return content;
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  }

  return null;
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron.quotes");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopQuoteNotifications();
});

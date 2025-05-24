import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

interface Quote {
  id: string;
  text: string;
  author?: string;
}

interface AppSettings {
  interval: number;
  autoStart: boolean;
  theme: "light" | "dark";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const api = {
  getQuotes: () => ipcRenderer.invoke("get-quotes"),
  setQuotes: (quotes: Quote[]) => ipcRenderer.invoke("set-quotes", quotes),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("set-settings", settings),
  showQuotePreview: (quote: Quote) =>
    ipcRenderer.invoke("show-quote-preview", quote),
  closeNotification: () => ipcRenderer.invoke("close-notification"),
  parseMarkdownQuotes: (markdown: string) =>
    ipcRenderer.invoke("parse-markdown-quotes", markdown),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("electronAPI", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.electronAPI = api;
}

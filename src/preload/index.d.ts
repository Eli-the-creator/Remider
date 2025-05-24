import { ElectronAPI } from "@electron-toolkit/preload";

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

interface ElectronQuotesAPI {
  getQuotes: () => Promise<Quote[]>;
  setQuotes: (quotes: Quote[]) => Promise<boolean>;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: AppSettings) => Promise<boolean>;
  showQuotePreview: (quote: Quote) => Promise<boolean>;
  closeNotification: () => Promise<boolean>;
  parseMarkdownQuotes: (markdown: string) => Promise<Quote[]>;
  openFileDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI: ElectronQuotesAPI;
  }
}

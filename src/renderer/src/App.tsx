import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import {
  Quote,
  Settings,
  Upload,
  Play,
  Pause,
  Plus,
  X,
  Eye,
  FileText,
  Clock,
  MapPin,
  Palette,
  Power,
  Download,
  Edit3,
  Save,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";

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

const QuotesApp: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    interval: 30,
    autoStart: false,
    theme: "light",
    position: "top-right",
  });
  const [activeTab, setActiveTab] = useState<"quotes" | "settings">("quotes");
  const [isRunning, setIsRunning] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [newQuote, setNewQuote] = useState({ text: "", author: "" });
  const [firstTime, setFirstTime] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedQuotes = await window.electronAPI.getQuotes();
        const loadedSettings = await window.electronAPI.getSettings();
        setQuotes(loadedQuotes);
        setSettings(loadedSettings);

        // Check if this is first time setup
        if (loadedQuotes.length === 0) {
          setFirstTime(true);
        } else {
          setFirstTime(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Save quotes when they change
  const saveQuotes = async (newQuotes: Quote[]) => {
    try {
      await window.electronAPI.setQuotes(newQuotes);
      setQuotes(newQuotes);
    } catch (error) {
      console.error("Error saving quotes:", error);
    }
  };

  // Save settings when they change
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await window.electronAPI.setSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Handle markdown import
  const handleMarkdownImport = async () => {
    try {
      const parsedQuotes =
        await window.electronAPI.parseMarkdownQuotes(markdownText);
      const allQuotes = [...quotes, ...parsedQuotes];
      await saveQuotes(allQuotes);
      setMarkdownText("");
      setShowMarkdownInput(false);
    } catch (error) {
      console.error("Error parsing markdown:", error);
    }
  };

  // Handle file import
  const handleFileImport = async () => {
    try {
      const content = await window.electronAPI.openFileDialog();
      if (content) {
        const parsedQuotes =
          await window.electronAPI.parseMarkdownQuotes(content);
        const allQuotes = [...quotes, ...parsedQuotes];
        await saveQuotes(allQuotes);
      }
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  // Add new quote manually
  const handleAddQuote = async () => {
    if (newQuote.text.trim()) {
      const quote: Quote = {
        id: Date.now().toString(),
        text: newQuote.text.trim(),
        author: newQuote.author.trim() || undefined,
      };
      await saveQuotes([...quotes, quote]);
      setNewQuote({ text: "", author: "" });
    }
  };

  // Delete quote
  const handleDeleteQuote = async (id: string) => {
    const filtered = quotes.filter((q) => q.id !== id);
    await saveQuotes(filtered);
  };

  // Edit quote
  const handleEditQuote = async (updatedQuote: Quote) => {
    const updated = quotes.map((q) =>
      q.id === updatedQuote.id ? updatedQuote : q,
    );
    await saveQuotes(updated);
    setEditingQuote(null);
  };

  // Preview quote
  const handlePreviewQuote = async (quote: Quote) => {
    try {
      await window.electronAPI.showQuotePreview(quote);
    } catch (error) {
      console.error("Error showing preview:", error);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = settings.theme === "light" ? "dark" : "light";
    saveSettings({ ...settings, theme: newTheme });
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 },
    },
  };

  // First time setup modal
  if (firstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center"
            >
              <Quote className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Добро пожаловать!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Настройте ваше приложение цитат для вдохновения каждый день
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <Power className="w-5 h-5 text-green-500" />
                <span>Автозапуск с Windows</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  saveSettings({ ...settings, autoStart: !settings.autoStart })
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoStart ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <motion.div
                  animate={{ x: settings.autoStart ? 24 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>

            <Button
              onClick={() => setFirstTime(false)}
              className="w-full gradient-animation text-white font-semibold py-3 rounded-xl"
            >
              Продолжить
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        settings.theme === "dark"
          ? "dark bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto p-6 max-w-6xl"
      >
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Quote className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Цитаты
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {quotes.length} цитат загружено
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {settings.theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant={activeTab === "quotes" ? "default" : "ghost"}
              onClick={() => setActiveTab("quotes")}
              className="rounded-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Цитаты
            </Button>

            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className="rounded-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </Button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === "quotes" && (
            <motion.div
              key="quotes"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Action Bar */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-4 items-center justify-between p-6 glass rounded-2xl"
              >
                <div className="flex gap-3">
                  <Button
                    onClick={handleFileImport}
                    className="rounded-xl"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить файл
                  </Button>

                  <Button
                    onClick={() => setShowMarkdownInput(true)}
                    className="rounded-xl"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить текст
                  </Button>
                </div>

                {quotes.length > 0 && (
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`rounded-xl ${isRunning ? "bg-red-500 hover:bg-red-600" : "gradient-animation"} text-white`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Остановить
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Запустить
                      </>
                    )}
                  </Button>
                )}
              </motion.div>

              {/* Markdown Input Modal */}
              <AnimatePresence>
                {showMarkdownInput && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowMarkdownInput(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">
                          Добавить цитаты
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowMarkdownInput(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <textarea
                        value={markdownText}
                        onChange={(e) => setMarkdownText(e.target.value)}
                        placeholder="Вставьте markdown текст с цитатами..."
                        className="w-full h-64 p-4 border rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />

                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowMarkdownInput(false)}
                        >
                          Отмена
                        </Button>
                        <Button
                          onClick={handleMarkdownImport}
                          disabled={!markdownText.trim()}
                          className="gradient-animation text-white"
                        >
                          Импортировать
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Quote Form */}
              <motion.div
                variants={itemVariants}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Добавить цитату вручную
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Текст цитаты..."
                    value={newQuote.text}
                    onChange={(e) =>
                      setNewQuote({ ...newQuote, text: e.target.value })
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Автор (необязательно)"
                      value={newQuote.author}
                      onChange={(e) =>
                        setNewQuote({ ...newQuote, author: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleAddQuote}
                      disabled={!newQuote.text.trim()}
                      className="px-6 gradient-animation text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Quotes List */}
              <motion.div variants={itemVariants} className="grid gap-4">
                <AnimatePresence>
                  {quotes.map((quote) => (
                    <motion.div
                      key={quote.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{ scale: 1.02 }}
                      className="glass rounded-2xl p-6 group"
                    >
                      {editingQuote?.id === quote.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={editingQuote.text}
                            onChange={(e) =>
                              setEditingQuote({
                                ...editingQuote,
                                text: e.target.value,
                              })
                            }
                            className="w-full p-3 border rounded-xl resize-none focus:ring-2 focus:ring-purple-500"
                            rows={3}
                          />
                          <input
                            type="text"
                            value={editingQuote.author || ""}
                            onChange={(e) =>
                              setEditingQuote({
                                ...editingQuote,
                                author: e.target.value,
                              })
                            }
                            placeholder="Автор"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingQuote(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditQuote(editingQuote)}
                              className="gradient-animation text-white"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <blockquote className="text-lg leading-relaxed flex-1">
                              "{quote.text}"
                            </blockquote>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewQuote(quote)}
                                className="rounded-full"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingQuote(quote)}
                                className="rounded-full"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="rounded-full text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {quote.author && (
                            <cite className="text-gray-600 dark:text-gray-400 font-medium">
                              — {quote.author}
                            </cite>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {quotes.length === 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="text-center py-16 glass rounded-2xl"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                    >
                      <Quote className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Нет цитат</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Загрузите файл с цитатами или добавьте их вручную
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Interval Setting */}
              <motion.div
                variants={itemVariants}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 mr-3 text-purple-500" />
                  <h3 className="text-lg font-semibold">Интервал показа</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={settings.interval}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        interval: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full">
                    {settings.interval} мин
                  </span>
                </div>
              </motion.div>

              {/* Position Setting */}
              <motion.div
                variants={itemVariants}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 mr-3 text-purple-500" />
                  <h3 className="text-lg font-semibold">Позиция уведомлений</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "top-left", label: "Верх слева" },
                    { value: "top-right", label: "Верх справа" },
                    { value: "bottom-left", label: "Низ слева" },
                    { value: "bottom-right", label: "Низ справа" },
                  ].map((position) => (
                    <Button
                      key={position.value}
                      variant={
                        settings.position === position.value
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        saveSettings({
                          ...settings,
                          position: position.value as any,
                        })
                      }
                      className="rounded-xl"
                    >
                      {position.label}
                    </Button>
                  ))}
                </div>
              </motion.div>

              {/* Theme Setting */}
              <motion.div
                variants={itemVariants}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Palette className="w-5 h-5 mr-3 text-purple-500" />
                    <div>
                      <h3 className="text-lg font-semibold">Тема</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Текущая тема:{" "}
                        {settings.theme === "dark" ? "Тёмная" : "Светлая"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    className="rounded-xl"
                  >
                    {settings.theme === "dark" ? (
                      <Sun className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    Переключить
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

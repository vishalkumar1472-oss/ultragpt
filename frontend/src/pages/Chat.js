import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/context/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Chat({ user, setUser, logout }) {
  const { theme, toggleTheme } = useTheme();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileText, setFileText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");

  // 👇 NEW: engine selector state (Groq / Gemini / DeepSeek / Auto)
  const [engine, setEngine] = useState("auto");

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        toast.error("Voice input failed");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const loadUserData = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history`, {
        withCredentials: true,
      });
      setChats(response.data);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API}/chat/${chatId}/messages`, {
        withCredentials: true,
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setUploadedFile(file.name);
      setFileText(response.data.text);
      toast.success("File uploaded successfully");
      loadUserData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "File upload failed");
    }
  };

  const startVoiceInput = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const playVoiceOutput = async (text) => {
    try {
      const response = await axios.post(
        `${API}/voice/tts`,
        { text },
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      loadUserData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Voice output failed");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    // Add user message to UI
    const tempUserMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch(`${API}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          chat_id: currentChatId,
          model: selectedModel,
          engine: engine, // 👈 NEW: send engine to backend (Groq/Gemini/DeepSeek/Auto)
          file_text: fileText || null,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let newChatId = currentChatId;

      const tempAssistantMsg = {
        id: Date.now().toString() + "_assistant",
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAssistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chat_id && !newChatId) {
                newChatId = data.chat_id;
                setCurrentChatId(newChatId);
              }

              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantMessage,
                  };
                  return updated;
                });
              }

              if (data.done) {
                loadChatHistory();
                loadUserData();

                // Play voice if enabled
                if (voiceEnabled && assistantMessage) {
                  playVoiceOutput(assistantMessage);
                }
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      // Clear file after sending
      setUploadedFile(null);
      setFileText("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.detail || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${API}/chat/${chatId}`, {
        withCredentials: true,
      });
      setChats(chats.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const deleteAllChats = async () => {
    try {
      await axios.delete(`${API}/chat/all`, {
        withCredentials: true,
      });
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
      setShowDeleteAll(false);
      toast.success("All chats deleted");
    } catch (error) {
      toast.error("Failed to delete chats");
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setUploadedFile(null);
    setFileText("");
  };

  const creditPercentage = (user.credits / 1000) * 100;

  return (
    <div
      className={`flex h-screen ${
        theme === "dark" ? "bg-[#0f0f10]" : "bg-white"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ${
          theme === "dark"
            ? "bg-slate-950 border-slate-800"
            : "bg-gray-50 border-gray-200"
        } border-r flex flex-col overflow-hidden`}
      >
        <div
          className={`p-4 border-b ${
            theme === "dark" ? "border-slate-800" : "border-gray-200"
          }`}
        >
          <Button
            data-testid="new-chat-btn"
            onClick={startNewChat}
            className={`w-full mb-2 ${
              theme === "dark"
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-gray-200 hover:bg-gray-300"
            } rounded-lg`}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </Button>
          <Button
            data-testid="delete-all-chats-btn"
            onClick={() => setShowDeleteAll(true)}
            variant="outline"
            className="w-full text-red-500 border-red-500 hover:bg-red-500/10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                data-testid={`chat-item-${chat.id}`}
                className={`p-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors group ${
                  currentChatId === chat.id ? "bg-slate-800" : ""
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {chat.title}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-slate-500" : "text-gray-500"
                      }`}
                    >
                      {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    data-testid={`delete-chat-${chat.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-slate-700 rounded"
                  >
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Phone Assistant Navigation */}
        <div
          className={`p-4 border-t ${
            theme === "dark" ? "border-slate-800" : "border-gray-200"
          } space-y-2`}
        >
          <p
            className={`text-xs font-semibold uppercase ${
              theme === "dark" ? "text-slate-500" : "text-gray-500"
            } mb-2`}
          >
            Phone Assistant
          </p>
          <button
            onClick={() => (window.location.href = "/assistant-actions")}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-blue-500" : "text-blue-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span
              className={`text-sm ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Assistant Actions
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/call-logs")}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-green-500" : "text-green-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span
              className={`text-sm ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Call Logs
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/auto-reply")}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-purple-500" : "text-purple-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span
              className={`text-sm ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Auto Reply
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/device-settings")}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-orange-500" : "text-orange-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span
              className={`text-sm ${
                theme === "dark" ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Device Settings
            </span>
          </button>
        </div>

        <div
          className={`p-4 border-t ${
            theme === "dark" ? "border-slate-800" : "border-gray-200"
          }`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="user-menu-btn"
                className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800 transition-colors`}
              >
                <Avatar className="w-8 h-8">
                  <img
                    src={user.picture || "https://via.placeholder.com/40"}
                    alt={user.name}
                  />
                </Avatar>
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.name}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-slate-500" : "text-gray-500"
                    }`}
                  >
                    {user.plan_type}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => (window.location.href = "/plans")}
              >
                Upgrade Plan
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="logout-btn" onClick={logout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header
          className={`h-16 border-b ${
            theme === "dark" ? "border-slate-800" : "border-gray-200"
          } flex items-center justify-between px-6`}
        >
          <div className="flex items-center space-x-4">
            <button
              data-testid="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                UltraGPT
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Model Selector (per-provider models) */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <optgroup label="Groq (⚡ Fastest)">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="llama-3.1-8b-instant">
                  Llama 3.1 8B (Ultra Fast)
                </option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </optgroup>
              <optgroup label="Gemini (Google)">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </optgroup>
              <optgroup label="OpenAI">
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </optgroup>
            </select>

            {/* Engine Selector (Groq / Gemini / DeepSeek / Auto) */}
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="auto">Auto</option>
              <option value="groq">Groq ⚡ Fast</option>
              <option value="gemini">Gemini 🤖</option>
              <option value="deepseek">DeepSeek 🧠</option>
            </select>

            {/* Credit Display */}
            <div className="flex items-center space-x-2">
              <div className="w-40">
                <Progress value={creditPercentage} className="h-2" />
              </div>
              <span
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {user.credits} credits
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              data-testid="theme-toggle-btn"
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
              }`}
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-2xl font-semibold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Start a conversation
                </h2>
                <p
                  className={
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }
                >
                  Send a message to begin chatting with UltraGPT
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                data-testid={`message-${idx}`}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : theme === "dark"
                      ? "bg-slate-900 text-slate-100 border border-slate-800"
                      : "bg-gray-100 text-gray-900 border border-gray-200"
                  }`}
                >
                  <p
                    className="whitespace-pre-wrap"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800"
                      : "bg-gray-100 border-gray-200"
                  } border`}
                >
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div
          className={`border-t ${
            theme === "dark" ? "border-slate-800" : "border-gray-200"
          } p-6`}
        >
          {uploadedFile && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
              <span className="text-sm text-blue-500">{uploadedFile}</span>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setFileText("");
                }}
                className="text-red-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="relative flex items-center space-x-2">
              {/* File Upload */}
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  theme === "dark" ? "hover:bg-slate-800" : "hover:bg-gray-200"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-slate-400" : "text-gray-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </label>

              <input
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                className={`flex-1 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-colors ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } border`}
                style={{ fontFamily: "Inter, sans-serif" }}
              />

              {/* Voice Input */}
              <button
                type="button"
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : theme === "dark"
                    ? "hover:bg-slate-800"
                    : "hover:bg-gray-200"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isRecording
                      ? "text-white"
                      : theme === "dark"
                      ? "text-slate-400"
                      : "text-gray-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              {/* Voice Output Toggle */}
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-3 rounded-xl transition-colors ${
                  voiceEnabled
                    ? "bg-green-500 hover:bg-green-600"
                    : theme === "dark"
                    ? "hover:bg-slate-800"
                    : "hover:bg-gray-200"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    voiceEnabled
                      ? "text-white"
                      : theme === "dark"
                      ? "text-slate-400"
                      : "text-gray-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </button>

              <button
                data-testid="send-message-btn"
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your chat history will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllChats}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

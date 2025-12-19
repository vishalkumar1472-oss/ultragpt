import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Chat({ user, logout }) {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history`, {
        withCredentials: true
      });
      setChats(response.data);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API}/chat/${chatId}/messages`, {
        withCredentials: true
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
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
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

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
          model: "gpt-4o-mini"
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let newChatId = currentChatId;

      const tempAssistantMsg = {
        id: Date.now().toString() + "_assistant",
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempAssistantMsg]);

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
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantMessage
                  };
                  return updated;
                });
              }
              
              if (data.done) {
                loadChatHistory();
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }
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
        withCredentials: true
      });
      setChats(chats.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#0f0f10]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-800">
          <Button 
            data-testid="new-chat-btn"
            onClick={startNewChat}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                data-testid={`chat-item-${chat.id}`}
                className={`p-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors group ${
                  currentChatId === chat.id ? 'bg-slate-800' : ''
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{chat.title}</p>
                    <p className="text-xs text-slate-500">
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
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="user-menu-btn" className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Avatar className="w-8 h-8">
                  <img src={user.picture || 'https://via.placeholder.com/40'} alt={user.name} />
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm text-white font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.credits} credits</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem data-testid="logout-btn" onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <button 
            data-testid="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">UltraGPT</span>
          </div>
          <Button data-testid="admin-panel-btn" onClick={() => window.location.href = '/admin'} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Admin Panel
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Start a conversation</h2>
                <p className="text-slate-400">Send a message to begin chatting with UltraGPT</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} data-testid={`message-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-slate-900 text-slate-100 border border-slate-800'
                }`}>
                  <p className="whitespace-pre-wrap" style={{fontFamily: 'Inter, sans-serif'}}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-slate-800 p-6">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 pr-14 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                style={{fontFamily: 'Inter, sans-serif'}}
              />
              <button
                data-testid="send-message-btn"
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

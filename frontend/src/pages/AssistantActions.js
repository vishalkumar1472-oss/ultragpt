import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AssistantActions({ user }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const response = await axios.get(`${API}/assistant/actions`, {
        withCredentials: true
      });
      setActions(response.data);
    } catch (error) {
      console.error("Failed to load actions:", error);
    }
  };

  const getModeColor = (mode) => {
    const colors = {
      chat: "bg-blue-500",
      command: "bg-green-500",
      call_translate: "bg-purple-500",
      call_agent: "bg-orange-500",
      auto_answer: "bg-red-500"
    };
    return colors[mode] || "bg-gray-500";
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f0f10]' : 'bg-gray-50'}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Assistant Actions</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Last 50 voice commands & interactions</p>
          </div>
          <Button onClick={() => navigate("/chat")} variant="outline">
            Back to Chat
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getModeColor(action.mode)}`}>
                      {action.mode.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className={`mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <p className="font-medium mb-1">Input:</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>"{action.input_text}"</p>
                </div>

                {action.response_text && (
                  <div className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>
                    <p className="font-medium mb-1">Response:</p>
                    <p className="text-sm">{action.response_text}</p>
                  </div>
                )}

                {action.command_json && (
                  <div className={`mt-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}`}>
                    <p className="text-xs font-medium mb-2">Command:</p>
                    <pre className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} overflow-x-auto`}>
                      {JSON.stringify(action.command_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

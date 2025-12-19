import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CallLogs({ user }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API}/call/logs`, {
        withCredentials: true
      });
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to load call logs:", error);
    }
  };

  const getUrgencyColor = (score) => {
    if (score >= 8) return "text-red-500";
    if (score >= 5) return "text-orange-500";
    return "text-green-500";
  };

  const getIntentBadge = (intent) => {
    const colors = {
      loan_info: "bg-blue-500",
      meeting: "bg-purple-500",
      family: "bg-green-500",
      urgent: "bg-red-500",
      sales: "bg-orange-500",
      unknown: "bg-gray-500"
    };
    return colors[intent] || "bg-gray-500";
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f0f10]' : 'bg-gray-50'}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Call Logs</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>AI auto-answered calls & summaries</p>
          </div>
          <Button onClick={() => navigate("/chat")} variant="outline">
            Back to Chat
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {log.caller_name}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {log.caller_number}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getIntentBadge(log.intent)}`}>
                    {log.intent.replace('_', ' ')}
                  </span>
                </div>

                <div className={`mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  <p className="text-sm font-medium mb-1">Summary:</p>
                  <p className="text-sm">{log.summary}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${getUrgencyColor(log.urgency_score)}`}>
                      Urgency: {log.urgency_score}/10
                    </span>
                  </div>
                  <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

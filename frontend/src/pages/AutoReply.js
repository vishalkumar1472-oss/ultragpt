import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AutoReply({ user }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    channels: [],
    trigger_keywords: "",
    reply_template: ""
  });

  useEffect(() => {
    loadRules();
    loadLogs();
  }, []);

  const loadRules = async () => {
    try {
      const response = await axios.get(`${API}/auto-reply/rules`, {
        withCredentials: true
      });
      setRules(response.data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API}/auto-reply/logs`, {
        withCredentials: true
      });
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  };

  const createRule = async () => {
    if (!newRule.rule_name || !newRule.reply_template) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(
        `${API}/auto-reply/rules`,
        {
          rule_name: newRule.rule_name,
          channels: newRule.channels,
          trigger_keywords: newRule.trigger_keywords.split(",").map(k => k.trim()),
          reply_template: newRule.reply_template
        },
        { withCredentials: true }
      );
      toast.success("Rule created successfully");
      setShowCreateDialog(false);
      setNewRule({ rule_name: "", channels: [], trigger_keywords: "", reply_template: "" });
      loadRules();
    } catch (error) {
      toast.error("Failed to create rule");
    }
  };

  const toggleRule = async (ruleId, isEnabled) => {
    try {
      await axios.put(
        `${API}/auto-reply/rules/${ruleId}`,
        { is_enabled: !isEnabled },
        { withCredentials: true }
      );
      loadRules();
    } catch (error) {
      toast.error("Failed to update rule");
    }
  };

  const deleteRule = async (ruleId) => {
    try {
      await axios.delete(`${API}/auto-reply/rules/${ruleId}`, {
        withCredentials: true
      });
      toast.success("Rule deleted");
      loadRules();
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleChannelToggle = (channel) => {
    setNewRule(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f0f10]' : 'bg-gray-50'}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Auto Reply & Automation</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Manage WhatsApp, Instagram & SMS auto-replies</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Rule
            </Button>
            <Button onClick={() => navigate("/chat")} variant="outline">
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rules Section */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Active Rules</h2>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{rule.rule_name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rule.channels.map(channel => (
                          <span key={channel} className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-full">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={() => toggleRule(rule.id, rule.is_enabled)}
                    />
                  </div>
                  <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    <strong>Keywords:</strong> {rule.trigger_keywords.join(", ")}
                  </p>
                  <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    <strong>Reply:</strong> {rule.reply_template}
                  </p>
                  <Button
                    onClick={() => deleteRule(rule.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Logs Section */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Auto-Replies</h2>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-500 text-xs rounded-full">
                        {log.channel}
                      </span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>From: {log.from_user}</p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      Msg: "{log.message_text}"
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      Reply: "{log.reply_text}"
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Auto-Reply Rule</DialogTitle>
            <DialogDescription>
              Set up automatic replies for WhatsApp, Instagram, or SMS
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                placeholder="e.g., Office Hours Auto-Reply"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Channels</label>
              <div className="flex space-x-4">
                {['whatsapp', 'instagram', 'sms'].map(channel => (
                  <label key={channel} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRule.channels.includes(channel)}
                      onChange={() => handleChannelToggle(channel)}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Trigger Keywords (comma-separated)</label>
              <Input
                value={newRule.trigger_keywords}
                onChange={(e) => setNewRule({ ...newRule, trigger_keywords: e.target.value })}
                placeholder="price, available, order"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reply Template</label>
              <Textarea
                value={newRule.reply_template}
                onChange={(e) => setNewRule({ ...newRule, reply_template: e.target.value })}
                placeholder="Thanks for your message! I'll get back to you soon."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createRule}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

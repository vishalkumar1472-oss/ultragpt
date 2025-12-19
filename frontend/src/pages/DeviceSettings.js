import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
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

export default function DeviceSettings({ user }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [showNewKey, setShowNewKey] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await axios.get(`${API}/device/list`, {
        withCredentials: true
      });
      setDevices(response.data);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  const registerDevice = async () => {
    if (!newDeviceName.trim()) {
      toast.error("Please enter device name");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/device/register`,
        null,
        {
          params: { device_name: newDeviceName },
          withCredentials: true
        }
      );
      setShowNewKey(response.data);
      setNewDeviceName("");
      loadDevices();
      toast.success("Device registered successfully");
    } catch (error) {
      toast.error("Failed to register device");
    }
  };

  const deleteDevice = async (deviceId) => {
    try {
      await axios.delete(`${API}/device/${deviceId}`, {
        withCredentials: true
      });
      toast.success("Device deleted");
      loadDevices();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete device");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f0f10]' : 'bg-gray-50'}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Device & API Settings</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Manage Android devices & API keys</p>
          </div>
          <Button onClick={() => navigate("/chat")} variant="outline">
            Back to Chat
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Register New Device */}
        <div className={`p-6 rounded-xl border mb-8 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Register New Device</h2>
          <div className="flex space-x-3">
            <Input
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              placeholder="Device name (e.g., My Android Phone)"
              className="flex-1"
            />
            <Button onClick={registerDevice}>
              Generate API Key
            </Button>
          </div>
          
          {showNewKey && (
            <div className={`mt-4 p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-900 border-green-500' : 'bg-green-50 border-green-500'}`}>
              <p className="text-sm font-medium text-green-600 mb-2">✅ Device Registered Successfully!</p>
              <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                <strong>IMPORTANT:</strong> Save this API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center space-x-2">
                <code className={`flex-1 p-2 rounded text-xs break-all ${theme === 'dark' ? 'bg-slate-800 text-green-400' : 'bg-white text-green-700'}`}>
                  {showNewKey.api_key}
                </code>
                <Button size="sm" onClick={() => copyToClipboard(showNewKey.api_key)}>
                  Copy
                </Button>
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNewKey(null)}>
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Device List */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Your Devices</h2>
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-500' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {device.device_name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {device.platform} • Registered {new Date(device.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 mt-3 p-2 rounded ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}`}>
                      <code className={`text-xs flex-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                        {device.api_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(device.api_key)}
                        className={`p-1 hover:bg-slate-800 rounded`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={() => setDeleteConfirm(device.id)}
                    variant="outline"
                    size="sm"
                    className="ml-4 text-red-500 border-red-500"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className={`mt-8 p-6 rounded-xl border ${theme === 'dark' ? 'bg-blue-950/20 border-blue-500' : 'bg-blue-50 border-blue-200'}`}>
          <h3 className="text-lg font-semibold mb-3 text-blue-600">How to use API Keys</h3>
          <ol className={`space-y-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
            <li>1. Copy your device API key from above</li>
            <li>2. In your Android app, add the key to settings</li>
            <li>3. The app will use this key to access:
              <ul className="ml-6 mt-1 list-disc">
                <li>Voice assistant commands (/api/assistant/interpret)</li>
                <li>Call translation (/api/call/translate)</li>
                <li>Auto-answer calls (/api/call/auto-answer)</li>
                <li>Auto-reply messages (/api/auto-reply/suggest)</li>
              </ul>
            </li>
          </ol>
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this device and revoke its API key. The Android app will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDevice(deleteConfirm)} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

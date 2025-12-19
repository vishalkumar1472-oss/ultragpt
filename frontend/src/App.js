import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import RefundPolicy from "./pages/Refund-policy";
import DeliveryPolicy from "./pages/delivery-policy";
import Contact from "./pages/contact";
import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Plans from "./pages/Plans";
import AssistantActions from "./pages/AssistantActions";
import CallLogs from "./pages/CallLogs";
import AutoReply from "./pages/AutoReply";
import DeviceSettings from "./pages/DeviceSettings";
import Landing from "./pages/Landing";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      await processSession(sessionId);
      window.location.hash = '';
      return;
    }

    // Check existing session
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.log("Not authenticated");
    } finally {
      setLoading(false);
    }
  };

  const processSession = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/session`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const userResponse = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        setUser(userResponse.data);
        toast.success("Successfully logged in!");
      }
    } catch (error) {
      console.error("Session processing error:", error);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
  {/* Public Routes */}
  <Route path="/" element={user ? <Navigate to="/chat" /> : <Landing />} />
  <Route path="/terms" element={<Terms />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/refund-policy" element={<RefundPolicy />} />
  <Route path="/delivery-policy" element={<DeliveryPolicy />} />
  <Route path="/contact" element={<Contact />} />

  {/* Protected Routes */}
  <Route path="/chat" element={user ? <Chat user={user} setUser={setUser} logout={logout} /> : <Navigate to="/" />} />
  <Route path="/plans" element={user ? <Plans user={user} setUser={setUser} /> : <Navigate to="/" />} />
  <Route path="/assistant-actions" element={user ? <AssistantActions user={user} /> : <Navigate to="/" />} />
  <Route path="/call-logs" element={user ? <CallLogs user={user} /> : <Navigate to="/" />} />
  <Route path="/auto-reply" element={user ? <AutoReply user={user} /> : <Navigate to="/" />} />
  <Route path="/device-settings" element={user ? <DeviceSettings user={user} /> : <Navigate to="/" />} />

  {/* Admin Routes */}
  <Route path="/admin-954x-super" element={<AdminLogin />} />
  <Route path="/admin-954x-super/dashboard" element={<Admin user={user} logout={logout} />} />
</Routes>

        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;

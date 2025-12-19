import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Admin({ user, logout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState({});

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const addCredits = async (userId) => {
    const credits = parseInt(creditsToAdd[userId] || 0);
    if (credits === 0) return;

    try {
      await axios.post(`${API}/admin/add-credits`, 
        { user_id: userId, credits },
        { withCredentials: true }
      );
      toast.success(`Added ${credits} credits`);
      loadUsers();
      setCreditsToAdd({ ...creditsToAdd, [userId]: "" });
    } catch (error) {
      toast.error("Failed to add credits");
    }
  };

  const banUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/ban-user/${userId}`, {}, {
        withCredentials: true
      });
      toast.success("User banned");
      loadUsers();
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const unbanUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/unban-user/${userId}`, {}, {
        withCredentials: true
      });
      toast.success("User unbanned");
      loadUsers();
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Admin Panel</h1>
              <p className="text-sm text-slate-400">UltraGPT Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button data-testid="back-to-chat-btn" onClick={() => window.location.href = '/chat'} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Back to Chat
            </Button>
            <Button data-testid="admin-logout-btn" onClick={logout} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Total Users</span>
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_users}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Total Chats</span>
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_chats}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Total Messages</span>
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.total_messages}</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Today's Chats</span>
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{stats.daily_chats}</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Users Management</h2>
            <Input
              data-testid="search-users-input"
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Credits</TableHead>
                  <TableHead className="text-slate-400">Usage</TableHead>
                  <TableHead className="text-slate-400">Plan</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`} className="border-slate-800">
                    <TableCell className="text-white">
                      <div className="flex items-center space-x-3">
                        <img src={u.picture || 'https://via.placeholder.com/40'} alt={u.name} className="w-8 h-8 rounded-full" />
                        <span>{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{u.email}</TableCell>
                    <TableCell className="text-slate-300">{u.credits}</TableCell>
                    <TableCell className="text-slate-300">{u.daily_usage}/50</TableCell>
                    <TableCell className="text-slate-300">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs">
                        {u.plan_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded-full text-xs">Banned</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">Active</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          data-testid={`credits-input-${u.id}`}
                          type="number"
                          placeholder="Credits"
                          value={creditsToAdd[u.id] || ""}
                          onChange={(e) => setCreditsToAdd({ ...creditsToAdd, [u.id]: e.target.value })}
                          className="w-20 bg-slate-900 border-slate-700 text-white text-sm"
                        />
                        <Button 
                          data-testid={`add-credits-btn-${u.id}`}
                          onClick={() => addCredits(u.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Add
                        </Button>
                        {u.is_banned ? (
                          <Button 
                            data-testid={`unban-btn-${u.id}`}
                            onClick={() => unbanUser(u.id)}
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-400 hover:bg-green-600/20"
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button 
                            data-testid={`ban-btn-${u.id}`}
                            onClick={() => banUser(u.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            Ban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

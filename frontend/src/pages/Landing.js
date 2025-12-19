import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

const REDIRECT_URL = encodeURIComponent(window.location.origin + "/chat");
const AUTH_BASE = process.env.REACT_APP_AUTH_URL || "https://auth.emergentagent.com";
const AUTH_URL = `${AUTH_BASE}/?redirect=${REDIRECT_URL}`;

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="pt-8 px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">UltraGPT</span>
            </div>
            <Button 
              data-testid="header-signin-btn"
              onClick={() => window.location.href = AUTH_URL}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-all duration-300 hover:scale-105"
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-8 pt-32 pb-20">
          <div className="text-center space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              AI Chat
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed" style={{fontFamily: 'Inter, sans-serif'}}>
              Experience the next generation of AI conversations. Powered by GPT-4o with streaming responses, smart context, and beautiful design.
            </p>

            <div className="flex items-center justify-center space-x-4 pt-8">
              <Button 
                data-testid="hero-getstarted-btn"
                onClick={() => window.location.href = AUTH_URL}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                Get Started Free
              </Button>
              <Button 
                data-testid="hero-learnmore-btn"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-full transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-600/50 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Lightning Fast</h3>
              <p className="text-slate-400" style={{fontFamily: 'Inter, sans-serif'}}>Real-time streaming responses with GPT-4o. No waiting, just instant intelligence.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-600/50 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Secure & Private</h3>
              <p className="text-slate-400" style={{fontFamily: 'Inter, sans-serif'}}>Google OAuth authentication. Your conversations are encrypted and private.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-pink-600/50 transition-all duration-300">
              <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Chat History</h3>
              <p className="text-slate-400" style={{fontFamily: 'Inter, sans-serif'}}>All your conversations saved and accessible. Pick up where you left off.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

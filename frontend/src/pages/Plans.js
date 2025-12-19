import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// 🔥 Complete and corrected Plans Data
const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "/month",
    features: ["50 daily credits", "5MB upload", "Gemini Lite / DeepSeek mini", "Standard support"]
  },
  {
    id: "plus",
    name: "Plus",
    price: 179,
    period: "/month",
    features: [
      "250 daily credits",
      "20MB upload",
      "Gemini Flash + Groq Llama3-8B",
      "AI Voice Chat",
      "Priority Responses"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 379,
    period: "/month",
    features: [
      "600 daily credits",
      "50MB upload",
      "Llama3-70B + Gemini Pro + DeepSeek-V2",
      "Vision + File Models",
      "Turbo Speed Mode"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: 1999,
    period: "/year",
    features: [
      "2000 monthly credits + rollover",
      "100MB upload",
      "⚡ All Advanced Models + Future Access",
      "VIP Priority Line",
      "Voice + Vision + High-cap files"
    ]
  }
];

export default function Plans({ user, setUser }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleUpgrade = async (planId, price) => {
    if (price === 0) {
      toast.info("You're already on the Free plan");
      return;
    }

    toast.info(`Razorpay payment coming soon for ${planId} plan!`);
    return;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#0f0f10]" : "bg-gray-50"}`}>
      <header className={`border-b ${theme === "dark" ? "border-slate-800 bg-slate-950" : "border-gray-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              UltraGPT Plans
            </span>
          </div>

          <Button onClick={() => navigate("/chat")} variant="outline">
            Back to Chat
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1
            className={`text-4xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Choose Your Plan
          </h1>
          <p className={`text-lg ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
            Current Plan:{" "}
            <span className="font-semibold text-blue-500">
              {user?.plan_type?.toUpperCase() || "FREE"}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border-2 ${
                user.plan_type === plan.id
                  ? "border-blue-500 bg-blue-500/10"
                  : theme === "dark"
                  ? "border-slate-800 bg-slate-950"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {plan.name}
              </h3>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  ₹{plan.price}
                </span>
                <span className={theme === "dark" ? "text-slate-400" : "text-gray-600"}>{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className={`flex items-start ${theme === "dark" ? "text-slate-300" : "text-gray-700"}`}>
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id, plan.price)}
                disabled={user.plan_type === plan.id}
                className="w-full"
                variant={user.plan_type === plan.id ? "outline" : "default"}
              >
                {user.plan_type === plan.id ? "Current Plan" : "Upgrade"}
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

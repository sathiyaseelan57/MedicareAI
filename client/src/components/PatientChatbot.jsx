import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Activity, HeartPulse } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const PatientChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I am your MediGuide AI. How can I help you with your health data today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };

    // Format history for the AI: Convert your local state to API format
    const chatHistory = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await api.post(`/ai/ai-chat/${user._id}`, {
        query: input,
        history: chatHistory, // Send the history here!
      });

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      toast.error("Connection lost");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end font-sans">
      {/* --- CHAT WINDOW --- */}
      {isOpen && (
        <div className="mb-4 w-[90vw] md:w-96 h-[500px] bg-base-100 border border-base-300 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header - Uses Primary Theme Color */}
          <div className="bg-primary p-6 text-primary-content flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                <HeartPulse size={22} />
              </div>
              <div>
                <h4 className="font-black text-base tracking-tight leading-none">
                  MediGuide AI
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                  <span className="text-[10px] opacity-80 uppercase tracking-[0.15em] font-black">
                    Ready to help
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-2 rounded-2xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area - Adaptive Background */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-base-100 no-scrollbar"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "ai" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-sm ${
                    m.role === "ai"
                      ? "bg-base-200 text-base-content rounded-tl-none border border-base-300"
                      : "bg-primary text-primary-content rounded-tr-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Loading Animation */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 p-4 rounded-[1.8rem] rounded-tl-none border border-base-300">
                  <span className="loading loading-dots loading-xs text-primary"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Theme Aware */}
          <form
            onSubmit={sendMessage}
            className="p-4 bg-base-200/50 backdrop-blur-sm border-t border-base-300 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input input-bordered w-full bg-base-100 rounded-2xl focus:outline-primary border-base-300 text-sm font-medium"
              placeholder="Type your health question..."
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-square rounded-2xl shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* --- TOGGLE BUTTON (FAB) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-circle btn-lg h-16 w-16 shadow-2xl transition-all duration-500 transform hover:scale-105 border-none ${
          isOpen ? "btn-neutral rotate-180" : "btn-primary"
        }`}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
      </button>
    </div>
  );
};

export default PatientChatbot;

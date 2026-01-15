"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWeb3 } from "../contexts/Web3Context";
import Link from "next/link";

// Quick action suggestions for users
const QUICK_ACTIONS = [
  {
    label: "🚀 How to start trading?",
    query: "I'm new here. How do I start trading green credits?",
  },
  {
    label: "💰 Get test tokens",
    query: "How do I get mUSDC tokens for testing?",
  },
  {
    label: "📊 Show active pools",
    query: "What liquidity pools are available and their reserves?",
  },
  {
    label: "🔄 Swap vs Orderbook?",
    query: "What's the difference between AMM swap and orderbook trading?",
  },
  {
    label: "🌱 Credit types",
    query: "What types of environmental credits can I trade?",
  },
  {
    label: "📈 Best trade now?",
    query: "Based on current market data, what trades would you suggest?",
  },
];

// Enhanced floating chat with markdown support and better UI
export default function AIChatFloating() {
  const { provider, signer, isConnected, account } = useWeb3();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastConfidence, setLastConfidence] = useState(null);
  const [hasRealData, setHasRealData] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const AI_API_ROUTE = "/api/ai";

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = async (customInput = null) => {
    const messageText = customInput || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: "user", content: messageText };

    // Build conversation history for context
    const conversationHistory = messages.map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));
    conversationHistory.push(userMsg);

    setMessages((m) => [...m, { from: "user", text: messageText }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(AI_API_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          walletConnected: isConnected,
          userAddress: account || null,
        }),
      });

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const res = await resp.json();

      // Extract text from API response
      let text = "";
      if (res?.text) {
        text = res.text;
      } else if (res?.error) {
        text = `⚠️ **Error:** ${res.error}`;
      } else {
        text =
          "I received your message but couldn't generate a proper response.";
      }

      // Store confidence and data status
      if (res?.confidence) {
        setLastConfidence(res.confidence);
      }
      if (res?.hasRealData !== undefined) {
        setHasRealData(res.hasRealData);
      }

      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text,
          confidence: res?.confidence,
          platformData: res?.platformData,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: `❌ **Error:** ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleQuickAction = (query) => {
    send(query);
  };

  const clearChat = () => {
    setMessages([]);
    setLastConfidence(null);
    setHasRealData(false);
  };

  // Confidence bar color
  const getConfidenceColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div>
      {/* Floating button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? "Close AI assistant" : "Open AI assistant"}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 font-bold text-lg ring-4 ring-emerald-400/20"
        >
          {!open ? (
            <span className="flex flex-col items-center text-xs">
              <span className="text-2xl">🤖</span>
              <span className="font-semibold">AI</span>
            </span>
          ) : (
            <span className="text-3xl font-light">×</span>
          )}
        </button>

        {/* Pulse indicator when closed */}
        {!open && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></span>
        )}
      </div>

      {/* Expanded chat panel */}
      {open && (
        <div className="fixed right-6 bottom-28 z-50 w-[380px] sm:w-[420px] md:w-[480px] h-[600px] bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <div className="font-bold text-lg">GreenAiDEX Assistant</div>
                  <div className="text-xs text-green-100 flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                        <span>Wallet Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                        <span>Connect wallet for full features</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors text-xs"
                  title="Clear chat"
                >
                  🗑️
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Data status indicator */}
            {hasRealData && (
              <div className="mt-2 text-xs bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full"></span>
                Live on-chain data connected
              </div>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-auto bg-gradient-to-b from-slate-900 to-slate-950">
            {messages.length === 0 && (
              <div className="h-full flex flex-col">
                {/* Welcome message */}
                <div className="text-center text-slate-400 px-4 mb-6">
                  <div className="text-4xl mb-4">👋</div>
                  <div className="font-semibold text-slate-200 mb-2 text-lg">
                    Welcome to GreenAiDEX!
                  </div>
                  <div className="text-sm text-slate-400">
                    I can help you navigate the platform, understand trading,
                    and provide market insights.
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-auto">
                  <div className="text-xs text-slate-500 mb-3 font-medium">
                    Quick Actions:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.query)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors border border-slate-700 hover:border-emerald-500/50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`my-3 flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 rounded-2xl shadow-lg ${
                    m.from === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm"
                  }`}
                >
                  {m.from === "user" ? (
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-white prose-strong:font-semibold prose-ul:text-slate-300 prose-li:text-slate-300 prose-code:text-emerald-400 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Confidence indicator for bot messages */}
                  {/* {m.from === "bot" && m.confidence && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Response confidence</span>
                        <span className="font-semibold text-slate-200">
                          {m.confidence}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getConfidenceColor(
                            m.confidence
                          )} transition-all duration-500`}
                          style={{ width: `${m.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start my-3">
                <div className="bg-slate-800 px-4 py-3 rounded-2xl shadow-lg border border-slate-700 rounded-bl-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">
                      Analyzing data...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-700 bg-slate-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trading, credits, or navigation..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                rows="2"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-2 text-center flex items-center justify-center gap-2">
              <span>Press Enter to send</span>
              <span className="text-slate-600">•</span>
              <span>Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

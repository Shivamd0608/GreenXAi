"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWeb3 } from "../contexts/Web3Context";

// Enhanced floating chat with markdown support and better UI
export default function AIChatFloating() {
  const { provider, signer, isConnected } = useWeb3();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const AI_API_ROUTE ="/api/ai"
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, { from: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(AI_API_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg] }),
      });

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const res = await resp.json();

      // Extract text from API response
      let text = "";
      if (res?.text) {
        text = res.text;
      } else if (res?.result?.messages) {
        const modelMessages = res.result.messages.filter(
          (m) => m.name === "model"
        );
        if (modelMessages.length) {
          text = modelMessages.map((m) => m.content).join("\n\n");
        } else {
          text = "I received your message but couldn't generate a proper response.";
        }
      } else if (res?.error) {
        text = `⚠️ **Error:** ${res.error}`;
      } else {
        text = "Received an unexpected response format.";
      }

      setMessages((m) => [...m, { from: "bot", text }]);
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

  return (
    <div>
      {/* Floating button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? "Close AI assistant" : "Open AI assistant"}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 font-bold text-lg"
        >
          {!open ? (
            <span className="flex flex-col items-center text-xs">
              <span className="text-2xl">😇</span>
              <span>AI</span>
            </span>
          ) : (
            <span className="text-3xl">×</span>
          )}
        </button>
      </div>

      {/* Expanded chat panel - MUCH BIGGER */}
      {open && (
        <div className="fixed right-6 bottom-28 z-50 w-[32rem] h-[38rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">DEX AI Assistant</div>
              <div className="text-xs text-green-100 mt-0.5">
                {isConnected ? "🟢 Wallet Connected" : "⚪ Wallet Not Connected"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 p-4 overflow-auto"
            style={{ background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)" }}
          >
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 px-6">
                  <div className="text-5xl mb-4">💬</div>
                  <div className="font-semibold text-gray-700 mb-2">
                    Welcome to DEX Assistant!
                  </div>
                  <div className="text-sm">
                    Ask me about:
                    <ul className="mt-2 text-left inline-block">
                      <li>• Token prices and pools</li>
                      <li>• Trading strategies</li>
                      <li>• Safety checks</li>
                      <li>• Route optimization</li>
                    </ul>
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
                  className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                    m.from === "user"
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-sm"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {m.from === "user" ? (
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-strong:font-bold prose-ul:text-gray-700 prose-li:text-gray-700 prose-code:text-green-700 prose-code:bg-green-50 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start my-3">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200 rounded-bl-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question... (Shift+Enter <-')"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
                rows="2"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
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
                  </span>
                ) : (
                  <>
                    Send
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              AI responses may contain errors. Always verify on-chain data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

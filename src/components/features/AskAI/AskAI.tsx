'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  isUser: boolean;
}



export default function AskAI() {
  const { } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userChatMessage]);

    try {
      // Use fetch directly instead of api.post to avoid authentication
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to chat
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: userMessage,
        response: data.response,
        timestamp: data.timestamp,
        isUser: false
      };

      setMessages(prev => [...prev, aiChatMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Determine error type and provide appropriate message
      let errorResponse = 'AI temporarily unavailable. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorResponse = 'Please log in to use the AI assistant.';
        } else if (error.message.includes('timeout')) {
          errorResponse = 'Request timed out. Please try again with a shorter question.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorResponse = 'AI service is busy. Please wait a moment and try again.';
        }
      }
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: userMessage,
        response: errorResponse,
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating AskAI Button */}
      <button
        onClick={openChat}
        className="
          fixed bottom-6 right-6 z-40
          bg-gradient-to-r from-purple-600 to-blue-600
          hover:from-purple-700 hover:to-blue-700
          text-white font-semibold
          px-4 py-3 sm:px-6 sm:py-3 rounded-full
          shadow-glass hover:shadow-glass-lg
          transition-all duration-300
          transform hover:scale-105 active:scale-95
          flex items-center gap-2
          animate-glass-shimmer
        "
        aria-label="Open AI Assistant"
      >
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className={`
          fixed z-50 transition-all duration-300 animate-fade-in
          ${isFullscreen 
            ? 'inset-0' 
            : 'bottom-6 right-6 w-80 sm:w-96 h-[400px] sm:h-[500px]'
          }
        `}>
          {/* Backdrop for fullscreen */}
          {isFullscreen && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={closeChat}
            />
          )}
          
          {/* Chat Container */}
          <div className={`
            relative bg-glass backdrop-blur-md rounded-xl border border-glass shadow-glass
            ${isFullscreen 
              ? 'w-full max-w-4xl h-full max-h-[90vh] m-auto mt-[5vh]' 
              : 'w-full h-full'
            }
            flex flex-col overflow-hidden animate-slide-in
          `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-glass">
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5 text-purple-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                  <p className="text-xs text-gray-400">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-dark"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
                
                {/* Close Button */}
                <button
                  onClick={closeChat}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-dark"
                  aria-label="Close chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Content Area */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="bg-glass-dark rounded-full p-4 mb-4">
                    <svg 
                      className="w-8 h-8 text-purple-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
                  <p className="text-gray-400 mb-6 max-w-sm">
                    Welcome! I&apos;m here to help you with questions about the career guidance program. 
                    Start a conversation below.
                  </p>
                  
                  {/* Ready Status */}
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 text-center">
                      <p className="text-green-300 text-sm">✅ Ready to chat! No login required.</p>
                    </div>
                    
                    {/* Quick Start Prompts */}
                    <div className="text-left">
                      <p className="text-sm text-gray-400 mb-2">Try asking:</p>
                      <div className="space-y-1">
                        {[
                          "What career opportunities are available?",
                          "How do I prepare for interviews?",
                          "Tell me about the program"
                        ].map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInputMessage(prompt)}
                            className="block w-full text-left text-xs text-purple-300 hover:text-purple-200 bg-glass-dark hover:bg-glass rounded px-2 py-1 transition-colors"
                          >
                            &quot;{prompt}&quot;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {/* User Message */}
                      {msg.isUser && (
                        <div className="flex justify-end mb-2">
                          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%] break-words">
                            {msg.message}
                          </div>
                        </div>
                      )}
                      
                      {/* AI Response */}
                      {!msg.isUser && (
                        <div className="flex justify-start">
                          <div className="bg-glass-dark border border-glass rounded-lg px-4 py-2 max-w-[80%] break-words">
                            <div className="text-white whitespace-pre-wrap">{msg.response}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-glass-dark border border-glass rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-gray-400 text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Chat Input Area */}
            <div className="p-4 border-t border-glass">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="
                    flex-1 bg-glass-dark border border-glass rounded-lg px-4 py-2
                    text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="
                    bg-gradient-to-r from-purple-600 to-blue-600
                    hover:from-purple-700 hover:to-blue-700
                    disabled:from-gray-600 disabled:to-gray-600
                    text-white px-4 py-2 rounded-lg
                    transition-all duration-200
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
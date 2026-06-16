'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Xin chào! Tôi là trợ lý AI y tế của MediBuk. 

Tôi có thể giúp bạn:
• Hướng dẫn đặt lịch khám bệnh
• Tư vấn triệu chứng và gợi ý chuyên khoa
• Tìm bệnh viện và bác sĩ phù hợp
• Giải đáp thắc mắc về MediBuk

Bạn cần giúp gì hôm nay?`,
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'Hướng dẫn đặt lịch khám',
  'Tôi bị đau đầu và sốt',
  'Tìm bệnh viện gần tôi',
  'Bệnh viện Bạch Mai có bác sĩ nào?',
];

// Doraemon Avatar using uploaded image
function DoraemonIcon({ size = 56 }: { size?: number }) {
  return (
    <img
      src="/images/Dora.png"
      alt="Doraemon Y tế"
      width={size}
      height={size}
      className="object-contain mix-blend-multiply"
      style={{ width: size, height: size }}
    />
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {}
            }
          }
        }
      }

      if (fullContent) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button with Doraemon */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Hover Tooltip */}
        {!isOpen && isHovered && (
          <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200 text-sm font-medium text-slate-700 animate-fadeIn">
            <span className="text-primary font-bold">Hãy ấn vào tôi để được hỗ trợ!</span>
            <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-white border-r border-b border-slate-200" />
          </div>
        )}
        
        {/* Doraemon Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'h-14 w-14 rounded-full bg-slate-600 hover:bg-slate-700'
              : 'hover:scale-110'
          }`}
          aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <DoraemonIcon size={140} />
              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 z-50 w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00A1E9] to-[#0088CC] px-5 py-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              <DoraemonIcon size={48} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">Doraemon Y Tế</h3>
              <p className="text-sky-100 text-xs">Trợ lý AI MediBuk • Sẵn sàng hỗ trợ</p>
            </div>
            <div className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-slate-200'
                      : 'bg-[#00A1E9]/10 overflow-hidden'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4 text-slate-600" />
                    ) : (
                      <DoraemonIcon size={36} />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-[#00A1E9]/10 overflow-hidden">
                    <DoraemonIcon size={36} />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-slate-100 text-slate-800 rounded-tl-sm">
                    <div className="whitespace-pre-wrap">{streamingContent}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-[#00A1E9]/10 overflow-hidden">
                    <DoraemonIcon size={36} />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-slate-100">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-[#00A1E9]/10 text-slate-600 hover:text-[#00A1E9] rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 max-h-20"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="h-10 w-10 rounded-xl bg-primary hover:bg-sky-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

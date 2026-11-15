import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  UserCheck,
  Sparkles,
  Loader2,
  ChevronDown,
  RotateCcw,
  Headphones,
  Minus,
} from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { Message } from '../../types';

interface CustomerChatWidgetProps {
  isOpenExternally?: boolean;
  onCloseExternal?: () => void;
}

const INITIAL_GREETING: Message = {
  id: 'welcome-1',
  sender: 'ai',
  text: '👋 Hi there! Welcome to Acme Support, powered by DeskPilot AI. How can we help you today?',
  timestamp: 'Just now',
  senderName: 'DeskPilot AI',
};

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({
  isOpenExternally,
  onCloseExternal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpenExternally !== undefined) {
      setIsOpen(isOpenExternally);
    }
  }, [isOpenExternally]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isTyping, isOpen]);

  // Listen for agent replies dispatched in dashboard
  useEffect(() => {
    const handleConversationUpdate = async () => {
      if (conversationId) {
        const conv = await conversationService.getConversationById(conversationId);
        if (conv && conv.messages.length > messages.length) {
          setMessages(conv.messages);
          if (conv.ticketId) setActiveTicketId(conv.ticketId);
        }
      }
    };
    window.addEventListener('deskpilot_conversations_updated', handleConversationUpdate);
    return () => window.removeEventListener('deskpilot_conversations_updated', handleConversationUpdate);
  }, [conversationId, messages.length]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend || isTyping) return;

    const customerMsg: Message = {
      id: `c-msg-${Date.now()}`,
      sender: 'customer',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: 'You',
    };

    setMessages((prev) => [...prev, customerMsg]);
    if (!customText) setInputText('');
    setIsTyping(true);

    try {
      const result = await conversationService.customerChatQuery(textToSend, conversationId);
      setConversationId(result.conversation.id);

      if (result.createdTicket) {
        setActiveTicketId(result.createdTicket);
      }

      // Add AI reply
      if (result.aiReply) {
        const aiMsg: Message = {
          id: `ai-msg-${Date.now()}`,
          sender: 'ai',
          text: result.aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: 'DeskPilot AI',
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_GREETING]);
    setConversationId(undefined);
    setActiveTicketId(undefined);
    setInputText('');
  };

  const handleClose = () => {
    setIsOpen(false);
    onCloseExternal?.();
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 sm:py-3.5 bg-gradient-to-r from-[#FFB33F] to-[#E59312] text-black rounded-full shadow-[0_4px_25px_rgba(255,179,63,0.4)] hover:shadow-[0_6px_30px_rgba(255,179,63,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Open Live Chat"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-black/20" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">Live Support</span>
          <span className="hidden group-hover:inline-block text-[10px] bg-black/15 px-2 py-0.5 rounded-full font-semibold">
            Ask AI
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-[400px] h-[550px] max-h-[82vh] bg-[#14141B] border border-[#292932] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#191920] to-[#14141B] border-b border-[#292932] flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#FFB33F] to-[#E59312] flex items-center justify-center shadow-[0_0_12px_rgba(255,179,63,0.3)]">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#14141B]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">DeskPilot Assistant</h3>
                  <span className="text-[10px] bg-[#FFB33F]/20 text-[#FFB33F] px-1.5 rounded font-mono font-bold">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online & Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation session"
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClose}
                title="Close chat"
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket notification badge if created */}
          {activeTicketId && (
            <div className="px-3.5 py-1.5 bg-[#FFB33F]/10 border-b border-[#FFB33F]/25 text-[11px] text-[#FFB33F] flex items-center justify-between font-medium">
              <span>Support Ticket Created: <strong>{activeTicketId}</strong></span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Agent Alerted
              </span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-[#0B0B0F]">
            {messages.map((msg) => {
              const isMe = msg.sender === 'customer';
              const isAI = msg.sender === 'ai';
              const isAgent = msg.sender === 'agent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 px-1">
                    {isAI && <Sparkles className="w-2.5 h-2.5 text-[#FFB33F]" />}
                    {isAgent && <UserCheck className="w-2.5 h-2.5 text-emerald-400" />}
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-[#FFB33F] text-black font-semibold rounded-tr-sm shadow-sm'
                        : isAgent
                        ? 'bg-[#1C261E] border border-emerald-500/30 text-white rounded-tl-sm'
                        : 'bg-[#191920] border border-[#292932] text-gray-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#FFB33F] bg-[#191920] border border-[#292932] p-2.5 rounded-xl w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>DeskPilot is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Demo Quick Prompts */}
          <div className="px-3 py-2 bg-[#14141B] border-t border-[#292932] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">Demo:</span>
            <button
              onClick={() => handleSend('My payment was deducted but my order was not confirmed.')}
              className="text-[10px] px-2.5 py-1 rounded-md bg-[#191920] hover:bg-[#21212B] hover:border-[#FFB33F]/50 hover:text-[#FFB33F] text-gray-300 border border-[#292932] shrink-0 whitespace-nowrap cursor-pointer transition-colors"
            >
              Payment deducted (P1)
            </button>
            <button
              onClick={() => handleSend('ORD-1024')}
              className="text-[10px] px-2.5 py-1 rounded-md bg-[#191920] hover:bg-[#21212B] hover:border-[#FFB33F]/50 hover:text-[#FFB33F] text-gray-300 border border-[#292932] shrink-0 whitespace-nowrap cursor-pointer transition-colors"
            >
              Order ORD-1024
            </button>
            <button
              onClick={() => handleSend('Can I speak with a human support agent please?')}
              className="text-[10px] px-2.5 py-1 rounded-md bg-[#191920] hover:bg-[#21212B] hover:border-[#FFB33F]/50 hover:text-[#FFB33F] text-gray-300 border border-[#292932] shrink-0 whitespace-nowrap cursor-pointer transition-colors"
            >
              Request Human
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#14141B] border-t border-[#292932]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about orders, refunds, billing..."
                className="flex-1 bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-[#FFB33F] hover:bg-[#F5A623] disabled:opacity-50 text-black flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-[#FFB33F]" />
                Powered by DeskPilot AI
              </span>
              <button
                type="button"
                onClick={() => handleSend('I need human assistance with my account.')}
                className="text-[#FFB33F] hover:underline cursor-pointer font-medium"
              >
                Request Human Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

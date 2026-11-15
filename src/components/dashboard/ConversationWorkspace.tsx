import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  UserCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Globe,
  Loader2,
  CheckCheck,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Tag,
} from 'lucide-react';
import { Conversation, Message } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { AICopilotPanel } from './AICopilotPanel';
import { conversationService } from '../../services/conversationService';
import { useToast } from '../../contexts/ToastContext';

interface ConversationWorkspaceProps {
  conversation: Conversation;
  onConversationUpdated: (updated: Conversation) => void;
  onToggleTicketPanel?: () => void;
  isTicketPanelOpen?: boolean;
  onBackToList?: () => void;
}

export const ConversationWorkspace: React.FC<ConversationWorkspaceProps> = ({
  conversation,
  onConversationUpdated,
  onToggleTicketPanel,
  isTicketPanelOpen = true,
  onBackToList,
}) => {
  const { success, error } = useToast();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isAiResponding]);

  // Handle Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    try {
      const sender = 'agent';
      const senderName = 'Rahul Sharma';

      const newMsg = await conversationService.sendMessage(
        conversation.id,
        textToSend,
        sender,
        senderName
      );

      setInputText('');

      const updatedConv: Conversation = {
        ...conversation,
        lastMessage: textToSend,
        lastMessageTime: 'Just now',
        messages: [...conversation.messages, newMsg],
      };

      onConversationUpdated(updatedConv);
    } catch (err) {
      error('Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Take Over Conversation
  const handleTakeover = async () => {
    setIsTakingOver(true);
    try {
      const updated = await conversationService.takeoverConversation(conversation.id, 'Rahul Sharma');
      onConversationUpdated(updated);
      success('You took over this conversation. AI responses paused.');
    } catch {
      error('Failed to take over conversation.');
    } finally {
      setIsTakingOver(false);
    }
  };

  // Handle Hand Back to AI
  const handleHandback = async () => {
    setIsTakingOver(true);
    try {
      const updated = await conversationService.handbackToAI(conversation.id);
      onConversationUpdated(updated);
      success('Conversation handed back to DeskPilot AI autopilot.');
    } catch {
      error('Failed to hand back to AI.');
    } finally {
      setIsTakingOver(false);
    }
  };

  // Handle Send Suggestion from Copilot Panel
  const handleSendSuggestion = async () => {
    if (!conversation.suggestedReply) return;
    setIsSending(true);
    try {
      const msg = await conversationService.sendSuggestedReply(conversation.id);
      if (msg) {
        onConversationUpdated({
          ...conversation,
          lastMessage: msg.text,
          lastMessageTime: 'Just now',
          messages: [...conversation.messages, msg],
          suggestedReply: undefined,
        });
        success('Suggested AI reply sent to customer!');
      }
    } catch {
      error('Could not send suggested reply.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Edit Suggestion
  const handleEditSuggestion = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0B0F] min-w-0">
      {/* Workspace Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#14141B] border-b border-[#292932] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Back button */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <img
            src={conversation.customerAvatar}
            alt={conversation.customerName}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#292932] shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                {conversation.customerName}
              </h2>
              <PriorityBadge priority={conversation.priority} size="sm" />
              <StatusBadge status={conversation.status} size="sm" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-gray-400 mt-0.5">
              <span className="truncate max-w-[150px] sm:max-w-none">{conversation.customerEmail}</span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] bg-[#191920] px-1.5 py-0.5 rounded border border-[#292932]">
                <Globe className="w-2.5 h-2.5 text-gray-400" />
                {conversation.language}
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Ticket Toggle */}
        <div className="flex items-center gap-2">
          {conversation.isHumanHandled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHandback}
              isLoading={isTakingOver}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FFB33F]" />}
            >
              <span className="hidden sm:inline">Hand Back to AI</span>
              <span className="sm:hidden">AI Autopilot</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleTakeover}
              isLoading={isTakingOver}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Take Over Conversation</span>
              <span className="sm:hidden">Take Over</span>
            </Button>
          )}

          {/* Toggle Right Ticket Inspector */}
          {onToggleTicketPanel && (
            <button
              onClick={onToggleTicketPanel}
              title={isTicketPanelOpen ? 'Hide ticket details' : 'Show ticket details'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isTicketPanelOpen
                  ? 'bg-[#191920] border-[#FFB33F]/40 text-[#FFB33F]'
                  : 'bg-[#191920] border-[#292932] text-gray-400 hover:text-white'
              }`}
            >
              {isTicketPanelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Human Takeover Banner */}
      {conversation.isHumanHandled ? (
        <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2 truncate">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">
              Human Agent Active: {conversation.assignedAgent || 'Rahul Sharma'} is handling this chat.
            </span>
          </div>
          <span className="text-[11px] text-emerald-300/80 shrink-0 ml-2">AI Paused</span>
        </div>
      ) : (
        <div className="px-4 sm:px-6 py-2 bg-[#FFB33F]/10 border-b border-[#FFB33F]/20 flex items-center justify-between text-xs text-[#FFB33F]">
          <div className="flex items-center gap-2 truncate">
            <Bot className="w-4 h-4 text-[#FFB33F] shrink-0" />
            <span className="font-semibold">DeskPilot AI Autopilot Active</span>
            <span className="hidden md:inline text-[11px] text-gray-400">
              — Automated responses enabled based on indexed knowledge base.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FFB33F]/20 border border-[#FFB33F]/30 shrink-0 ml-2">
            Autonomous
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {conversation.messages.map((msg) => {
          const isCustomer = msg.sender === 'customer';
          const isAI = msg.sender === 'ai';
          const isAgent = msg.sender === 'agent';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
            >
              {/* Sender name & time */}
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-gray-400 px-1">
                {isAI && <Bot className="w-3 h-3 text-[#FFB33F]" />}
                {isAgent && <UserCheck className="w-3 h-3 text-emerald-400" />}
                <span className="font-medium text-gray-300">
                  {msg.senderName || (isCustomer ? conversation.customerName : isAI ? 'DeskPilot AI' : 'Agent')}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed break-words shadow-sm ${
                  isCustomer
                    ? 'bg-[#191920] border border-[#292932] text-gray-100 rounded-tl-sm'
                    : isAI
                    ? 'bg-gradient-to-r from-[#211E16] to-[#1E1914] border border-[#FFB33F]/30 text-white rounded-tr-sm shadow-[0_0_15px_rgba(255,179,63,0.07)]'
                    : 'bg-[#1C261E] border border-emerald-500/30 text-white rounded-tr-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* Status receipt */}
              {!isCustomer && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 px-1">
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>Delivered</span>
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAiResponding && (
          <div className="flex items-center gap-2 p-3 bg-[#191920] border border-[#292932] rounded-xl w-fit text-xs text-[#FFB33F]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>DeskPilot AI is retrieving knowledge base & generating reply...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Copilot Suggestion Box */}
      <AICopilotPanel
        suggestedReply={conversation.suggestedReply}
        onSendSuggestion={handleSendSuggestion}
        onEditSuggestion={handleEditSuggestion}
        isSending={isSending}
      />

      {/* Message Composer */}
      <div className="p-3 sm:p-4 bg-[#14141B] border-t border-[#292932]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              conversation.isHumanHandled
                ? 'Type your message to customer as Rahul Sharma (Enter to send)...'
                : 'Send human message (will notify customer)...'
            }
            className="flex-1 bg-[#191920] border border-[#292932] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputText.trim()}
            isLoading={isSending}
            rightIcon={<Send className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, Send, Edit3, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface AICopilotPanelProps {
  suggestedReply?: {
    text: string;
    sources: string[];
    confidence: number;
  };
  onSendSuggestion: () => void;
  onEditSuggestion: (text: string) => void;
  isSending?: boolean;
}

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  suggestedReply,
  onSendSuggestion,
  onEditSuggestion,
  isSending = false,
}) => {
  if (!suggestedReply) {
    return (
      <div className="p-4 bg-[#14141B] border-t border-[#292932] text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFB33F]" />
          <span>AI Copilot is monitoring conversation. Awaiting customer reply...</span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">Autopilot Standby</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-b from-[#1C1A14] to-[#14141B] border-t-2 border-[#FFB33F]/40 shadow-inner">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#FFB33F]/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB33F]" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            AI Copilot Suggested Reply
          </span>
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{suggestedReply.confidence}% Confidence</span>
        </div>
      </div>

      {/* Suggested text */}
      <div className="p-3 bg-[#191920] border border-[#292932] rounded-xl text-xs text-gray-200 leading-relaxed mb-3">
        "{suggestedReply.text}"
      </div>

      {/* Sources retrieved */}
      {suggestedReply.sources && suggestedReply.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-[#FFB33F]" />
            KB Sources:
          </span>
          {suggestedReply.sources.map((src, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[10px] bg-[#21212B] text-gray-300 rounded border border-[#292932]"
            >
              {src}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditSuggestion(suggestedReply.text)}
          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
        >
          Edit in Composer
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSendSuggestion}
          isLoading={isSending}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send Suggestion
        </Button>
      </div>
    </div>
  );
};

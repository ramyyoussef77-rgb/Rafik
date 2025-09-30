import React from 'react';
import { Message, Sender } from '../types';
import EditIcon from './icons/EditIcon';
import CopyIcon from './icons/CopyIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import ThumbDownIcon from './icons/ThumbDownIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ChatBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onFeedback: (feedback: 'like' | 'dislike') => void;
  onRegenerate: (messageId: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onCopy, onFeedback, onRegenerate }) => {
  const isUser = message.sender === Sender.USER;
  
  const bubbleClasses = isUser
    ? 'bg-[#c5cae9] text-stone-800 self-end'
    : 'bg-stone-200 text-stone-800 self-start';

  const ActionButton: React.FC<{ onClick: () => void; tooltip: string; children: React.ReactNode }> = ({ onClick, tooltip, children }) => (
    <button
      onClick={onClick}
      title={tooltip}
      className="text-stone-500 hover:text-[#283593] transition-colors"
      aria-label={tooltip}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl mb-2 shadow-sm break-words ${bubbleClasses}`}
      >
        {message.text}
      </div>
      {!isUser && (
        <div className="flex items-center gap-3 px-2 text-sm text-stone-500">
           <ActionButton onClick={() => alert('تعديل الرد قادم قريبًا')} tooltip="تعديل">
            <EditIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onCopy(message.text)} tooltip="نسخ">
            <CopyIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => alert('القراءة الصوتية قادمة في التحديث القادم')} tooltip="اقرأ بصوتي">
            <VolumeUpIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onFeedback('like')} tooltip="أعجبني">
            <ThumbUpIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onFeedback('dislike')} tooltip="لم يعجبني">
            <ThumbDownIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onRegenerate(message.id)} tooltip="أعد الإجابة">
            <RefreshIcon className="w-5 h-5" />
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;

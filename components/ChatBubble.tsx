import React from 'react';
import { Message, Sender } from '../types';
import EditIcon from './icons/EditIcon';
import CopyIcon from './icons/CopyIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import ThumbDownIcon from './icons/ThumbDownIcon';
import RefreshIcon from './icons/RefreshIcon';
import StopCircleIcon from './icons/StopCircleIcon';

interface ChatBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onFeedback: (feedback: 'like' | 'dislike') => void;
  onRegenerate: (messageId: string) => void;
  onSpeak: () => void;
  onCancel: () => void;
  isSpeaking: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onCopy, onFeedback, onRegenerate, onSpeak, onCancel, isSpeaking }) => {
  const isUser = message.sender === Sender.USER;
  
  const bubbleClasses = isUser
    ? 'bg-[#c5cae9] dark:bg-[#3f51b5] text-stone-800 dark:text-white self-end'
    : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 self-start';

  const ActionButton: React.FC<{ onClick: () => void; tooltip: string; children: React.ReactNode }> = ({ onClick, tooltip, children }) => (
    <button
      onClick={onClick}
      title={tooltip}
      className="text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400 transition-colors"
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
        <div className="flex items-center gap-3 px-2 text-sm text-stone-500 dark:text-stone-400">
           <ActionButton onClick={() => alert('تعديل الرد قادم قريبًا')} tooltip="تعديل">
            <EditIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onCopy(message.text)} tooltip="نسخ">
            <CopyIcon className="w-5 h-5" />
          </ActionButton>
          {isSpeaking ? (
            <ActionButton onClick={onCancel} tooltip="إيقاف">
              <StopCircleIcon className="w-5 h-5 text-red-600 animate-pulse" />
            </ActionButton>
          ) : (
            <ActionButton onClick={onSpeak} tooltip="اقرأ بصوتي">
              <VolumeUpIcon className="w-5 h-5" />
            </ActionButton>
          )}
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

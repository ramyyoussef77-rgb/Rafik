
import React from 'react';
import { Message, Sender } from '../types';
import EditIcon from './icons/EditIcon';
import CopyIcon from './icons/CopyIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import ThumbDownIcon from './icons/ThumbDownIcon';
import RefreshIcon from './icons/RefreshIcon';
import StopCircleIcon from './icons/StopCircleIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onRegenerate: (messageId: string) => void;
  onSpeak: () => void;
  onCancel: () => void;
  isSpeaking: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = React.memo(({ message, onCopy, onFeedback, onRegenerate, onSpeak, onCancel, isSpeaking }) => {
  const isUser = message.sender === Sender.USER;
  
  const bubbleClasses = isUser
    ? 'bg-[#c5cae9] dark:bg-[#3f51b5] text-stone-800 dark:text-white self-end'
    : 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 self-start';

  const ActionButton: React.FC<{ onClick: () => void; tooltip: string; children: React.ReactNode, isActive?: boolean }> = ({ onClick, tooltip, children, isActive }) => (
    <button
      onClick={onClick}
      title={tooltip}
      className={`transition-colors ${isActive ? 'text-[#283593] dark:text-indigo-400' : 'text-stone-500 dark:text-stone-400 hover:text-[#283593] dark:hover:text-indigo-400'}`}
      aria-label={tooltip}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} chat-bubble-fade-in`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl mb-2 shadow-sm break-words flex flex-col ${bubbleClasses}`}
      >
        {isUser && message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt="User upload" 
                className="rounded-t-2xl object-cover max-h-64 w-full" 
            />
        )}
        <div className="px-4 py-3">
            {isUser ? message.text : <MarkdownRenderer text={message.text} />}
            {message.streaming && <span className="blinking-cursor">|</span>}
        </div>
      </div>
      {!isUser && !message.streaming && message.text && (
        <div className="flex items-center gap-3 px-2 text-sm text-stone-500 dark:text-stone-400">
           <ActionButton onClick={() => alert('ميزة التعديل جاية قريب يا غالي!')} tooltip="عدّل الإجابة">
            <EditIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onCopy(message.text)} tooltip="انسخ الكلام ده">
            <CopyIcon className="w-5 h-5" />
          </ActionButton>
          {isSpeaking ? (
            <ActionButton onClick={onCancel} tooltip="كفاية كلام">
              <StopCircleIcon className="w-5 h-5 text-red-600 animate-pulse" />
            </ActionButton>
          ) : (
            <ActionButton onClick={onSpeak} tooltip="شغّل الصوت">
              <VolumeUpIcon className="w-5 h-5" />
            </ActionButton>
          )}
          <ActionButton onClick={() => onFeedback(message.id, 'like')} tooltip="كلام مظبوط 100%" isActive={message.feedback === 'like'}>
            <ThumbUpIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onFeedback(message.id, 'dislike')} tooltip="لأ، مش أوي" isActive={message.feedback === 'dislike'}>
            <ThumbDownIcon className="w-5 h-5" />
          </ActionButton>
          <ActionButton onClick={() => onRegenerate(message.id)} tooltip="اديني إجابة تانية">
            <RefreshIcon className="w-5 h-5" />
          </ActionButton>
        </div>
      )}
    </div>
  );
});

export default ChatBubble;

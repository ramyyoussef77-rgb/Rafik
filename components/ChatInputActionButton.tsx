import React from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface ChatInputActionButtonProps {
  userInput: string;
  hasImage: boolean;
  isThinking: boolean;
  isStreaming: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  onMicClick: () => void;
}

const ChatInputActionButton: React.FC<ChatInputActionButtonProps> = ({
  userInput,
  hasImage,
  isThinking,
  isStreaming,
  isListening,
  isSpeechSupported,
  onMicClick,
}) => {
  if (userInput.trim().length > 0 || hasImage) {
    return (
      <button
        type="submit"
        aria-label="إرسال"
        disabled={isThinking || isStreaming}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-[#283593] text-white transition-all transform hover:scale-110 disabled:bg-stone-300 disabled:cursor-not-allowed"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onMicClick}
      aria-label={isListening ? 'إيقاف الاستماع' : 'بدء التسجيل الصوتي'}
      disabled={isThinking || isStreaming || !isSpeechSupported}
      className={`flex items-center justify-center w-11 h-11 rounded-full bg-[#283593] text-white transition-all transform hover:scale-110 disabled:bg-stone-300 disabled:cursor-not-allowed ${
        isListening ? 'scale-110 shadow-lg shadow-red-500/50 animate-pulse' : ''
      }`}
    >
      <MicrophoneIcon className="w-6 h-6" />
    </button>
  );
};

export default ChatInputActionButton;
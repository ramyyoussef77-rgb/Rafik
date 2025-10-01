import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="self-start flex items-center gap-3 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-300 px-4 py-3 rounded-2xl shadow-sm">
      <div className="flex gap-1 items-center">
        <span className="w-2 h-2 bg-[#283593] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-[#283593] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-[#283593] rounded-full animate-bounce"></span>
      </div>
      <span className="text-sm">رفيق بيفكر...</span>
    </div>
  );
};

export default TypingIndicator;
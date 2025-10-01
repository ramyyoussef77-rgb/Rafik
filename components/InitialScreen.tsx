
import React from 'react';
import MoonIcon from './icons/MoonIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface InitialScreenProps {
  onListenClick: () => void;
  onPromptClick: (prompt: string) => void;
  isListening: boolean;
}

const prompts = [
  "إزاي أركز في المذاكرة؟",
  "رشّحلي فيلم مصري كوميدي",
  "إيه أحسن طريقة أروح بيها وسط البلد؟",
  "اشرحلي إزاي أعمل كوباية شاي مظبوطة",
];

const PromptChip: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-sm hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
    >
        {children}
    </button>
);

const InitialScreen: React.FC<InitialScreenProps> = React.memo(({ onListenClick, onPromptClick, isListening }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full px-4 fade-in-up">
      <div className="flex items-center gap-3 mb-4 text-4xl font-bold text-stone-700 dark:text-stone-300">
        <h1 className="tracking-wide">رفيق</h1>
        <MoonIcon className="text-[#283593] w-8 h-8" />
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-lg leading-relaxed mb-8">
        أهلاً بيك يا غالي! إزيك؟ أنا في خدمتك، اسألني في أي حاجة.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
          {prompts.map(prompt => (
              <PromptChip key={prompt} onClick={() => onPromptClick(prompt)}>
                  {prompt}
              </PromptChip>
          ))}
      </div>

      <button
        onClick={onListenClick}
        className={`bg-[#283593] hover:bg-indigo-900 text-white rounded-full p-6 shadow-lg transition-all transform hover:scale-105 ${isListening ? 'scale-105 shadow-lg shadow-red-500/50 animate-pulse' : ''}`}
        aria-label={isListening ? "وقّف المايك" : "دوس عشان تتكلم"}
      >
        <MicrophoneIcon className="w-10 h-10" />
      </button>
      <label htmlFor="chat-input" className="mt-6 text-stone-500 dark:text-stone-400">
        {isListening ? 'سامعك يا غالي، قول...' : 'دوس واتكلم، أو اكتب اللي في بالك...'}
      </label>
    </div>
  );
});

export default InitialScreen;

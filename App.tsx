import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { askRafeeq } from './services/geminiService';
import BottomNav from './components/BottomNav';
import MoonIcon from './components/icons/MoonIcon';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import SendIcon from './components/icons/SendIcon';
import ChatBubble from './components/ChatBubble';
import Toast from './components/Toast';
import { useChatHistory } from './hooks/useChatHistory';
import TrashIcon from './components/icons/TrashIcon';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import VolumeOnIcon from './components/icons/VolumeOnIcon';
import VolumeOffIcon from './components/icons/VolumeOffIcon';
import SunIcon from './components/icons/SunIcon';

// Add types for the Web Speech API to the window object to resolve TS errors.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Initialize SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// Use 'any' type for the recognition instance to avoid conflict with the 'SpeechRecognition' variable.
let recognition: any | null = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'ar-EG';
  recognition.interimResults = true;
}

const App: React.FC = () => {
  const { messages, setMessages, clearHistory } = useChatHistory();
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [toast, setToast] = useState({ message: '', show: false });
  const { speak, cancel, speakingMessageId } = useTextToSpeech();
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Use 'any' type for the recognition ref to match the instance type.
  const recognitionRef = useRef<any | null>(recognition);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const recognitionInstance = recognitionRef.current;
    if (!recognitionInstance) return;

    recognitionInstance.onstart = () => setIsListening(true);
    recognitionInstance.onend = () => setIsListening(false);
    recognitionInstance.onerror = (event: any) => {
      // Using console.warn for permission issues as it's a user action, not a code bug.
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showToast('تم رفض الوصول إلى الميكروفون. يرجى تمكينه في إعدادات المتصفح.');
      } else {
        // More generic error
        showToast('حدث خطأ في التعرّف على الصوت.');
      }
      setIsListening(false);
    };
    recognitionInstance.onresult = (event: any) => {
      // Add safety checks to prevent crashes from malformed results.
      const transcript = Array.from(event.results)
        .map((result: any) => (result && result[0] ? result[0].transcript : ''))
        .join('');
      setUserInput(transcript);
    };

    return () => {
      if (recognitionInstance.stop) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      showToast('عفواً، خاصية الصوت غير مدعومة في متصفحك.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput(''); // Clear input before starting
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isListening) {
      recognitionRef.current?.stop();
    }
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: Sender.USER,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const recentHistory = updatedMessages.slice(-9, -1); // Get last 8 messages for context
      const aiResponseText = await askRafeeq(trimmedInput, recentHistory);
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: Sender.AI,
      };
      setMessages((prev) => [...prev, newAiMessage]);
      if (isAutoSpeakEnabled) {
        speak(aiResponseText, newAiMessage.id);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عفواً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        sender: Sender.AI,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('تم النسخ إلى الحافظة');
    } catch (err) {
      showToast('فشل النسخ');
    }
  };

  const handleFeedback = (feedback: 'like' | 'dislike') => {
    if (feedback === 'like') {
      showToast('شكرًا لتقديرك!');
    } else {
      showToast('آسف، سأتحسن!');
    }
  };

  const handleRegenerate = async (aiMessageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === aiMessageId);
    if (messageIndex < 1 || messages[messageIndex].sender !== Sender.AI) {
      return;
    }

    const userPrompt = messages[messageIndex - 1].text;
    const historyForRegeneration = messages.slice(0, messageIndex - 1);
    const recentHistoryForRegen = historyForRegeneration.slice(-8);

    setIsLoading(true);

    try {
      const newResponseText = await askRafeeq(userPrompt, recentHistoryForRegen);
      if (isAutoSpeakEnabled) {
        speak(newResponseText, aiMessageId);
      }
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: newResponseText } : msg
        )
      );
    } catch (error) {
      showToast('عفواً، فشلت إعادة الإنشاء.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    showToast('تم مسح المحادثة');
  }
  
  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const InitialScreen = () => (
    <div className="flex flex-col items-center justify-center text-center h-full px-4">
      <div className="flex items-center gap-3 mb-4 text-4xl font-bold text-stone-700 dark:text-stone-300">
        <h1 className="tracking-wide">رفيق</h1>
        <MoonIcon className="text-[#283593] w-8 h-8"/>
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-lg leading-relaxed">
        مرحباً! أنا رفيق.
        <br />
        اسألني أي شيء بالعربية —
        <br />
        من واجباتك إلى أحوال الطقس،
        <br />
        من أوقات الصلاة إلى نصائح يومية.
      </p>
      <button 
        onClick={handleToggleListening}
        className={`mt-12 bg-[#283593] hover:bg-indigo-900 text-white rounded-full p-6 shadow-lg transition-all transform hover:scale-105 ${isListening ? 'scale-105 shadow-lg shadow-red-500/50 animate-pulse' : ''}`}
        aria-label={isListening ? "إيقاف الاستماع" : "ابدأ المحادثة بالصوت"}
      >
        <MicrophoneIcon className="w-10 h-10" />
      </button>
       <label htmlFor="chat-input" className="mt-6 text-stone-500 dark:text-stone-400">
        {isListening ? 'رفيق يسمعك الآن...' : 'اضغط واسألني أو اكتب سؤالك هنا...'}
       </label>
       <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
        جرّب: ‘يا رفيق، كيف أركز في المذاكرة؟’
       </p>
    </div>
  );

  const ActionButton = () => {
    const hasText = userInput.trim().length > 0;
  
    if (hasText) {
      return (
        <button
          type="submit"
          aria-label="إرسال"
          disabled={isLoading}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-[#283593] text-white transition-all duration-200 ease-in-out disabled:bg-stone-300 disabled:cursor-not-allowed transform hover:scale-110"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      );
    }
  
    return (
      <button
        type="button"
        onClick={handleToggleListening}
        aria-label={isListening ? "إيقاف الاستماع" : "بدء التسجيل الصوتي"}
        disabled={isLoading || !SpeechRecognition}
        className={`flex items-center justify-center w-11 h-11 rounded-full bg-[#283593] text-white transition-all duration-200 ease-in-out transform hover:scale-110 disabled:bg-stone-300 disabled:text-stone-400 disabled:cursor-not-allowed ${
          isListening ? 'scale-110 shadow-lg shadow-red-500/50 animate-pulse' : ''
        }`}
      >
        <MicrophoneIcon className="w-6 h-6" />
      </button>
    );
  };

  return (
    <div className="bg-stone-100 dark:bg-stone-900 min-h-screen flex flex-col font-sans">
       <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
       <header className="bg-[#283593] text-white text-center p-4 shadow-md fixed top-0 w-full z-10 flex items-center justify-between">
        <div className="w-1/3 flex items-center justify-start gap-4">
            <button 
                onClick={handleThemeToggle} 
                aria-label="تبديل الوضع" 
                className="text-white hover:text-indigo-200 transition-colors"
                title="تبديل الوضع"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            <button 
                onClick={handleClearHistory} 
                aria-label="مسح المحادثة" 
                className="text-white hover:text-indigo-200 transition-colors"
                title="مسح المحادثة"
            >
                <TrashIcon className="w-6 h-6" />
            </button>
        </div>
        <h1 className="text-xl font-bold w-1/3">رفيق 🌙</h1>
        <div className="w-1/3 flex items-center justify-end">
            <button 
                onClick={() => setIsAutoSpeakEnabled(prev => !prev)} 
                aria-label={isAutoSpeakEnabled ? "إيقاف القراءة التلقائية" : "تشغيل القراءة التلقائية"}
                title={isAutoSpeakEnabled ? "إيقاف القراءة التلقائية" : "تشغيل القراءة التلقائية"}
                className="text-white hover:text-indigo-200 transition-colors"
            >
                {isAutoSpeakEnabled ? <VolumeOnIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6" />}
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-20 pb-36">
        {messages.length === 0 && !isLoading ? (
          <InitialScreen />
        ) : (
          <div className="flex flex-col flex-1 px-4 space-y-2 overflow-y-auto">
            {messages.map((msg) => {
              const isCurrentlySpeaking = msg.id === speakingMessageId;
              return (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  onCopy={handleCopy}
                  onFeedback={handleFeedback}
                  onRegenerate={handleRegenerate}
                  onSpeak={() => speak(msg.text, msg.id)}
                  onCancel={cancel}
                  isSpeaking={isCurrentlySpeaking}
                />
              )
            })}
            {isLoading && (
              <div className="self-start flex flex-col items-center justify-center gap-3 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-300 px-4 py-3 rounded-2xl shadow-sm w-full max-w-xs">
                  <div className="w-6 h-6 border-4 border-stone-300 dark:border-stone-500 border-t-[#283593] rounded-full animate-spin"></div>
                  <span>رفيق يفكّر جيدًا ليجيبك بإفادة...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-16 right-0 w-full bg-stone-100/90 dark:bg-stone-900/90 backdrop-blur-sm p-2 border-t border-stone-200 dark:border-stone-700">
        <form onSubmit={handleSendMessage} className="max-w-md mx-auto flex items-center bg-white dark:bg-stone-800 rounded-full border border-stone-300 dark:border-stone-600 shadow-sm">
          <input
            id="chat-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isListening ? "رفيق يسمعك الآن..." : "اكتب أو اسألني بصوتك..."}
            className="flex-1 bg-transparent py-3 px-4 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none"
            autoComplete="off"
            disabled={isLoading}
          />
          <div className="flex items-center p-1">
            <ActionButton />
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default App;
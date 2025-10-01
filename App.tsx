
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender } from './types';
import { streamRafeeq, generateTitle } from './services/geminiService';
import BottomNav from './components/BottomNav';
import ChatBubble from './components/ChatBubble';
import Toast from './components/Toast';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import TypingIndicator from './components/TypingIndicator';
import InitialScreen from './components/InitialScreen';
import StopButton from './components/StopButton';
import ChatInputActionButton from './components/ChatInputActionButton';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import PaperclipIcon from './components/icons/PaperclipIcon';
import XCircleIcon from './components/icons/XCircleIcon';
import { useChatSessions } from './hooks/useChatSessions';

const App: React.FC = () => {
  const { 
    sessions, 
    activeSession, 
    activeSessionId, 
    setActiveSessionId, 
    createNewSession,
    updateActiveSessionMessages,
    updateSessionTitle,
    deleteSession,
    clearAllSessions 
  } = useChatSessions();

  const [userInput, setUserInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [toast, setToast] = useState({ message: '', show: false });
  const [selectedImage, setSelectedImage] = useState<{ file: File, dataUrl: string } | null>(null);
  const { speak, cancel, speakingMessageId } = useTextToSpeech();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    error: speechError, 
    isSupported: isSpeechSupported 
  } = useSpeechRecognition();
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(() => localStorage.getItem('autoSpeak') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stopGenerationRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textBuffer = useRef<string>("");
  
  useEffect(() => {
    if (transcript) setUserInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (speechError) showToast(speechError);
  }, [speechError]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('autoSpeak', String(isAutoSpeakEnabled));
  }, [isAutoSpeakEnabled]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isThinking]);

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, data] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        resolve({ data, mimeType });
      };
      reader.onerror = error => reject(error);
    });
  };
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({ file, dataUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleListening = useCallback(() => {
    if (!isSpeechSupported) {
      showToast('المايك بتاعك شكله مش شغال على المتصفح ده.');
      return;
    }
    if (isListening) stopListening();
    else {
      setUserInput('');
      startListening();
    }
  }, [isSpeechSupported, isListening, startListening, stopListening]);
  
  const handleNewChat = useCallback(() => {
    createNewSession();
    setIsHistoryOpen(false); // Close panel on new chat
  }, [createNewSession]);
  
  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsHistoryOpen(false); // Close panel on selection
  }, [setActiveSessionId]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
    showToast('الشات اتمسح');
  }, [deleteSession]);

  const handleSendMessage = async (messageText: string) => {
    if (isListening) stopListening();
    
    const trimmedInput = messageText.trim();
    if (!trimmedInput && !selectedImage) return;
    if (!activeSession) return;

    const newUserMessage: Message = { 
      id: Date.now().toString(), 
      text: trimmedInput, 
      sender: Sender.USER,
      imageUrl: selectedImage?.dataUrl,
    };
    
    const isFirstMessage = activeSession.messages.length === 0;
    updateActiveSessionMessages(prev => [...(prev || []), newUserMessage]);
    setUserInput('');
    
    let imagePart;
    if (selectedImage) {
      try {
        const { data, mimeType } = await fileToBase64(selectedImage.file);
        imagePart = { inlineData: { data, mimeType } };
      } catch (error) {
        console.error("Error converting image:", error);
        showToast("معلش، الصورة فيها مشكلة.");
        return;
      } finally {
        setSelectedImage(null);
      }
    } else {
        setSelectedImage(null);
    }
    
    setIsThinking(true);
    stopGenerationRef.current = false;
    textBuffer.current = "";

    if (isFirstMessage && activeSessionId) {
        generateTitle(trimmedInput).then(title => {
            updateSessionTitle(activeSessionId, title);
        });
    }

    const recentHistory = activeSession.messages.slice(-9, -1);
    const stream = streamRafeeq(trimmedInput, recentHistory, imagePart);
    
    let firstChunk = true;
    const aiMessageId = (Date.now() + 1).toString();
    
    try {
        for await (const chunk of stream) {
            if (stopGenerationRef.current) break;
            
            if (firstChunk) {
                setIsThinking(false);
                setIsStreaming(true);
                const newAiMessage: Message = { id: aiMessageId, text: chunk, sender: Sender.AI, streaming: true };
                updateActiveSessionMessages(prev => [...(prev || []), newAiMessage]);
                firstChunk = false;
            } else {
                updateActiveSessionMessages(prev => (prev || []).map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
                ));
            }
            
            if (isAutoSpeakEnabled && !stopGenerationRef.current) {
              textBuffer.current += chunk;
              const sentences = textBuffer.current.split(/(?<=[.!?؟\n])/);
              
              if (sentences.length > 1) {
                const completeSentences = sentences.slice(0, -1);
                textBuffer.current = sentences[sentences.length - 1];
                completeSentences.forEach(sentence => speak(sentence, aiMessageId));
              }
            }
        }
    } catch (error) {
      console.error("Streaming failed:", error);
      const errorMessage: Message = { id: aiMessageId, text: 'معلش يا غالي، حصلت مشكلة. ممكن تجرب تاني؟', sender: Sender.AI };
      updateActiveSessionMessages(prev => [...(prev || []).filter(m => m.id !== aiMessageId), errorMessage]);
    } finally {
        setIsThinking(false);
        setIsStreaming(false);

        if (isAutoSpeakEnabled && !stopGenerationRef.current && textBuffer.current.trim()) {
          speak(textBuffer.current, aiMessageId);
        }
        textBuffer.current = "";
        
        updateActiveSessionMessages(prev => 
            (prev || []).map(msg => msg.id === aiMessageId ? { ...msg, streaming: false } : msg)
        );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };
  
  const handlePromptClick = useCallback((prompt: string) => {
    setUserInput(prompt);
    setTimeout(() => handleSendMessage(prompt), 0);
  }, []);

  const handleStopGeneration = () => {
    stopGenerationRef.current = true;
    cancel();
  };
  
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('اتنسخ يا غالي');
    } catch (err) {
      showToast('معلش، معرفتش أنسخها');
    }
  }, []);

  const handleFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    updateActiveSessionMessages(prev => (prev || []).map(msg => {
      if (msg.id === messageId) {
        return { ...msg, feedback: msg.feedback === feedback ? undefined : feedback };
      }
      return msg;
    }));
    showToast(feedback === 'like' ? 'حبيبي تسلم!' : 'تمام، هحاول أظبطها المرة الجاية');
  }, [updateActiveSessionMessages]);

  const handleRegenerate = useCallback(async (aiMessageId: string) => {
    if (!activeSession) return;
    const messageIndex = activeSession.messages.findIndex(msg => msg.id === aiMessageId);
    if (messageIndex < 1) return;

    const userMessage = activeSession.messages[messageIndex - 1];
    const historyForRegen = activeSession.messages.slice(0, messageIndex - 1).slice(-8);

    updateActiveSessionMessages(prev => (prev || []).map(msg => 
      msg.id === aiMessageId ? { ...msg, text: '', streaming: true, feedback: undefined } : msg
    ));

    setIsStreaming(true);
    stopGenerationRef.current = false;
    textBuffer.current = "";
    
    let imagePart;
    if (userMessage.imageUrl) {
        // This requires re-fetching or storing the File object. For simplicity, we're not re-sending images on regenerate for now.
    }
    
    const stream = streamRafeeq(userMessage.text, historyForRegen, imagePart);
    try {
        for await (const chunk of stream) {
            if (stopGenerationRef.current) break;
            updateActiveSessionMessages(prev => (prev || []).map(msg => 
                msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
            ));
            
            if (isAutoSpeakEnabled && !stopGenerationRef.current) {
              textBuffer.current += chunk;
              const sentences = textBuffer.current.split(/(?<=[.!?؟\n])/);
              if (sentences.length > 1) {
                const completeSentences = sentences.slice(0, -1);
                textBuffer.current = sentences[sentences.length - 1];
                completeSentences.forEach(sentence => speak(sentence, aiMessageId));
              }
            }
        }
    } catch (error) {
      showToast('معلش، معرفتش أجيب إجابة تانية.');
    } finally {
      setIsStreaming(false);
       if (isAutoSpeakEnabled && !stopGenerationRef.current && textBuffer.current.trim()) {
          speak(textBuffer.current, aiMessageId);
        }
        textBuffer.current = "";
      updateActiveSessionMessages(prev => (prev || []).map(msg => 
        msg.id === aiMessageId ? { ...msg, streaming: false } : msg
      ));
    }
  }, [activeSession, updateActiveSessionMessages, isAutoSpeakEnabled, speak]);
  
  const handleSpeakMessage = useCallback((text: string, messageId: string) => {
    const sentences = text.split(/(?<=[.!?؟\n])/);
    sentences.forEach(sentence => {
        if (sentence.trim()) {
            speak(sentence.trim(), messageId);
        }
    });
  }, [speak]);

  const handleClearHistory = useCallback(() => {
    clearAllSessions();
    showToast('كله اتمسح يا باشا');
  }, [clearAllSessions]);

  return (
    <div className="bg-transparent min-h-screen flex flex-col font-sans">
       <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
       <Header onMenuClick={() => setIsSettingsOpen(true)} />
       <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          onThemeToggle={() => setTheme(p => p === 'light' ? 'dark' : 'light')}
          isAutoSpeakEnabled={isAutoSpeakEnabled}
          onAutoSpeakToggle={() => setIsAutoSpeakEnabled(p => !p)}
          onClearHistory={handleClearHistory}
       />
       <HistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewChat}
          onDeleteSession={handleDeleteSession}
       />

      <main className="flex-1 flex flex-col pt-20 pb-36 bg-transparent">
        {(!activeSession || activeSession.messages.length === 0) && !isThinking ? (
          <InitialScreen onListenClick={handleToggleListening} onPromptClick={handlePromptClick} isListening={isListening} />
        ) : (
          <div className="flex flex-col flex-1 px-4 space-y-2 overflow-y-auto">
            {activeSession?.messages.map((msg) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                onCopy={handleCopy}
                onFeedback={handleFeedback}
                onRegenerate={() => handleRegenerate(msg.id)}
                onSpeak={() => handleSpeakMessage(msg.text, msg.id)}
                onCancel={cancel}
                isSpeaking={msg.id === speakingMessageId}
              />
            ))}
            {isThinking && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-16 right-0 w-full bg-stone-100/90 dark:bg-stone-900/90 backdrop-blur-sm p-2 border-t border-stone-200 dark:border-stone-700">
        {isStreaming && <StopButton onClick={handleStopGeneration} />}
        {selectedImage && (
            <div className="max-w-md mx-auto flex justify-start items-center pb-2 px-2">
                <div className="relative">
                    <img src={selectedImage.dataUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-stone-800 rounded-full text-white"
                        aria-label="Remove image"
                    >
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        )}
        <form onSubmit={handleFormSubmit} className="max-w-md mx-auto flex items-center bg-white dark:bg-stone-800 rounded-full border border-stone-300 dark:border-stone-600 shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-stone-500 hover:text-[#283593] dark:text-stone-400 dark:hover:text-indigo-400"
            aria-label="Attach image"
            disabled={isThinking || isStreaming}
          >
            <PaperclipIcon className="w-6 h-6"/>
          </button>
          <input
            id="chat-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isListening ? "سامعك يا غالي، قول..." : "اكتب أو اسألني بصوتك..."}
            className="flex-1 bg-transparent py-3 px-2 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none"
            autoComplete="off"
            disabled={isThinking || isStreaming}
          />
          <div className="flex items-center p-1">
            <ChatInputActionButton 
              userInput={userInput}
              hasImage={!!selectedImage}
              isThinking={isThinking}
              isStreaming={isStreaming}
              isListening={isListening}
              isSpeechSupported={isSpeechSupported}
              onMicClick={handleToggleListening}
            />
          </div>
        </form>
      </div>

      <BottomNav onNewChat={handleNewChat} onHistoryClick={() => setIsHistoryOpen(true)} onSettingsClick={() => setIsSettingsOpen(true)} />
    </div>
  );
};

export default App;
